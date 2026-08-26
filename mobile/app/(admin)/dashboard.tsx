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
import React, { useMemo, useState } from "react";
import {
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

type Stat = { label: string; value: string; delta: string; icon: IconName };

const STATS: Record<Period, Stat[]> = {
  Today: [
    { label: "Total sales", value: "GHS 2,140", delta: "+4.2%", icon: "trending-up" },
    { label: "Orders today", value: "34", delta: "+2.6%", icon: "shopping-bag" },
    { label: "Avg order value", value: "GHS 62.90", delta: "+1.1%", icon: "activity" },
    { label: "New customers", value: "7", delta: "+3%", icon: "user-plus" },
  ],
  "This week": [
    { label: "Total sales", value: "GHS 12,480", delta: "+12.4%", icon: "trending-up" },
    { label: "Orders today", value: "184", delta: "+8.1%", icon: "shopping-bag" },
    { label: "Avg order value", value: "GHS 67.80", delta: "+2.3%", icon: "activity" },
    { label: "New customers", value: "42", delta: "+15%", icon: "user-plus" },
  ],
  "This month": [
    { label: "Total sales", value: "GHS 48,900", delta: "+9.7%", icon: "trending-up" },
    { label: "Orders today", value: "731", delta: "+6.4%", icon: "shopping-bag" },
    { label: "Avg order value", value: "GHS 66.90", delta: "+0.8%", icon: "activity" },
    { label: "New customers", value: "168", delta: "+11%", icon: "user-plus" },
  ],
};

/** The chart follows the period switcher: different buckets, not just a relabel. */
const SALES: Record<Period, Bar[]> = {
  Today: [
    { label: "9a", value: 120 }, { label: "11a", value: 260 }, { label: "1p", value: 430 },
    { label: "3p", value: 310 }, { label: "5p", value: 480 }, { label: "7p", value: 390 },
    { label: "9p", value: 150 },
  ],
  "This week": [
    { label: "Mon", value: 900 }, { label: "Tue", value: 1200 }, { label: "Wed", value: 800 },
    { label: "Thu", value: 1400 }, { label: "Fri", value: 2000 }, { label: "Sat", value: 2400 },
    { label: "Sun", value: 1800 },
  ],
  "This month": [
    { label: "W1", value: 8200 }, { label: "W2", value: 9600 },
    { label: "W3", value: 11200 }, { label: "W4", value: 12480 },
  ],
};

const CHART_SUBTITLE: Record<Period, string> = {
  Today: "Revenue by hour (GHS)",
  "This week": "Revenue, last 7 days (GHS)",
  "This month": "Revenue by week (GHS)",
};

const PEAK: Bar[] = [
  { label: "11a", value: 18 },
  { label: "1p", value: 30 },
  { label: "3p", value: 22 },
  { label: "5p", value: 38 },
  { label: "7p", value: 60 },
  { label: "9p", value: 44 },
  { label: "11p", value: 24 },
];

const BEST_SELLERS = [
  { name: "Single Cheese Burger", sold: 128 },
  { name: "Chicken Burger", sold: 96 },
  { name: "Double Cheese Burger", sold: 72 },
  { name: "Fries Regular", sold: 64 },
  { name: "Coca-Cola", sold: 58 },
];

const RECENT = [
  { id: "#1042", name: "Ama Mensah", total: "GHS 195", pay: "MoMo", status: "Preparing", time: "12:09" },
  { id: "#1041", name: "Kwesi Boateng", total: "GHS 70", pay: "Cash", status: "On the way", time: "12:01" },
  { id: "#1040", name: "Adwoa Owusu", total: "GHS 120", pay: "MoMo", status: "Delivered", time: "11:48" },
  { id: "#1039", name: "Yaw Darko", total: "GHS 100", pay: "Card", status: "New", time: "11:42" },
  { id: "#1038", name: "Akosua Frimpong", total: "GHS 35", pay: "MoMo", status: "Delivered", time: "11:30" },
];

export default function AdminDashboardScreen() {
  const router = useRouter();
  const { isPhone, isDesktop, statColumns } = useResponsive();
  const [period, setPeriod] = useState<Period>("This week");
  const [query, setQuery] = useState("");

  const stats = STATS[period];
  const maxSold = BEST_SELLERS[0].sold;

  const recent = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return RECENT;
    return RECENT.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q) ||
        r.status.toLowerCase().includes(q),
    );
  }, [query]);

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
              Monday, 30 June 2026 • Ayeduase New Site
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
      <View style={styles.statGrid}>
        {stats.map((s, i) => (
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
                <View style={styles.trendPill}>
                  <Icon name="arrow-up-right" size={11} color={Admin.green} />
                  <Text style={styles.trendText}>{s.delta}</Text>
                </View>
                <Text style={styles.trendSub}>vs last week</Text>
              </View>
            </Card>
          </FadeIn>
        ))}
      </View>

      {/* Sales + best sellers */}
      <View style={[styles.split, !isDesktop && styles.splitStacked]}>
        <FadeIn delay={120} style={isDesktop ? styles.splitMain : undefined}>
          <Card>
            <SectionTitle
              title="Sales overview"
              subtitle={CHART_SUBTITLE[period]}
              right={<Text style={styles.bigFigure}>{stats[0].value}</Text>}
            />
            <BarChart
              data={SALES[period]}
              height={isPhone ? 190 : 250}
              formatCaption={(v) => `GHS ${v}`}
            />
          </Card>
        </FadeIn>

        <FadeIn delay={180} style={isDesktop ? styles.splitSide : undefined}>
          <Card>
            <SectionTitle title="Best sellers" />
            {BEST_SELLERS.map((b, i) => (
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
            ))}
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
              <Text style={styles.empty}>No orders match “{query}”.</Text>
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
            <BarChart data={PEAK} height={isPhone ? 170 : 210} formatCaption={() => ""} />
            <View style={styles.note}>
              <View style={styles.noteDot} />
              <Text style={styles.noteText}>Busiest 7 to 8 PM, staff up</Text>
            </View>
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
