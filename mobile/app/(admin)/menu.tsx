import { useDialog } from "@/components/admin/dialog";
import { Field, ModalSheet, fieldStyles } from "@/components/admin/modal-sheet";
import {
  Button,
  Card,
  FadeIn,
  Icon,
  IconButton,
  Toggle,
} from "@/components/admin/ui";
import { Admin } from "@/constants/admin-theme";
import { menuImage } from "@/constants/menu-catalog";
import { useResponsive } from "@/hooks/use-responsive";
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

type MenuItem = {
  id: string;
  name: string;
  desc: string;
  category: string;
  price: number;
  sold: number;
  available: boolean;
};

const CATEGORIES = ["Burgers", "Sides", "Drinks", "Extras"];

const SEED: MenuItem[] = [
  { id: "1", name: "Single Cheese Burger", desc: "Beef, cheddar, yard sauce", category: "Burgers", price: 70, sold: 128, available: true },
  { id: "2", name: "Double Cheese Burger", desc: "Two patties, double cheddar", category: "Burgers", price: 100, sold: 72, available: false },
  { id: "3", name: "Chicken Burger", desc: "Crispy chicken, cheddar, lettuce", category: "Burgers", price: 95, sold: 96, available: true },
  { id: "4", name: "Chicken Burger x Fries", desc: "Chicken burger + regular fries", category: "Burgers", price: 120, sold: 40, available: true },
  { id: "5", name: "Fries Regular", desc: "Crispy golden fries", category: "Sides", price: 25, sold: 64, available: true },
  { id: "6", name: "Coca-Cola", desc: "Chilled 350ml", category: "Drinks", price: 10, sold: 58, available: true },
  { id: "7", name: "Bacon", desc: "Add-on", category: "Extras", price: 15, sold: 30, available: true },
  { id: "8", name: "Extra Cheese", desc: "Add-on", category: "Extras", price: 15, sold: 24, available: true },
  { id: "9", name: "Extra Patty", desc: "Add-on", category: "Extras", price: 25, sold: 18, available: false },
];

/** A blank row for the add flow, so add and edit share one form. */
const EMPTY: MenuItem = {
  id: "",
  name: "",
  desc: "",
  category: "Burgers",
  price: 0,
  sold: 0,
  available: true,
};

export default function AdminMenuScreen() {
  const { isPhone, isDesktop } = useResponsive();
  const { confirm, notify } = useDialog();
  const [items, setItems] = useState<MenuItem[]>(SEED);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // One sheet drives both add and edit; `draft.id` says which.
  const [draft, setDraft] = useState<MenuItem | null>(null);
  const isNew = draft?.id === "";

  const counts = useMemo(() => {
    const map: Record<string, number> = { All: items.length };
    CATEGORIES.forEach((c) => {
      map[c] = items.filter((i) => i.category === c).length;
    });
    return map;
  }, [items]);

  const outOfStock = items.filter((i) => !i.available).length;

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      const inCategory =
        selectedCategory === "All" || item.category === selectedCategory;
      const matches =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.desc.toLowerCase().includes(q);
      return inCategory && matches;
    });
  }, [items, selectedCategory, searchQuery]);

  const toggleStock = (id: string) =>
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, available: !i.available } : i)),
    );

  const saveDraft = () => {
    if (!draft) return;
    if (!draft.name.trim()) {
      notify({ title: "Name required", message: "Give the item a name before saving." });
      return;
    }
    if (!Number.isFinite(draft.price) || draft.price <= 0) {
      notify({ title: "Check the price", message: "Enter a price greater than zero." });
      return;
    }

    setItems((prev) =>
      isNew
        ? [...prev, { ...draft, id: String(Date.now()) }]
        : prev.map((i) => (i.id === draft.id ? draft : i)),
    );
    setDraft(null);
  };

  const confirmDelete = async (item: MenuItem) => {
    const ok = await confirm({
      title: "Remove item",
      message: `Remove ${item.name} from the menu? Customers stop seeing it straight away.`,
      confirmLabel: "Remove",
      destructive: true,
    });
    if (ok) setItems((prev) => prev.filter((i) => i.id !== item.id));
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scroll, isPhone && styles.scrollPhone]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <FadeIn>
          <View style={[styles.topBar, !isDesktop && styles.topBarStacked]}>
            <View style={{ flex: 1, minWidth: 200 }}>
              <Text style={styles.headerTitle}>Menu Management</Text>
              <Text style={styles.headerSub}>
                {items.length} items · {outOfStock} out of stock · prices in GHS
              </Text>
            </View>

            <View style={[styles.controls, !isDesktop && styles.controlsWrap]}>
              <View style={[styles.search, isPhone && styles.searchPhone]}>
                <Icon name="search" size={15} color={Admin.textFaint} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search items..."
                  placeholderTextColor={Admin.textFaint}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
              <Button
                label="Add item"
                icon="plus"
                onPress={() => setDraft({ ...EMPTY })}
              />
            </View>
          </View>
        </FadeIn>

        {/* Category tabs */}
        <FadeIn delay={60}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsRow}
          >
            {["All", ...CATEGORIES].map((name) => {
              const active = selectedCategory === name;
              return (
                <Pressable
                  key={name}
                  onPress={() => setSelectedCategory(name)}
                  style={[styles.tabBtn, active && styles.tabBtnActive]}
                >
                  <Text style={[styles.tabText, active && styles.tabTextActive]}>
                    {name}
                  </Text>
                  <View style={[styles.tabCount, active && styles.tabCountActive]}>
                    <Text
                      style={[styles.tabCountText, active && { color: "#FFFFFF" }]}
                    >
                      {counts[name] ?? 0}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </FadeIn>

        <FadeIn delay={110}>
          <Card style={styles.tableCard}>
            {!isPhone && (
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.th, { flex: 3 }]}>ITEM</Text>
                <Text style={[styles.th, { flex: 1.3 }]}>CATEGORY</Text>
                <Text style={[styles.th, { flex: 1 }]}>PRICE</Text>
                <Text style={[styles.th, { flex: 1 }]}>SOLD · 7D</Text>
                <Text style={[styles.th, { flex: 1.4 }]}>STATUS</Text>
                <Text style={[styles.th, { width: 80, textAlign: "right" }]}>
                  ACTIONS
                </Text>
              </View>
            )}

            {filtered.length === 0 ? (
              <View style={styles.emptyBox}>
                <Icon name="inbox" size={22} color={Admin.textFaint} />
                <Text style={styles.emptyText}>
                  No items in {selectedCategory}
                  {searchQuery ? ` matching “${searchQuery}”` : ""}.
                </Text>
              </View>
            ) : (
              filtered.map((item) =>
                isPhone ? (
                  <View key={item.id} style={styles.mobileCard}>
                    <View style={styles.mobileTop}>
                      <Image
                        source={menuImage(item.id)}
                        style={styles.thumb}
                        resizeMode="cover"
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.itemName}>{item.name}</Text>
                        <Text style={styles.itemDesc}>{item.desc}</Text>
                      </View>
                      <Text style={styles.price}>GHS {item.price}</Text>
                    </View>

                    <View style={styles.mobileBottom}>
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{item.category}</Text>
                      </View>
                      <Text style={styles.soldText}>{item.sold} sold</Text>
                      <View style={{ flex: 1 }} />
                      <Toggle
                        value={item.available}
                        onChange={() => toggleStock(item.id)}
                        label={`${item.name} availability`}
                      />
                      <IconButton
                        name="edit-2"
                        label={`Edit ${item.name}`}
                        onPress={() => setDraft({ ...item })}
                      />
                      <IconButton
                        name="trash-2"
                        tone="danger"
                        label={`Remove ${item.name}`}
                        onPress={() => confirmDelete(item)}
                      />
                    </View>
                  </View>
                ) : (
                  <View key={item.id} style={styles.tableRow}>
                    <View style={[styles.cell, styles.itemCell, { flex: 3 }]}>
                      <Image
                        source={menuImage(item.id)}
                        style={styles.thumb}
                        resizeMode="cover"
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.itemName}>{item.name}</Text>
                        <Text style={styles.itemDesc} numberOfLines={1}>
                          {item.desc}
                        </Text>
                      </View>
                    </View>

                    <View style={[styles.cell, { flex: 1.3 }]}>
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{item.category}</Text>
                      </View>
                    </View>

                    <View style={[styles.cell, { flex: 1 }]}>
                      <Text style={styles.price}>GHS {item.price}</Text>
                    </View>

                    <View style={[styles.cell, { flex: 1 }]}>
                      <Text style={styles.soldText}>{item.sold}</Text>
                    </View>

                    <View style={[styles.cell, styles.statusCell, { flex: 1.4 }]}>
                      <Toggle
                        value={item.available}
                        onChange={() => toggleStock(item.id)}
                        label={`${item.name} availability`}
                      />
                      <Text
                        style={[
                          styles.statusText,
                          { color: item.available ? Admin.green : Admin.textMuted },
                        ]}
                      >
                        {item.available ? "In stock" : "Out"}
                      </Text>
                    </View>

                    <View style={[styles.cell, styles.actionCell, { width: 80 }]}>
                      <IconButton
                        name="edit-2"
                        label={`Edit ${item.name}`}
                        onPress={() => setDraft({ ...item })}
                      />
                      <IconButton
                        name="trash-2"
                        tone="danger"
                        label={`Remove ${item.name}`}
                        onPress={() => confirmDelete(item)}
                      />
                    </View>
                  </View>
                ),
              )
            )}
          </Card>
        </FadeIn>
      </ScrollView>

      <ModalSheet
        visible={draft !== null}
        title={isNew ? "Add menu item" : "Edit item"}
        subtitle={isNew ? "It goes live as soon as you save." : draft?.name}
        onClose={() => setDraft(null)}
        footer={
          <>
            <Button label="Cancel" variant="secondary" onPress={() => setDraft(null)} />
            <Button label={isNew ? "Add item" : "Save changes"} onPress={saveDraft} />
          </>
        }
      >
        {draft && (
          <>
            <Field label="Item name">
              <TextInput
                style={fieldStyles.input}
                value={draft.name}
                onChangeText={(name) => setDraft({ ...draft, name })}
                placeholder="e.g. Single Cheese Burger"
                placeholderTextColor={Admin.textFaint}
              />
            </Field>

            <Field label="Description">
              <TextInput
                style={fieldStyles.input}
                value={draft.desc}
                onChangeText={(desc) => setDraft({ ...draft, desc })}
                placeholder="Short description"
                placeholderTextColor={Admin.textFaint}
              />
            </Field>

            <View style={fieldStyles.row}>
              <View style={{ flex: 1 }}>
                <Field label="Price (GHS)">
                  <TextInput
                    style={fieldStyles.input}
                    value={draft.price ? String(draft.price) : ""}
                    onChangeText={(t) =>
                      setDraft({ ...draft, price: Number(t.replace(/[^0-9]/g, "")) })
                    }
                    keyboardType="number-pad"
                    placeholder="0"
                    placeholderTextColor={Admin.textFaint}
                  />
                </Field>
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Sold (7d)">
                  <TextInput
                    style={fieldStyles.input}
                    value={String(draft.sold)}
                    onChangeText={(t) =>
                      setDraft({ ...draft, sold: Number(t.replace(/[^0-9]/g, "")) })
                    }
                    keyboardType="number-pad"
                    placeholder="0"
                    placeholderTextColor={Admin.textFaint}
                  />
                </Field>
              </View>
            </View>

            <Field label="Category">
              <View style={styles.chipRow}>
                {CATEGORIES.map((c) => {
                  const on = draft.category === c;
                  return (
                    <Pressable
                      key={c}
                      onPress={() => setDraft({ ...draft, category: c })}
                      style={[styles.chip, on && styles.chipActive]}
                    >
                      <Text style={[styles.chipText, on && styles.chipTextActive]}>
                        {c}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </Field>

            <View style={styles.availRow}>
              <View style={{ flex: 1 }}>
                <Text style={fieldStyles.label}>Available</Text>
                <Text style={styles.availHint}>
                  Turn off to hide it from customers.
                </Text>
              </View>
              <Toggle
                value={draft.available}
                onChange={(available) => setDraft({ ...draft, available })}
                label="Available"
              />
            </View>
          </>
        )}
      </ModalSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Admin.canvas },
  scroll: { padding: 24, gap: 18 },
  scrollPhone: { padding: 14, gap: 14 },

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
    width: 240,
  },
  searchPhone: { flex: 1, minWidth: 160, width: "auto" },
  searchInput: { flex: 1, fontSize: 13, color: Admin.text, outlineStyle: "none" } as object,

  tabsRow: { flexDirection: "row", gap: 8, paddingVertical: 2 },
  tabBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 9,
    backgroundColor: Admin.surface,
    borderWidth: 1,
    borderColor: Admin.border,
  },
  tabBtnActive: { backgroundColor: Admin.ink, borderColor: Admin.ink },
  tabText: { fontSize: 12.5, fontWeight: "600", color: Admin.textMuted },
  tabTextActive: { color: "#FFFFFF" },
  tabCount: {
    minWidth: 18,
    paddingHorizontal: 5,
    borderRadius: 9,
    backgroundColor: Admin.divider,
    alignItems: "center",
  },
  tabCountActive: { backgroundColor: "rgba(255,255,255,0.22)" },
  tabCountText: { fontSize: 10.5, fontWeight: "700", color: Admin.textMuted },

  tableCard: { padding: 0, overflow: "hidden" },
  tableHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 13,
    backgroundColor: "#FBFCFD",
    borderBottomWidth: 1,
    borderBottomColor: Admin.border,
  },
  th: { fontSize: 10, fontWeight: "700", color: Admin.textFaint, letterSpacing: 0.6 },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: Admin.divider,
  },
  cell: { justifyContent: "center" },
  itemCell: { flexDirection: "row", alignItems: "center", gap: 12 },
  statusCell: { flexDirection: "row", alignItems: "center", gap: 9 },
  actionCell: { flexDirection: "row", justifyContent: "flex-end", gap: 7 },

  thumb: {
    width: 40,
    height: 40,
    borderRadius: 9,
    backgroundColor: Admin.divider,
  },
  itemName: { fontSize: 13.5, fontWeight: "700", color: Admin.text },
  itemDesc: { fontSize: 11.5, color: Admin.textMuted, marginTop: 2 },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: Admin.divider,
  },
  badgeText: { fontSize: 11, fontWeight: "600", color: Admin.textMuted },
  price: { fontSize: 13.5, fontWeight: "700", color: Admin.text },
  soldText: { fontSize: 13, color: Admin.textMuted },
  statusText: { fontSize: 11.5, fontWeight: "700" },

  mobileCard: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: Admin.divider,
    gap: 12,
  },
  mobileTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  mobileBottom: { flexDirection: "row", alignItems: "center", gap: 8 },

  emptyBox: { alignItems: "center", gap: 10, paddingVertical: 44 },
  emptyText: { fontSize: 13, color: Admin.textMuted, textAlign: "center" },

  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Admin.border,
    backgroundColor: "#FBFCFD",
  },
  chipActive: { backgroundColor: Admin.redSoft, borderColor: Admin.red },
  chipText: { fontSize: 12.5, fontWeight: "600", color: Admin.textMuted },
  chipTextActive: { color: Admin.red },

  availRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 6,
    marginBottom: 6,
  },
  availHint: { fontSize: 11.5, color: Admin.textMuted },
});
