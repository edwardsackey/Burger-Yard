import { apiFetch } from "@/api";
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
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";

type Status = "Paid" | "Awaiting payment" | "Cash on delivery" | "Cancelled";

type Row = {
  id: number;
  customer: string;
  method: string;
  momoNetwork: string | null;
  amount: number;
  paid: boolean;
  cancelled: boolean;
  time: string;
  rider: string | null;
};

type PaymentsData = {
  rows: Row[];
  stats: { collected: number; cashOutstanding: number; awaitingAmount: number; awaitingCount: number };
};

const METHOD_LABEL: Record<string, string> = { MOMO: "MoMo", CARD: "Card", CASH: "Cash" };
const FILTERS: Status[] = ["Paid", "Awaiting payment", "Cash on delivery", "Cancelled"];

function statusOf(row: Row): Status {
  if (row.cancelled) return "Cancelled";
  if (row.paid) return "Paid";
  return row.method === "CASH" ? "Cash on delivery" : "Awaiting payment";
}

function methodLabel(row: Row): string {
  const base = METHOD_LABEL[row.method] ?? row.method;
  return row.momoNetwork ? `${base} · ${row.momoNetwork}` : base;
}

export default function AdminPaymentsScreen() {
  const { isPhone } = useResponsive();
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [data, setData] = useState<PaymentsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/admin/payments")
      .then(setData)
      .catch(() => {
        // Left empty — the empty state covers this fine.
      })
      .finally(() => setLoading(false));
  }, []);

  const allRows = data?.rows ?? [];

  const counts = useMemo(() => {
    const map: Record<string, number> = { All: allRows.length };
    FILTERS.forEach((f) => {
      map[f] = allRows.filter((r) => statusOf(r) === f).length;
    });
    return map;
  }, [allRows]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allRows.filter((r) => {
      const inFilter = filter === "All" || statusOf(r) === filter;
      const matches =
        !q ||
        String(r.id).includes(q) ||
        r.customer.toLowerCase().includes(q);
      return inFilter && matches;
    });
  }, [allRows, filter, query]);

  const buildExport = () => ({
    title: `Payments, ${filter}`,
    subtitle: "The Burger Yard",
    columns: ["Order", "Customer", "Method", "Amount", "Status", "Rider", "Time"],
    rows: rows.map((r) => [
      `#${r.id}`,
      r.customer,
      methodLabel(r),
      `GHS ${r.amount}`,
      statusOf(r),
      r.rider ?? "—",
      new Date(r.time).toLocaleString([], { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }),
    ]),
  });

  const columns: Column<Row>[] = [
    { key: "id", header: "ORDER", flex: 1, mobile: "title",
      render: (r) => <Cell strong>{`#${r.id}`}</Cell> },
    { key: "customer", header: "CUSTOMER", flex: 1.6, mobile: "meta",
      render: (r) => <Cell>{r.customer}</Cell> },
    { key: "method", header: "METHOD", flex: 1.2, mobile: "meta",
      render: (r) => <Cell>{methodLabel(r)}</Cell> },
    { key: "amount", header: "AMOUNT", flex: 1, mobile: "trailing",
      render: (r) => <Cell strong>GHS {r.amount}</Cell> },
    { key: "status", header: "STATUS", flex: 1.3,
      render: (r) => <StatusPill status={statusOf(r)} /> },
    { key: "rider", header: "RIDER", flex: 1.2, mobile: "meta",
      render: (r) => <Cell muted={!r.rider}>{r.rider ?? "Unassigned"}</Cell> },
    { key: "time", header: "TIME", flex: 1, align: "right", mobile: "meta",
      render: (r) => (
        <Cell muted>
          {new Date(r.time).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
        </Cell>
      ) },
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
          subtitle="The Burger Yard"
        >
          <SearchBox
            value={query}
            onChange={setQuery}
            placeholder="Search order or name..."
          />
          <ExportButton build={buildExport} />
        </PageHeader>

        {loading && !data ? (
          <ActivityIndicator style={{ marginVertical: 40 }} />
        ) : (
          <>
            <StatRow
              stats={[
                {
                  label: "Total collected",
                  value: `GHS ${(data?.stats.collected ?? 0).toLocaleString()}`,
                  hint: "All confirmed payments",
                  icon: "credit-card",
                },
                {
                  label: "Cash outstanding",
                  value: `GHS ${(data?.stats.cashOutstanding ?? 0).toLocaleString()}`,
                  hint: "Collect at delivery",
                  icon: "dollar-sign",
                },
                {
                  label: "Awaiting payment",
                  value: `GHS ${(data?.stats.awaitingAmount ?? 0).toLocaleString()}`,
                  hint: `${data?.stats.awaitingCount ?? 0} orders`,
                  icon: "clock",
                },
              ]}
            />

            <FadeIn delay={90}>
              <FilterTabs options={["All", ...FILTERS]} value={filter} onChange={setFilter} counts={counts} />
            </FadeIn>

            <FadeIn delay={130}>
              <DataTable
                columns={columns}
                rows={rows}
                keyExtractor={(r) => String(r.id)}
                emptyText={
                  filter === "All" ? "No payments yet." : `No ${filter.toLowerCase()} payments.`
                }
              />
            </FadeIn>
          </>
        )}
      </ScrollView>
    </View>
  );
}
