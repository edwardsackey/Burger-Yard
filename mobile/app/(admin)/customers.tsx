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
import { Button, FadeIn } from "@/components/admin/ui";
import { Admin } from "@/constants/admin-theme";
import { useResponsive } from "@/hooks/use-responsive";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Linking, ScrollView, StyleSheet, Text, View } from "react-native";

type Customer = {
  id: number;
  name: string;
  phone: string;
  location: string;
  orders: number;
  spent: number;
  lastOrder: string;
};

const FILTERS = ["All", "Regulars", "New"];

/** "Today" / "Yesterday" / "N days ago" / a plain date further back. */
function formatLastOrder(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  const now = new Date();
  const dayMs = 24 * 60 * 60 * 1000;
  const diffDays = Math.floor((now.setHours(0, 0, 0, 0) - new Date(date).setHours(0, 0, 0, 0)) / dayMs);

  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString([], { day: "numeric", month: "short" });
}

export default function AdminCustomersScreen() {
  const { isPhone } = useResponsive();
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/admin/customers")
      .then((data) => {
        const rows: Customer[] = data.map((c: any) => ({
          id: c.id,
          name: c.name,
          phone: c.phone,
          location: c.location ?? "—",
          orders: c.orders,
          spent: c.spent,
          lastOrder: formatLastOrder(c.lastOrderAt),
        }));
        setCustomers(rows);
      })
      .catch(() => {
        // Not signed in, or request failed — the empty state covers this.
      })
      .finally(() => setLoading(false));
  }, []);

  const counts = useMemo(
    () => ({
      All: customers.length,
      Regulars: customers.filter((c) => c.orders >= 10).length,
      New: customers.filter((c) => c.orders < 10).length,
    }),
    [customers],
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return customers.filter((c) => {
      const inFilter =
        filter === "All" ||
        (filter === "Regulars" ? c.orders >= 10 : c.orders < 10);
      const matches =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q) ||
        c.phone.includes(q);
      return inFilter && matches;
    });
  }, [filter, query, customers]);

  const totalSpend = customers.reduce((s, c) => s + c.spent, 0);
  const avgValue = customers.length ? Math.round(totalSpend / customers.length) : 0;
  const repeatRate = customers.length ? Math.round((counts.Regulars / customers.length) * 100) : 0;

  const call = (c: Customer) =>
    Linking.openURL(`tel:+233${c.phone.replace(/^0/, "")}`);

  const buildExport = () => ({
    title: "Customers",
    subtitle: `${filter} · ${rows.length} shown`,
    columns: ["Name", "Phone", "Location", "Orders", "Total spent", "Last order"],
    rows: rows.map((c) => [c.name, c.phone, c.location, c.orders, `GHS ${c.spent}`, c.lastOrder]),
  });

  const columns: Column<Customer>[] = [
    {
      key: "name", header: "CUSTOMER", flex: 2, mobile: "title",
      render: (c) => (
        <View style={styles.nameCell}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {c.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Cell strong>{c.name}</Cell>
            <Text style={styles.phone}>{c.phone}</Text>
          </View>
        </View>
      ),
    },
    { key: "location", header: "LOCATION", flex: 1.5, mobile: "meta",
      render: (c) => <Cell>{c.location}</Cell> },
    { key: "orders", header: "ORDERS", flex: 0.9, mobile: "meta",
      render: (c) => <Cell>{c.orders}</Cell> },
    { key: "spent", header: "TOTAL SPENT", flex: 1.1, mobile: "trailing",
      render: (c) => <Cell strong>GHS {c.spent}</Cell> },
    { key: "last", header: "LAST ORDER", flex: 1.1, mobile: "meta",
      render: (c) => <Cell muted>{c.lastOrder}</Cell> },
    {
      key: "action", header: "", width: 44, align: "right",
      render: (c) => (
        <Button label="" icon="phone" variant="secondary" size="sm"
          onPress={() => call(c)} style={styles.callBtn} />
      ),
    },
  ];

  return (
    <View style={parts.screen}>
      <ScrollView
        contentContainerStyle={[parts.scroll, isPhone && parts.scrollPhone]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <PageHeader
          title="Customers"
          subtitle={`${customers.length} registered · ${repeatRate}% repeat rate`}
        >
          <SearchBox
            value={query}
            onChange={setQuery}
            placeholder="Search name, phone or area..."
          />
          <ExportButton build={buildExport} />
        </PageHeader>

        <StatRow
          stats={[
            { label: "Total customers", value: String(customers.length), hint: "All time", icon: "users" },
            { label: "Repeat rate", value: `${repeatRate}%`, hint: "10+ orders", icon: "repeat" },
            { label: "Average value", value: `GHS ${avgValue}`, hint: "Lifetime per customer", icon: "trending-up" },
          ]}
        />

        {loading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color={Admin.red} />
        ) : (
          <>
            <FadeIn delay={90}>
              <FilterTabs options={FILTERS} value={filter} onChange={setFilter} counts={counts} />
            </FadeIn>

            <FadeIn delay={130}>
              <DataTable
                columns={columns}
                rows={rows}
                keyExtractor={(c) => String(c.id)}
                emptyText="No customers match that search."
              />
            </FadeIn>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  nameCell: { flexDirection: "row", alignItems: "center", gap: 11 },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Admin.redSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 11.5, fontWeight: "800", color: Admin.red },
  phone: { fontSize: 11.5, color: Admin.textMuted, marginTop: 2 },
  callBtn: { width: 36 },
});
