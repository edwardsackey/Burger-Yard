import { Cell, DataTable, type Column } from "@/components/admin/data-table";
import {
  FilterTabs,
  PageHeader,
  SearchBox,
  StatRow,
  styles as parts,
} from "@/components/admin/screen-parts";
import { ExportButton } from "@/components/admin/export-menu";
import { FadeIn, StatusPill } from "@/components/admin/ui";
import { useResponsive } from "@/hooks/use-responsive";
import React, { useMemo, useState } from "react";
import { ScrollView, View } from "react-native";

type Txn = {
  id: string;
  order: string;
  customer: string;
  method: "MoMo" | "Card" | "Cash";
  amount: number;
  status: "Paid" | "Pending" | "Failed" | "Refunded";
  time: string;
};

const TXNS: Txn[] = [
  { id: "TXN-88421", order: "#1042", customer: "Ama Mensah", method: "MoMo", amount: 195, status: "Paid", time: "12:09" },
  { id: "TXN-88420", order: "#1041", customer: "Kwesi Boateng", method: "Cash", amount: 70, status: "Pending", time: "12:01" },
  { id: "TXN-88419", order: "#1040", customer: "Adwoa Owusu", method: "MoMo", amount: 120, status: "Paid", time: "11:48" },
  { id: "TXN-88418", order: "#1039", customer: "Yaw Darko", method: "Card", amount: 100, status: "Failed", time: "11:42" },
  { id: "TXN-88417", order: "#1038", customer: "Akosua Frimpong", method: "MoMo", amount: 35, status: "Paid", time: "11:30" },
  { id: "TXN-88416", order: "#1037", customer: "Kofi Antwi", method: "Card", amount: 105, status: "Refunded", time: "11:12" },
];

const FILTERS = ["All", "Paid", "Pending", "Failed", "Refunded"];

export default function AdminPaymentsScreen() {
  const { isPhone } = useResponsive();
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");

  const counts = useMemo(() => {
    const map: Record<string, number> = { All: TXNS.length };
    FILTERS.slice(1).forEach((f) => {
      map[f] = TXNS.filter((t) => t.status === f).length;
    });
    return map;
  }, []);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return TXNS.filter((t) => {
      const inFilter = filter === "All" || t.status === filter;
      const matches =
        !q ||
        t.id.toLowerCase().includes(q) ||
        t.order.toLowerCase().includes(q) ||
        t.customer.toLowerCase().includes(q);
      return inFilter && matches;
    });
  }, [filter, query]);

  const collected = TXNS.filter((t) => t.status === "Paid").reduce((s, t) => s + t.amount, 0);
  const cash = TXNS.filter((t) => t.method === "Cash").reduce((s, t) => s + t.amount, 0);
  const pending = TXNS.filter((t) => t.status === "Pending").reduce((s, t) => s + t.amount, 0);

  const buildExport = () => ({
    title: `Payments, ${filter}`,
    subtitle: "Today · Ayeduase New Site",
    columns: ["Txn ID", "Order", "Customer", "Method", "Amount", "Status", "Time"],
    rows: rows.map((r) => [r.id, r.order, r.customer, r.method, `GHS ${r.amount}`, r.status, r.time]),
  });

  const columns: Column<Txn>[] = [
    { key: "id", header: "TXN ID", flex: 1.4, mobile: "title",
      render: (r) => <Cell strong>{r.id}</Cell> },
    { key: "order", header: "ORDER", flex: 0.9, mobile: "meta",
      render: (r) => <Cell>{r.order}</Cell> },
    { key: "customer", header: "CUSTOMER", flex: 1.6, mobile: "meta",
      render: (r) => <Cell>{r.customer}</Cell> },
    { key: "method", header: "METHOD", flex: 1, mobile: "meta",
      render: (r) => <Cell>{r.method}</Cell> },
    { key: "amount", header: "AMOUNT", flex: 1, mobile: "trailing",
      render: (r) => <Cell strong>GHS {r.amount}</Cell> },
    { key: "status", header: "STATUS", flex: 1.2,
      render: (r) => <StatusPill status={r.status} /> },
    { key: "time", header: "TIME", flex: 0.8, align: "right", mobile: "meta",
      render: (r) => <Cell muted>{r.time}</Cell> },
  ];

  return (
    <View style={parts.screen}>
      <ScrollView
        contentContainerStyle={[parts.scroll, isPhone && parts.scrollPhone]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <PageHeader
          title="Payments & Revenue"
          subtitle="Today · Ayeduase New Site"
        >
          <SearchBox
            value={query}
            onChange={setQuery}
            placeholder="Search txn, order or name..."
          />
          <ExportButton build={buildExport} />
        </PageHeader>

        <StatRow
          stats={[
            { label: "Total collected today", value: `GHS ${collected}`, delta: "+9.2%", hint: "vs yesterday", icon: "credit-card" },
            { label: "Cash collections", value: `GHS ${cash}`, hint: "Reconcile at close", icon: "dollar-sign" },
            { label: "Awaiting payment", value: `GHS ${pending}`, hint: `${counts.Pending} orders`, icon: "clock" },
          ]}
        />

        <FadeIn delay={90}>
          <FilterTabs options={FILTERS} value={filter} onChange={setFilter} counts={counts} />
        </FadeIn>

        <FadeIn delay={130}>
          <DataTable
            columns={columns}
            rows={rows}
            keyExtractor={(r) => r.id}
            emptyText={`No ${filter.toLowerCase()} transactions.`}
          />
        </FadeIn>
      </ScrollView>
    </View>
  );
}
