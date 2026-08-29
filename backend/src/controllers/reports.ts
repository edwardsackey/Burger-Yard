import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../prisma';

const VALID_DAYS = [7, 30, 90];

/** "+12.4%" / "-3.0%" / "+100%" (from zero) / "0%" (flat at zero). */
function pctDelta(curr: number, prev: number): string {
  if (prev === 0) return curr > 0 ? '+100%' : '0%';
  const pct = ((curr - prev) / prev) * 100;
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export const getReports = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const days = VALID_DAYS.includes(Number(req.query.days)) ? Number(req.query.days) : 7;
    const now = new Date();
    const start = new Date(now.getTime() - days * DAY_MS);
    const prevStart = new Date(start.getTime() - days * DAY_MS);

    const [orders, prevOrders] = await Promise.all([
      prisma.order.findMany({
        where: { createdAt: { gte: start, lte: now }, status: { not: 'CANCELLED' } },
        include: { orderItems: { include: { menuItem: true } } },
      }),
      prisma.order.findMany({
        where: { createdAt: { gte: prevStart, lt: start }, status: { not: 'CANCELLED' } },
        select: { total_amount: true, status: true },
      }),
    ]);

    const gross = orders.reduce((s, o) => s + o.total_amount, 0);
    const prevGross = prevOrders.reduce((s, o) => s + o.total_amount, 0);
    const completed = orders.filter((o) => o.status === 'COMPLETED');
    const prevCompletedCount = prevOrders.filter((o) => o.status === 'COMPLETED').length;

    const prepTimes = completed
      .filter((o) => o.acceptedAt && o.readyAt)
      .map((o) => (new Date(o.readyAt!).getTime() - new Date(o.acceptedAt!).getTime()) / 60000);
    const avgPrepMinutes = prepTimes.length
      ? Math.round(prepTimes.reduce((s, m) => s + m, 0) / prepTimes.length)
      : null;

    const stats = {
      gross,
      completedCount: completed.length,
      avgPrepMinutes,
      deltas: {
        gross: pctDelta(gross, prevGross),
        completedCount: pctDelta(completed.length, prevCompletedCount),
      },
    };

    // Revenue trend — bucket width scales with the window so the chart stays
    // readable: daily for a week, weekly for a month, monthly for a quarter.
    let revenueSeries: { label: string; value: number }[];
    if (days === 7) {
      revenueSeries = Array.from({ length: 7 }, (_, i) => {
        const day = new Date(start.getTime() + i * DAY_MS);
        const label = day.toLocaleDateString([], { weekday: 'short' });
        const value = orders
          .filter((o) => {
            const t = new Date(o.createdAt).getTime();
            return t >= day.getTime() && t < day.getTime() + DAY_MS;
          })
          .reduce((s, o) => s + o.total_amount, 0);
        return { label, value };
      });
    } else if (days === 30) {
      const bucketCount = Math.ceil(days / 7);
      revenueSeries = Array.from({ length: bucketCount }, (_, i) => {
        const bucketStart = start.getTime() + i * 7 * DAY_MS;
        const bucketEnd = Math.min(bucketStart + 7 * DAY_MS, now.getTime());
        const value = orders
          .filter((o) => {
            const t = new Date(o.createdAt).getTime();
            return t >= bucketStart && t < bucketEnd;
          })
          .reduce((s, o) => s + o.total_amount, 0);
        return { label: `W${i + 1}`, value };
      });
    } else {
      const months: string[] = [];
      const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
      while (cursor.getTime() <= now.getTime()) {
        months.push(cursor.toLocaleDateString([], { month: 'short' }));
        cursor.setMonth(cursor.getMonth() + 1);
      }
      revenueSeries = months.map((label, i) => {
        const monthStart = new Date(start.getFullYear(), start.getMonth() + i, 1);
        const monthEnd = new Date(start.getFullYear(), start.getMonth() + i + 1, 1);
        const value = orders
          .filter((o) => {
            const t = new Date(o.createdAt).getTime();
            return t >= monthStart.getTime() && t < monthEnd.getTime();
          })
          .reduce((s, o) => s + o.total_amount, 0);
        return { label, value };
      });
    }

    // Peak order hours across the whole window.
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

    // Top selling items by quantity, within the window.
    const byItem = new Map<string, { category: string; qty: number; revenue: number }>();
    for (const order of orders) {
      for (const item of order.orderItems) {
        const key = item.menuItem.name;
        const entry = byItem.get(key) ?? {
          category: item.menuItem.category ?? 'Uncategorized',
          qty: 0,
          revenue: 0,
        };
        entry.qty += item.quantity;
        entry.revenue += item.price_at_time_of_order * item.quantity;
        byItem.set(key, entry);
      }
    }
    const topItems = [...byItem.entries()]
      .sort((a, b) => b[1].qty - a[1].qty)
      .slice(0, 10)
      .map(([item, v]) => ({ item, category: v.category, qty: v.qty, revenue: v.revenue }));

    res.json({ stats, revenueSeries, peakHours, topItems });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
