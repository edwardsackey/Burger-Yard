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
import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

type Row = { item: string; category: string; qty: number; revenue: number };

const TOP_ITEMS: Row[] = [
  { item: "Single Cheese Burger", category: "Burgers", qty: 128, revenue: 8960 },
  { item: "Chicken Burger", category: "Burgers", qty: 96, revenue: 9120 },
  { item: "Double Cheese Burger", category: "Burgers", qty: 72, revenue: 7200 },
  { item: "Fries Regular", category: "Sides", qty: 64, revenue: 1600 },
  { item: "Coca-Cola", category: "Drinks", qty: 58, revenue: 580 },
];

const REVENUE: Record<string, Bar[]> = {
  "7 days": [
    { label: "Mon", value: 900 }, { label: "Tue", value: 1200 }, { label: "Wed", value: 800 },
    { label: "Thu", value: 1400 }, { label: "Fri", value: 2000 }, { label: "Sat", value: 2400 },
    { label: "Sun", value: 1800 },
  ],
  "30 days": [
    { label: "W1", value: 8200 }, { label: "W2", value: 9600 },
    { label: "W3", value: 11200 }, { label: "W4", value: 12480 },
  ],
  "90 days": [
    { label: "Apr", value: 32000 }, { label: "May", value: 38400 }, { label: "Jun", value: 41600 },
  ],
};

const PEAK: Bar[] = [
  { label: "11a", value: 18 }, { label: "1p", value: 30 }, { label: "3p", value: 22 },
  { label: "5p", value: 38 }, { label: "7p", value: 60 }, { label: "9p", value: 44 },
  { label: "11p", value: 24 },
];

const PERIODS = ["7 days", "30 days", "90 days"];

export default function AdminReportsScreen() {
  const { isPhone, isDesktop } = useResponsive();
  const [period, setPeriod] = useState("7 days");

  const data = REVENUE[period];
  const gross = data.reduce((s, d) => s + d.value, 0);
  const maxQty = TOP_ITEMS[0].qty;

  const buildExport = () => ({
    title: `Top selling items, last ${period}`,
    subtitle: `Gross GHS ${gross.toLocaleString()}`,
    columns: ["Item", "Category", "Qty sold", "Revenue"],
    rows: TOP_ITEMS.map((r) => [r.item, r.category, r.qty, `GHS ${r.revenue}`]),
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

        <StatRow
          stats={[
            { label: "Gross revenue", value: `GHS ${gross.toLocaleString()}`, delta: "+12.4%", hint: "vs previous", icon: "trending-up" },
            { label: "Orders completed", value: "184", delta: "+8.1%", hint: "vs previous", icon: "check-circle" },
            { label: "Avg prep time", value: "14 min", hint: "Target under 18", icon: "clock" },
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
                data={data}
                height={isPhone ? 190 : 250}
                formatCaption={(v) => `${v}`}
              />
            </Card>
          </FadeIn>

          <FadeIn delay={160} style={isDesktop ? dash.side : undefined}>
            <Card>
              <SectionTitle title="Peak order hours" />
              <BarChart data={PEAK} height={isPhone ? 170 : 210} formatCaption={() => ""} />
              <View style={styles.note}>
                <Icon name="alert-circle" size={13} color={Admin.red} />
                <Text style={styles.noteText}>Busiest 7 to 8 PM, staff up</Text>
              </View>
            </Card>
          </FadeIn>
        </View>

        <FadeIn delay={200}>
          <Text style={styles.tableTitle}>Top selling items</Text>
          <DataTable
            columns={columns}
            rows={TOP_ITEMS}
            keyExtractor={(r) => r.item}
          />
        </FadeIn>
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
});
