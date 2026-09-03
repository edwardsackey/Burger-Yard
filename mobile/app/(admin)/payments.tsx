import { apiFetch } from "@/api";
import { Cell, DataTable, type Column } from "@/components/admin/data-table";
import { useDialog } from "@/components/admin/dialog";
import { ModalSheet } from "@/components/admin/modal-sheet";
import {
  FilterTabs,
  PageHeader,
  SearchBox,
  StatRow,
  styles as parts,
} from "@/components/admin/screen-parts";
import { ExportButton } from "@/components/admin/export-menu";
import { Admin } from "@/constants/admin-theme";
import { FadeIn, StatusPill } from "@/components/admin/ui";
import { useResponsive } from "@/hooks/use-responsive";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";

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

type ReceiptItem = {
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  extras: { name: string; price: number }[] | null;
};

type Receipt = {
  id: number;
  createdAt: string;
  customer: { name: string; phone: string };
  address: string | null;
  addressDetails: string | null;
  landmark: string | null;
  items: ReceiptItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentMethod: string;
  momoNetwork: string | null;
  paid: boolean;
  status: string;
  riderName: string | null;
  riderPhone: string | null;
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
  const { notify } = useDialog();
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [data, setData] = useState<PaymentsData | null>(null);
  const [loading, setLoading] = useState(true);

  const [receiptOrderId, setReceiptOrderId] = useState<number | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loadingReceipt, setLoadingReceipt] = useState(false);

  useEffect(() => {
    apiFetch("/admin/payments")
      .then(setData)
      .catch(() => {
        // Left empty — the empty state covers this fine.
      })
      .finally(() => setLoading(false));
  }, []);

  const openReceipt = (row: Row) => {
    setReceiptOrderId(row.id);
    setReceipt(null);
    setLoadingReceipt(true);
    apiFetch(`/admin/payments/${row.id}`)
      .then(setReceipt)
      .catch((error) => {
        setReceiptOrderId(null);
        notify({
          title: "Couldn't load receipt",
          message: error instanceof Error ? error.message : "Please try again.",
        });
      })
      .finally(() => setLoadingReceipt(false));
  };

  const closeReceipt = () => {
    setReceiptOrderId(null);
    setReceipt(null);
  };

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
                onRowPress={openReceipt}
                emptyText={
                  filter === "All" ? "No payments yet." : `No ${filter.toLowerCase()} payments.`
                }
              />
            </FadeIn>
          </>
        )}
      </ScrollView>

      <ModalSheet
        visible={receiptOrderId !== null}
        title={receiptOrderId ? `Receipt #${receiptOrderId}` : "Receipt"}
        subtitle="The Burger Yard"
        onClose={closeReceipt}
      >
        {loadingReceipt || !receipt ? (
          <ActivityIndicator style={{ marginVertical: 40 }} />
        ) : (
          <View style={{ paddingBottom: 20 }}>
            <Text style={receiptStyles.date}>
              {new Date(receipt.createdAt).toLocaleString([], {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </Text>

            <View style={receiptStyles.block}>
              <Text style={receiptStyles.label}>CUSTOMER</Text>
              <Text style={receiptStyles.value}>{receipt.customer.name}</Text>
              <Text style={receiptStyles.muted}>{receipt.customer.phone}</Text>
            </View>

            <View style={receiptStyles.block}>
              <Text style={receiptStyles.label}>DELIVER TO</Text>
              <Text style={receiptStyles.value}>
                {[receipt.address, receipt.landmark ?? receipt.addressDetails]
                  .filter(Boolean)
                  .join(" · ") || "—"}
              </Text>
            </View>

            <View style={receiptStyles.divider} />

            <Text style={receiptStyles.label}>ITEMS</Text>
            {receipt.items.map((it, i) => (
              <View key={`${it.name}-${i}`} style={receiptStyles.itemRow}>
                <Text style={receiptStyles.itemQty}>{it.quantity}x</Text>
                <View style={{ flex: 1 }}>
                  <Text style={receiptStyles.value}>{it.name}</Text>
                  {it.extras && it.extras.length > 0 && (
                    <Text style={receiptStyles.muted}>
                      {it.extras.map((e) => `+ ${e.name} (GHS ${e.price})`).join(", ")}
                    </Text>
                  )}
                </View>
                <Text style={receiptStyles.value}>GHS {it.lineTotal}</Text>
              </View>
            ))}

            <View style={receiptStyles.divider} />

            <View style={receiptStyles.totalRow}>
              <Text style={receiptStyles.muted}>Subtotal</Text>
              <Text style={receiptStyles.value}>GHS {receipt.subtotal}</Text>
            </View>
            <View style={receiptStyles.totalRow}>
              <Text style={receiptStyles.muted}>Delivery</Text>
              <Text style={receiptStyles.value}>GHS {receipt.deliveryFee}</Text>
            </View>
            <View style={[receiptStyles.totalRow, receiptStyles.grandRow]}>
              <Text style={receiptStyles.grandLabel}>Total</Text>
              <Text style={receiptStyles.grandValue}>GHS {receipt.total}</Text>
            </View>

            <View style={receiptStyles.divider} />

            <View style={receiptStyles.totalRow}>
              <Text style={receiptStyles.muted}>Payment</Text>
              <Text style={receiptStyles.value}>
                {methodLabel({ method: receipt.paymentMethod, momoNetwork: receipt.momoNetwork } as Row)}
              </Text>
            </View>
            <View style={receiptStyles.totalRow}>
              <Text style={receiptStyles.muted}>Status</Text>
              <StatusPill
                status={statusOf({
                  method: receipt.paymentMethod,
                  paid: receipt.paid,
                  cancelled: receipt.status === "CANCELLED",
                } as Row)}
              />
            </View>
            {receipt.riderName && (
              <View style={receiptStyles.totalRow}>
                <Text style={receiptStyles.muted}>Rider</Text>
                <Text style={receiptStyles.value}>
                  {receipt.riderName}
                  {receipt.riderPhone ? ` · ${receipt.riderPhone}` : ""}
                </Text>
              </View>
            )}
          </View>
        )}
      </ModalSheet>
    </View>
  );
}

const receiptStyles = StyleSheet.create({
  date: { fontSize: 12, color: Admin.textFaint, marginBottom: 16 },
  block: { marginBottom: 14 },
  label: {
    fontSize: 10, fontWeight: "700", color: Admin.textFaint,
    letterSpacing: 0.6, marginBottom: 6,
  },
  value: { fontSize: 13, color: Admin.text, fontWeight: "600" },
  muted: { fontSize: 12, color: Admin.textMuted, marginTop: 2 },
  divider: { height: 1, backgroundColor: Admin.divider, marginVertical: 14 },
  itemRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 10 },
  itemQty: { fontSize: 12.5, fontWeight: "700", color: Admin.textMuted, width: 26 },
  totalRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    marginBottom: 8,
  },
  grandRow: { borderTopWidth: 1, borderTopColor: Admin.divider, paddingTop: 9, marginTop: 3 },
  grandLabel: { fontSize: 14, fontWeight: "800", color: Admin.text },
  grandValue: { fontSize: 15, fontWeight: "800", color: Admin.red },
});
