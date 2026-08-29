import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../prisma';

type Period = 'today' | 'week' | 'month';

const PAYMENT_LABEL: Record<string, string> = { MOMO: 'MoMo', CARD: 'Card', CASH: 'Cash' };
const STATUS_LABEL: Record<string, string> = {
  NEW: 'New',
  PREPARING: 'Preparing',
  READY: 'Ready',
  OUT_FOR_DELIVERY: 'Out for delivery',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function startOfWeek(d: Date): Date {
  const s = startOfDay(d);
  const mondayOffset = (s.getDay() + 6) % 7; // getDay(): Sun=0 -> we want Mon=0
  s.setDate(s.getDate() - mondayOffset);
  return s;
}

/** Current + previous equivalent window, so a delta can be computed. */
function getRanges(period: Period, now: Date) {
  if (period === 'today') {
    const start = startOfDay(now);
    const prevStart = new Date(start);
    prevStart.setDate(prevStart.getDate() - 1);
    return { start, end: now, prevStart, prevEnd: start };
  }
  if (period === 'week') {
    const start = startOfWeek(now);
    const prevStart = new Date(start);
    prevStart.setDate(prevStart.getDate() - 7);
    return { start, end: now, prevStart, prevEnd: start };
  }
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return { start, end: now, prevStart, prevEnd: start };
}

/** "+12.4%" / "-3.0%" / "+100%" (from zero) / "0%" (flat at zero). */
function pctDelta(curr: number, prev: number): string {
  if (prev === 0) return curr > 0 ? '+100%' : '0%';
  const pct = ((curr - prev) / prev) * 100;
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
}

export const getDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const period = (['today', 'week', 'month'].includes(req.query.period as string)
      ? req.query.period
      : 'week') as Period;
    const now = new Date();
    const { start, end, prevStart, prevEnd } = getRanges(period, now);

    const [orders, prevOrders, newCustomers, prevNewCustomers, recentOrdersRaw] = await Promise.all([
      prisma.order.findMany({
        where: { createdAt: { gte: start, lte: end }, status: { not: 'CANCELLED' } },
        include: { orderItems: { include: { menuItem: true } } },
      }),
      prisma.order.findMany({
        where: { createdAt: { gte: prevStart, lt: prevEnd }, status: { not: 'CANCELLED' } },
        select: { total_amount: true },
      }),
      prisma.user.count({ where: { role: 'CUSTOMER', createdAt: { gte: start, lte: end } } }),
      prisma.user.count({ where: { role: 'CUSTOMER', createdAt: { gte: prevStart, lt: prevEnd } } }),
      prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        take: 6,
        include: { user: { select: { name: true } } },
      }),
    ]);

    const totalSales = orders.reduce((s, o) => s + o.total_amount, 0);
    const prevSales = prevOrders.reduce((s, o) => s + o.total_amount, 0);
    const ordersCount = orders.length;
    const avgOrderValue = ordersCount ? totalSales / ordersCount : 0;
    const prevAvgOrderValue = prevOrders.length ? prevSales / prevOrders.length : 0;

    const stats = {
      totalSales,
      ordersCount,
      avgOrderValue: Math.round(avgOrderValue * 100) / 100,
      newCustomers,
      deltas: {
        totalSales: pctDelta(totalSales, prevSales),
        ordersCount: pctDelta(ordersCount, prevOrders.length),
        avgOrderValue: pctDelta(avgOrderValue, prevAvgOrderValue),
        newCustomers: pctDelta(newCustomers, prevNewCustomers),
      },
    };

    // Revenue series — bucketed to match how each period is naturally read.
    let salesSeries: { label: string; value: number }[];
    if (period === 'today') {
      const buckets = [
        { label: '9a', start: 9, end: 11 },
        { label: '11a', start: 11, end: 13 },
        { label: '1p', start: 13, end: 15 },
        { label: '3p', start: 15, end: 17 },
        { label: '5p', start: 17, end: 19 },
        { label: '7p', start: 19, end: 21 },
        { label: '9p', start: 21, end: 23 },
      ];
      salesSeries = buckets.map((b) => ({
        label: b.label,
        value: orders
          .filter((o) => {
            const h = new Date(o.createdAt).getHours();
            return h >= b.start && h < b.end;
          })
          .reduce((s, o) => s + o.total_amount, 0),
      }));
    } else if (period === 'week') {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      salesSeries = days.map((label, i) => ({
        label,
        value: orders
          .filter((o) => (new Date(o.createdAt).getDay() + 6) % 7 === i)
          .reduce((s, o) => s + o.total_amount, 0),
      }));
    } else {
      const weekIndexOf = (d: Date) => Math.floor((d.getDate() - 1) / 7);
      const weekCount = Math.max(0, ...orders.map((o) => weekIndexOf(new Date(o.createdAt)))) + 1;
      salesSeries = Array.from({ length: weekCount }, (_, i) => ({
        label: `W${i + 1}`,
        value: orders
          .filter((o) => weekIndexOf(new Date(o.createdAt)) === i)
          .reduce((s, o) => s + o.total_amount, 0),
      }));
    }

    // Best sellers, by quantity, within the selected period.
    const soldByItem = new Map<string, number>();
    for (const order of orders) {
      for (const item of order.orderItems) {
        soldByItem.set(item.menuItem.name, (soldByItem.get(item.menuItem.name) ?? 0) + item.quantity);
      }
    }
    const bestSellers = [...soldByItem.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, sold]) => ({ name, sold }));

    // Peak hours — order *count* by hour-of-day within the selected period.
    const peakBuckets = [
      { label: '11a', start: 9, end: 11 },
      { label: '1p', start: 11, end: 13 },
      { label: '3p', start: 13, end: 15 },
      { label: '5p', start: 15, end: 17 },
      { label: '7p', start: 17, end: 19 },
      { label: '9p', start: 19, end: 21 },
      { label: '11p', start: 21, end: 23 },
    ];
    const peakHours = peakBuckets.map((b) => ({
      label: b.label,
      value: orders.filter((o) => {
        const h = new Date(o.createdAt).getHours();
        return h >= b.start && h < b.end;
      }).length,
    }));

    const recentOrders = recentOrdersRaw.map((o) => ({
      id: `#${o.id}`,
      name: o.user?.name ?? 'Customer',
      total: `GHS ${o.total_amount}`,
      pay: PAYMENT_LABEL[o.paymentMethod] ?? o.paymentMethod,
      status: STATUS_LABEL[o.status] ?? o.status,
      time: new Date(o.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
    }));

    res.json({ stats, salesSeries, bestSellers, peakHours, recentOrders });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
