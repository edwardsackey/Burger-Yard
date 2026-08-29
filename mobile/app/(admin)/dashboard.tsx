import { apiFetch } from "@/api";
import {
  BarChart,
  Card,
  FadeIn,
  Icon,
  ProgressBar,
  SectionTitle,
  StatusPill,
  type Bar,
  type IconName,
} from "@/components/admin/ui";
import { ExportButton } from "@/components/admin/export-menu";
import { Admin } from "@/constants/admin-theme";
import { imageForName } from "@/constants/menu-catalog";
import { useResponsive } from "@/hooks/use-responsive";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const PERIODS = ["Today", "This week", "This month"] as const;
type Period = (typeof PERIODS)[number];
const PERIOD_PARAM: Record<Period, string> = {
  Today: "today",
  "This week": "week",
  "This month": "month",
};

type Stat = { label: string; value: string; delta: string; icon: IconName };
type RecentOrder = { id: string; name: string; total: string; pay: string; status: string; time: string };
type BestSeller = { name: string; sold: number };

type DashboardData = {
  stats: {
    totalSales: number;
    ordersCount: number;
    avgOrderValue: number;
    newCustomers: number;
    deltas: Record<"totalSales" | "ordersCount" | "avgOrderValue" | "newCustomers", string>;
  };
  salesSeries: Bar[];
  bestSellers: BestSeller[];
  peakHours: Bar[];
  recentOrders: RecentOrder[];
};

const CHART_SUBTITLE: Record<Period, string> = {
  Today: "Revenue by hour (GHS)",
  "This week": "Revenue, last 7 days (GHS)",
  "This month": "Revenue by week (GHS)",
};

function buildStats(data: DashboardData): Stat[] {
  const { stats } = data;
  return [
    { label: "Total sales", value: `GHS ${stats.totalSales.toLocaleString()}`, delta: stats.deltas.totalSales, icon: "trending-up" },
    { label: "Orders", value: String(stats.ordersCount), delta: stats.deltas.ordersCount, icon: "shopping-bag" },
    { label: "Avg order value", value: `GHS ${stats.avgOrderValue.toFixed(2)}`, delta: stats.deltas.avgOrderValue, icon: "activity" },
    { label: "New customers", value: String(stats.newCustomers), delta: stats.deltas.newCustomers, icon: "user-plus" },
  ];
}

export default function AdminDashboardScreen() {
  const router = useRouter();
  const { isPhone, isDesktop, statColumns } = useResponsive();
  const [period, setPeriod] = useState<Period>("This week");
  const [query, setQuery] = useState("");
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiFetch(`/admin/dashboard?period=${PERIOD_PARAM[period]}`)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        // Left as the previous period's data, if any — the screen still works.
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [period]);

  const stats = data ? buildStats(data) : [];
  const bestSellers = data?.bestSellers ?? [];
  const maxSold = bestSellers[0]?.sold ?? 1;
  const recentOrders = data?.recentOrders ?? [];
  const busiestLabel = useMemo(() => {
    const peaks = data?.peakHours ?? [];
    if (!peaks.length || peaks.every((p) => p.value === 0)) return null;
    return peaks.reduce((a, b) => (b.value > a.value ? b : a)).label;
  }, [data]);

  const recent = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return recentOrders;
    return recentOrders.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q) ||
        r.status.toLowerCase().includes(q),
    );
  }, [query, recentOrders]);

  const buildExport = () => ({
    title: `Recent orders, ${period}`,
    subtitle: "Ayeduase New Site",
    columns: ["Order", "Customer", "Total", "Payment", "Status", "Time"],
    rows: recent.map((r) => [r.id, r.name, r.total, r.pay, r.status, r.time]),
  });

  return (
    <ScrollView
      contentContainerStyle={[styles.container, isPhone && styles.containerPhone]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <FadeIn>
        <View style={[styles.topBar, !isDesktop && styles.topBarStacked]}>
          <View style={{ flex: 1, minWidth: 220 }}>
            <Text style={styles.headerTitle}>Dashboard</Text>
            <Text style={styles.headerSub}>
              {new Date().toLocaleDateString([], { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              {" • Ayeduase New Site"}
            </Text>
          </View>

          <View style={[styles.controls, !isDesktop && styles.controlsWrap]}>
            <View style={[styles.search, isPhone && styles.searchPhone]}>
              <Icon name="search" size={15} color={Admin.textFaint} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search orders, items..."
                placeholderTextColor={Admin.textFaint}
                value={query}
                onChangeText={setQuery}
              />
              {query.length > 0 && (
                <Pressable onPress={() => setQuery("")} accessibilityLabel="Clear search">
                  <Icon name="x" size={14} color={Admin.textFaint} />
                </Pressable>
              )}
            </View>

            <View style={styles.periodGroup}>
              {PERIODS.map((p) => (
                <Pressable
                  key={p}
                  onPress={() => setPeriod(p)}
                  style={[styles.periodBtn, period === p && styles.periodBtnActive]}
                >
                  <Text
                    style={[styles.periodText, period === p && styles.periodTextActive]}
                  >
                    {p}
                  </Text>
                </Pressable>
              ))}
            </View>

            <ExportButton build={buildExport} />
          </View>
        </View>
      </FadeIn>

      {/* Stat cards */}
      {loading && !data ? (
        <ActivityIndicator style={{ marginVertical: 30 }} color={Admin.red} />
      ) : (
        <View style={styles.statGrid}>
          {stats.map((s, i) => {
            const isDown = s.delta.trim().startsWith("-");
            return (
              <FadeIn
                key={s.label}
                delay={60 * i}
                style={[styles.statCell, { width: `${100 / statColumns}%` as const }]}
              >
                <Card style={styles.statCard}>
                  <View style={styles.statHead}>
                    <Text style={styles.statLabel}>{s.label}</Text>
                    <View style={styles.statIcon}>
                      <Icon name={s.icon} size={14} color={Admin.red} />
                    </View>
                  </View>
                  <Text style={styles.statValue}>{s.value}</Text>
                  <View style={styles.trendRow}>
                    <View style={[styles.trendPill, isDown && styles.trendPillDown]}>
                      <Icon
                        name={isDown ? "arrow-down-right" : "arrow-up-right"}
                        size={11}
                        color={isDown ? Admin.red : Admin.green}
                      />
                      <Text style={[styles.trendText, isDown && styles.trendTextDown]}>{s.delta}</Text>
                    </View>
                    <Text style={styles.trendSub}>
                      vs {period === "Today" ? "yesterday" : period === "This week" ? "last week" : "last month"}
                    </Text>
                  </View>
                </Card>
              </FadeIn>
            );
          })}
        </View>
      )}

      {/* Sales + best sellers */}
      <View style={[styles.split, !isDesktop && styles.splitStacked]}>
        <FadeIn delay={120} style={isDesktop ? styles.splitMain : undefined}>
          <Card>
            <SectionTitle
              title="Sales overview"
              subtitle={CHART_SUBTITLE[period]}
              right={<Text style={styles.bigFigure}>{stats[0]?.value ?? "—"}</Text>}
            />
            <BarChart
              data={data?.salesSeries ?? []}
              height={isPhone ? 190 : 250}
              formatCaption={(v) => `GHS ${v}`}
            />
          </Card>
        </FadeIn>

        <FadeIn delay={180} style={isDesktop ? styles.splitSide : undefined}>
          <Card>
            <SectionTitle title="Best sellers" />
            {bestSellers.length === 0 && !loading ? (
              <Text style={styles.empty}>No orders in this period yet.</Text>
            ) : (
              bestSellers.map((b, i) => (
              <View key={b.name} style={styles.sellerRow}>
                <View style={styles.sellerThumbWrap}>
                  <Image
                    source={imageForName(b.name)}
                    style={styles.sellerThumb}
                    resizeMode="cover"
                  />
                  <View style={styles.rank}>
                    <Text style={styles.rankText}>{i + 1}</Text>
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.sellerHead}>
                    <Text style={styles.sellerName} numberOfLines={1}>
                      {b.name}
                    </Text>
                    <Text style={styles.sellerSold}>{b.sold} sold</Text>
                  </View>
                  <ProgressBar pct={(b.sold / maxSold) * 100} />
                </View>
              </View>
              ))
            )}
          </Card>
        </FadeIn>
      </View>

      {/* Recent orders + peak hours */}
      <View style={[styles.split, !isDesktop && styles.splitStacked]}>
        <FadeIn delay={220} style={isDesktop ? styles.splitMain : undefined}>
          <Card>
            <SectionTitle
              title="Recent orders"
              right={
                <Pressable onPress={() => router.push("/(admin)/orders")}>
                  <Text style={styles.viewAll}>View all</Text>
                </Pressable>
              }
            />

            {!isPhone && (
              <View style={styles.tableHeader}>
                <Text style={[styles.th, { flex: 1 }]}>ORDER</Text>
                <Text style={[styles.th, { flex: 2 }]}>CUSTOMER</Text>
                <Text style={[styles.th, { flex: 1 }]}>TOTAL</Text>
                <Text style={[styles.th, { flex: 1 }]}>PAYMENT</Text>
                <Text style={[styles.th, { flex: 1.2 }]}>STATUS</Text>
                <Text style={[styles.th, { flex: 0.8 }]}>TIME</Text>
              </View>
            )}

            {recent.length === 0 ? (
              <Text style={styles.empty}>
                {query ? `No orders match “${query}”.` : "No recent orders yet."}
              </Text>
            ) : (
              recent.map((o) =>
                isPhone ? (
                  // On a phone the table becomes a stack of cards, which is the
                  // only way six columns stay readable.
                  <Pressable
                    key={o.id}
                    onPress={() => router.push("/(admin)/orders")}
                    style={styles.mobileRow}
                  >
                    <View style={styles.mobileRowTop}>
                      <Text style={styles.mobileId}>{o.id}</Text>
                      <StatusPill status={o.status} />
                    </View>
                    <Text style={styles.mobileName}>{o.name}</Text>
                    <View style={styles.mobileMeta}>
                      <Text style={styles.mobileMetaText}>{o.total}</Text>
                      <Text style={styles.dot}>•</Text>
                      <Text style={styles.mobileMetaText}>{o.pay}</Text>
                      <Text style={styles.dot}>•</Text>
                      <Text style={styles.mobileMetaText}>{o.time}</Text>
                    </View>
                  </Pressable>
                ) : (
                  <Pressable
                    key={o.id}
                    onPress={() => router.push("/(admin)/orders")}
                    style={styles.tableRow}
                  >
                    <Text style={[styles.td, styles.tdStrong, { flex: 1 }]}>{o.id}</Text>
                    <Text style={[styles.td, { flex: 2 }]}>{o.name}</Text>
                    <Text style={[styles.td, styles.tdStrong, { flex: 1 }]}>{o.total}</Text>
                    <Text style={[styles.td, { flex: 1 }]}>{o.pay}</Text>
                    <View style={{ flex: 1.2 }}>
                      <StatusPill status={o.status} />
                    </View>
                    <Text style={[styles.td, { flex: 0.8 }]}>{o.time}</Text>
                  </Pressable>
                ),
              )
            )}
          </Card>
        </FadeIn>

        <FadeIn delay={260} style={isDesktop ? styles.splitSide : undefined}>
          <Card>
            <SectionTitle title="Peak hours" />
            <BarChart data={data?.peakHours ?? []} height={isPhone ? 170 : 210} formatCaption={() => ""} />
            {busiestLabel && (
              <View style={styles.note}>
                <View style={styles.noteDot} />
                <Text style={styles.noteText}>Busiest around {busiestLabel}, staff up</Text>
              </View>
            )}
          </Card>
        </FadeIn>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 20, backgroundColor: Admin.canvas },
  containerPhone: { padding: 14, gap: 14 },

  topBar: { flexDirection: "row", alignItems: "center", gap: 16 },
  topBarStacked: { flexDirection: "column", alignItems: "stretch" },
  headerTitle: { fontSize: 24, fontWeight: "800", color: Admin.text },
  headerSub: { fontSize: 12.5, color: Admin.textMuted, marginTop: 4 },

  controls: { flexDirection: "row", alignItems: "center", gap: 10 },
  controlsWrap: { flexWrap: "wrap", marginTop: 12 },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Admin.surface,
    borderWidth: 1,
    borderColor: Admin.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    width: 250,
  },
  searchPhone: { flex: 1, minWidth: 180, width: "auto" },
  searchInput: { flex: 1, fontSize: 13, color: Admin.text, outlineStyle: "none" } as object,

  periodGroup: {
    flexDirection: "row",
    backgroundColor: Admin.surface,
    borderWidth: 1,
    borderColor: Admin.border,
    borderRadius: 10,
    padding: 3,
    gap: 2,
  },
  periodBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 7 },
  periodBtnActive: { backgroundColor: Admin.ink },
  periodText: { fontSize: 12, fontWeight: "600", color: Admin.textMuted },
  periodTextActive: { color: "#FFFFFF" },

  statGrid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -7 },
  statCell: { paddingHorizontal: 7, paddingBottom: 14 },
  statCard: { padding: 16 },
  statHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  statLabel: { fontSize: 12.5, color: Admin.textMuted, flex: 1 },
  statIcon: {
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: Admin.redSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: { fontSize: 25, fontWeight: "800", color: Admin.text, marginTop: 12 },
  trendRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10 },
  trendPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: Admin.greenSoft,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  trendText: { fontSize: 11, fontWeight: "700", color: Admin.green },
  trendPillDown: { backgroundColor: Admin.redSoft },
  trendTextDown: { color: Admin.red },
  trendSub: { fontSize: 11, color: Admin.textFaint },

  split: { flexDirection: "row", gap: 20 },
  splitStacked: { flexDirection: "column" },
  splitMain: { flex: 2.1 },
  splitSide: { flex: 1 },
  bigFigure: { fontSize: 18, fontWeight: "800", color: Admin.red },

  sellerRow: { flexDirection: "row", alignItems: "center", gap: 11, marginBottom: 14 },
  sellerThumbWrap: { width: 40, height: 40 },
  sellerThumb: {
    width: 40,
    height: 40,
    borderRadius: 9,
    backgroundColor: Admin.divider,
  },
  rank: {
    position: "absolute",
    bottom: -3,
    right: -3,
    width: 19,
    height: 19,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Admin.surface,
    backgroundColor: Admin.red,
    alignItems: "center",
    justifyContent: "center",
  },
  rankText: { color: "#FFFFFF", fontSize: 9, fontWeight: "800" },
  sellerHead: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  sellerName: { fontSize: 13, fontWeight: "600", color: Admin.text, flex: 1 },
  sellerSold: { fontSize: 11.5, color: Admin.textMuted, marginLeft: 8 },

  tableHeader: {
    flexDirection: "row",
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Admin.divider,
  },
  th: { fontSize: 10, fontWeight: "700", color: Admin.textFaint, letterSpacing: 0.6 },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Admin.divider,
  },
  td: { fontSize: 13, color: Admin.textMuted },
  tdStrong: { fontWeight: "700", color: Admin.text },
  viewAll: { fontSize: 12.5, fontWeight: "700", color: Admin.red },
  empty: { fontSize: 13, color: Admin.textMuted, paddingVertical: 20, textAlign: "center" },

  mobileRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Admin.divider,
    gap: 6,
  },
  mobileRowTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  mobileId: { fontSize: 13, fontWeight: "800", color: Admin.text },
  mobileName: { fontSize: 13, color: Admin.text },
  mobileMeta: { flexDirection: "row", alignItems: "center", gap: 6 },
  mobileMetaText: { fontSize: 12, color: Admin.textMuted },
  dot: { fontSize: 12, color: Admin.textFaint },

  note: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Admin.divider,
    borderRadius: 9,
    padding: 11,
    marginTop: 14,
  },
  noteDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Admin.red },
  noteText: { fontSize: 12, color: Admin.text, fontWeight: "600" },
});
