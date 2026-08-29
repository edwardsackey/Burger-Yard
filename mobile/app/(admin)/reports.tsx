import { apiFetch } from "@/api";
import { Cell, DataTable, type Column } from "@/components/admin/data-table";
import {
  FilterTabs,
  PageHeader,
  StatRow,
  styles as parts,
} from "@/components/admin/screen-parts";
import { ExportButton } from "@/components/admin/export-menu";
import {
  BarChart,
  Card,
  FadeIn,
  Icon,
  ProgressBar,
  SectionTitle,
  type Bar,
} from "@/components/admin/ui";
import { Admin } from "@/constants/admin-theme";
import { useResponsive } from "@/hooks/use-responsive";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";

type Row = { item: string; category: string; qty: number; revenue: number };

const PERIODS = ["7 days", "30 days", "90 days"];
const PERIOD_DAYS: Record<string, number> = { "7 days": 7, "30 days": 30, "90 days": 90 };

type ReportsData = {
  stats: {
    gross: number;
    completedCount: number;
    avgPrepMinutes: number | null;
    deltas: { gross: string; completedCount: string };
  };
  revenueSeries: Bar[];
  peakHours: Bar[];
  topItems: Row[];
};

export default function AdminReportsScreen() {
  const { isPhone, isDesktop } = useResponsive();
  const [period, setPeriod] = useState("7 days");
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiFetch(`/admin/reports?days=${PERIOD_DAYS[period]}`)
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

  const gross = data?.stats.gross ?? 0;
  const topItems = data?.topItems ?? [];
  const maxQty = topItems[0]?.qty ?? 1;
  const busiestLabel = useMemo(() => {
    const peaks = data?.peakHours ?? [];
    if (!peaks.length || peaks.every((p) => p.value === 0)) return null;
    return peaks.reduce((a, b) => (b.value > a.value ? b : a)).label;
  }, [data]);

  const buildExport = () => ({
    title: `Top selling items, last ${period}`,
    subtitle: `Gross GHS ${gross.toLocaleString()}`,
    columns: ["Item", "Category", "Qty sold", "Revenue"],
    rows: topItems.map((r) => [r.item, r.category, r.qty, `GHS ${r.revenue}`]),
  });

  const columns: Column<Row>[] = [
    { key: "item", header: "ITEM", flex: 2.2, mobile: "title",
      render: (r) => (
        <View style={{ gap: 6 }}>
          <Cell strong>{r.item}</Cell>
          <ProgressBar pct={(r.qty / maxQty) * 100} />
        </View>
      ) },
    { key: "category", header: "CATEGORY", flex: 1.2, mobile: "meta",
      render: (r) => (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{r.category}</Text>
        </View>
      ) },
    { key: "qty", header: "QTY SOLD", flex: 1, mobile: "meta",
      render: (r) => <Cell>{r.qty}</Cell> },
    { key: "revenue", header: "REVENUE", flex: 1.1, align: "right", mobile: "trailing",
      render: (r) => <Cell strong>GHS {r.revenue}</Cell> },
  ];

  return (
    <View style={parts.screen}>
      <ScrollView
        contentContainerStyle={[parts.scroll, isPhone && parts.scrollPhone]}
        showsVerticalScrollIndicator={false}
      >
        <PageHeader
          title="Reports & Analytics"
          subtitle={`Last ${period} · Ayeduase New Site`}
        >
          <ExportButton build={buildExport} />
        </PageHeader>

        <FadeIn delay={40}>
          <FilterTabs options={PERIODS} value={period} onChange={setPeriod} />
        </FadeIn>

        {loading && !data ? (
          <ActivityIndicator style={{ marginVertical: 30 }} color={Admin.red} />
        ) : (
          <>
            <StatRow
              stats={[
                {
                  label: "Gross revenue",
                  value: `GHS ${gross.toLocaleString()}`,
                  delta: data?.stats.deltas.gross,
                  hint: "vs previous",
                  icon: "trending-up",
                },
                {
                  label: "Orders completed",
                  value: String(data?.stats.completedCount ?? 0),
                  delta: data?.stats.deltas.completedCount,
                  hint: "vs previous",
                  icon: "check-circle",
                },
                {
                  label: "Avg prep time",
                  value:
                    data?.stats.avgPrepMinutes != null
                      ? `${data.stats.avgPrepMinutes} min`
                      : "Not tracked yet",
                  hint: data?.stats.avgPrepMinutes != null ? "Target under 18" : "No completed orders with timing data yet",
                  icon: "clock",
                },
              ]}
            />

            <View style={[dash.split, !isDesktop && dash.splitStacked]}>
              <FadeIn delay={110} style={isDesktop ? dash.main : undefined}>
                <Card>
                  <SectionTitle
                    title="Revenue trend"
                    subtitle={`Last ${period} (GHS)`}
                    right={<Text style={dash.figure}>GHS {gross.toLocaleString()}</Text>}
                  />
                  <BarChart
                    data={data?.revenueSeries ?? []}
                    height={isPhone ? 190 : 250}
                    formatCaption={(v) => `${v}`}
                  />
                </Card>
              </FadeIn>

              <FadeIn delay={160} style={isDesktop ? dash.side : undefined}>
                <Card>
                  <SectionTitle title="Peak order hours" />
                  <BarChart data={data?.peakHours ?? []} height={isPhone ? 170 : 210} formatCaption={() => ""} />
                  {busiestLabel && (
                    <View style={styles.note}>
                      <Icon name="alert-circle" size={13} color={Admin.red} />
                      <Text style={styles.noteText}>Busiest around {busiestLabel}, staff up</Text>
                    </View>
                  )}
                </Card>
              </FadeIn>
            </View>

            <FadeIn delay={200}>
              <Text style={styles.tableTitle}>Top selling items</Text>
              {topItems.length === 0 ? (
                <Text style={styles.emptyText}>No orders in this period yet.</Text>
              ) : (
                <DataTable
                  columns={columns}
                  rows={topItems}
                  keyExtractor={(r) => r.item}
                />
              )}
            </FadeIn>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const dash = StyleSheet.create({
  split: { flexDirection: "row", gap: 18 },
  splitStacked: { flexDirection: "column" },
  main: { flex: 2 },
  side: { flex: 1 },
  figure: { fontSize: 17, fontWeight: "800", color: Admin.red },
});

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: Admin.divider,
  },
  badgeText: { fontSize: 11, fontWeight: "600", color: Admin.textMuted },
  note: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Admin.divider,
    borderRadius: 9,
    padding: 11,
    marginTop: 14,
  },
  noteText: { fontSize: 12, color: Admin.text, fontWeight: "600" },
  tableTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Admin.text,
    marginBottom: 12,
  },
  emptyText: { fontSize: 13, color: Admin.textMuted, textAlign: "center", paddingVertical: 24 },
});
