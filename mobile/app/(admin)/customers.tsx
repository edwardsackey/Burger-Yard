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
import React, { useMemo, useState } from "react";
import { Linking, ScrollView, StyleSheet, Text, View } from "react-native";

type Customer = {
  id: string;
  name: string;
  phone: string;
  location: string;
  orders: number;
  spent: number;
  lastOrder: string;
};

const CUSTOMERS: Customer[] = [
  { id: "c1", name: "Ama Mensah", phone: "0543927440", location: "Ayeduase New Site", orders: 24, spent: 2140, lastOrder: "Today" },
  { id: "c2", name: "Kwesi Boateng", phone: "0244244123", location: "Kotei", orders: 11, spent: 860, lastOrder: "Today" },
  { id: "c3", name: "Adwoa Owusu", phone: "0245012345", location: "Ayeduase Gate", orders: 18, spent: 1580, lastOrder: "Yesterday" },
  { id: "c4", name: "Yaw Darko", phone: "0207781234", location: "Bomso", orders: 6, spent: 470, lastOrder: "2 days ago" },
  { id: "c5", name: "Akosua Frimpong", phone: "0559990001", location: "Ayeduase", orders: 31, spent: 2890, lastOrder: "Today" },
  { id: "c6", name: "Kofi Antwi", phone: "0261112223", location: "Kentinkrono", orders: 3, spent: 240, lastOrder: "1 week ago" },
];

const FILTERS = ["All", "Regulars", "New"];

export default function AdminCustomersScreen() {
  const { isPhone } = useResponsive();
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");

  const counts = useMemo(
    () => ({
      All: CUSTOMERS.length,
      Regulars: CUSTOMERS.filter((c) => c.orders >= 10).length,
      New: CUSTOMERS.filter((c) => c.orders < 10).length,
    }),
    [],
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CUSTOMERS.filter((c) => {
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
  }, [filter, query]);

  const totalSpend = CUSTOMERS.reduce((s, c) => s + c.spent, 0);
  const avgValue = Math.round(totalSpend / CUSTOMERS.length);
  const repeatRate = Math.round((counts.Regulars / CUSTOMERS.length) * 100);

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
          subtitle={`${CUSTOMERS.length} registered · ${repeatRate}% repeat rate`}
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
            { label: "Total customers", value: String(CUSTOMERS.length), delta: "+15%", hint: "vs last month", icon: "users" },
            { label: "Repeat rate", value: `${repeatRate}%`, hint: "10+ orders", icon: "repeat" },
            { label: "Average value", value: `GHS ${avgValue}`, hint: "Lifetime per customer", icon: "trending-up" },
          ]}
        />

        <FadeIn delay={90}>
          <FilterTabs options={FILTERS} value={filter} onChange={setFilter} counts={counts} />
        </FadeIn>

        <FadeIn delay={130}>
          <DataTable
            columns={columns}
            rows={rows}
            keyExtractor={(c) => c.id}
            emptyText="No customers match that search."
          />
        </FadeIn>
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
