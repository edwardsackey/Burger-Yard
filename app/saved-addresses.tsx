import { TopSheet } from "@/components/top-sheet";
import { Brand } from "@/constants/brand";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Address = {
  id: string;
  label: string;
  details: string;
  city: string;
  isDefault: boolean;
};

const SEED: Address[] = [
  {
    id: "a1",
    label: "Ayeduase New Site",
    details: "Near ECG transformer",
    city: "Kumasi",
    isDefault: true,
  },
  {
    id: "a2",
    label: "Osu Residential Area",
    details: "Near Oxford Street",
    city: "Accra",
    isDefault: false,
  },
];

const BLANK = { id: "", label: "", details: "", city: "", isDefault: false };

export default function SavedAddressesScreen() {
  const router = useRouter();
  const [addresses, setAddresses] = useState<Address[]>(SEED);
  // One sheet serves add and edit; a blank id means we are adding.
  const [draft, setDraft] = useState<Address | null>(null);
  const isNew = draft?.id === "";

  const save = () => {
    if (!draft) return;
    if (!draft.label.trim()) {
      Alert.alert("Name this address", "Give it a label like Home or Work.");
      return;
    }
    if (!draft.details.trim()) {
      Alert.alert("Add directions", "A landmark helps the rider find you.");
      return;
    }

    setAddresses((prev) => {
      const next = isNew
        ? [...prev, { ...draft, id: `a${Date.now()}` }]
        : prev.map((a) => (a.id === draft.id ? draft : a));
      // Keep exactly one default, whichever this edit nominated.
      return draft.isDefault
        ? next.map((a) => ({ ...a, isDefault: a.id === (isNew ? next[next.length - 1].id : draft.id) }))
        : next;
    });
    setDraft(null);
  };

  const setDefault = (id: string) =>
    setAddresses((prev) => prev.map((a) => ({ ...a, isDefault: a.id === id })));

  const remove = (address: Address) => {
    Alert.alert("Delete address", `Remove ${address.label}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () =>
          setAddresses((prev) => {
            const next = prev.filter((a) => a.id !== address.id);
            // Never leave the list without a default.
            if (address.isDefault && next.length > 0) next[0].isDefault = true;
            return [...next];
          }),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saved Addresses</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {addresses.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>📍</Text>
            <Text style={styles.emptyTitle}>No addresses yet</Text>
            <Text style={styles.emptySub}>
              Add one so the rider knows where to bring your order.
            </Text>
          </View>
        ) : (
          addresses.map((address) => (
            <View
              key={address.id}
              style={[styles.card, address.isDefault && styles.cardActive]}
            >
              <View style={styles.cardTop}>
                <Text style={styles.addressTitle}>{address.label}</Text>
                {address.isDefault && (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultText}>DEFAULT</Text>
                  </View>
                )}
              </View>
              <Text style={styles.addressSub}>
                {address.details} • {address.city}
              </Text>

              <View style={styles.cardActions}>
                <View style={styles.actionGroup}>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => setDraft({ ...address })}
                  >
                    <Text style={styles.actionText}>Edit</Text>
                  </TouchableOpacity>
                  {!address.isDefault && (
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => setDefault(address.id)}
                    >
                      <Text style={styles.actionText}>Set as default</Text>
                    </TouchableOpacity>
                  )}
                </View>
                {addresses.length > 1 && (
                  <TouchableOpacity onPress={() => remove(address)}>
                    <Text style={styles.deleteText}>Delete</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}

        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setDraft({ ...BLANK })}
        >
          <Text style={styles.addBtnText}>+ Add new address</Text>
        </TouchableOpacity>
      </ScrollView>

      <TopSheet
        visible={draft !== null}
        title={isNew ? "Add new address" : "Edit address"}
        subtitle="The rider sees the landmark, so be specific."
        onClose={() => setDraft(null)}
        footer={
          <>
            <TouchableOpacity
              style={[styles.sheetBtn, styles.sheetBtnGhost]}
              onPress={() => setDraft(null)}
            >
              <Text style={styles.sheetBtnGhostText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sheetBtn} onPress={save}>
              <Text style={styles.sheetBtnText}>
                {isNew ? "Save address" : "Save changes"}
              </Text>
            </TouchableOpacity>
          </>
        }
      >
        {draft && (
          <>
            <Text style={styles.label}>Label</Text>
            <TextInput
              style={styles.input}
              value={draft.label}
              onChangeText={(label) => setDraft({ ...draft, label })}
              placeholder="Home, Work, Hostel"
              placeholderTextColor="#9CA3AF"
            />

            <Text style={styles.label}>Directions or landmark</Text>
            <TextInput
              style={styles.input}
              value={draft.details}
              onChangeText={(details) => setDraft({ ...draft, details })}
              placeholder="Near the blue gate, 2nd house"
              placeholderTextColor="#9CA3AF"
            />

            <Text style={styles.label}>City or town</Text>
            <TextInput
              style={styles.input}
              value={draft.city}
              onChangeText={(city) => setDraft({ ...draft, city })}
              placeholder="Kumasi"
              placeholderTextColor="#9CA3AF"
            />

            <TouchableOpacity
              style={styles.defaultRow}
              onPress={() => setDraft({ ...draft, isDefault: !draft.isDefault })}
            >
              <View
                style={[styles.checkbox, draft.isDefault && styles.checkboxOn]}
              >
                {draft.isDefault && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.defaultLabel}>
                Deliver here by default
              </Text>
            </TouchableOpacity>
          </>
        )}
      </TopSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  backBtn: { width: 24, justifyContent: "center" },
  backText: { fontSize: 22, fontWeight: "bold", color: "#111" },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#111" },
  scrollContent: { padding: 20, gap: 14, paddingBottom: 40 },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cardActive: { borderColor: Brand.red, borderWidth: 1.5 },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  addressTitle: { fontSize: 15, fontWeight: "bold", color: "#111" },
  defaultBadge: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultText: { fontSize: 9, fontWeight: "bold", color: Brand.red },
  addressSub: { fontSize: 13, color: "#666", marginBottom: 12 },
  cardActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingTop: 10,
  },
  actionGroup: { flexDirection: "row", gap: 16 },
  actionBtn: { paddingVertical: 4 },
  actionText: { fontSize: 12, fontWeight: "bold", color: Brand.red },
  deleteText: { fontSize: 12, fontWeight: "bold", color: "#9CA3AF" },
  addBtn: {
    borderWidth: 1.5,
    borderColor: Brand.red,
    borderStyle: "dashed",
    borderRadius: 16,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF",
    marginTop: 10,
  },
  addBtnText: { color: Brand.red, fontSize: 14, fontWeight: "bold" },

  emptyBox: { alignItems: "center", paddingVertical: 50, gap: 8 },
  emptyEmoji: { fontSize: 40 },
  emptyTitle: { fontSize: 16, fontWeight: "bold", color: "#111" },
  emptySub: {
    fontSize: 13,
    color: "#666",
    textAlign: "center",
    lineHeight: 19,
    maxWidth: 240,
  },

  label: {
    fontSize: 12.5,
    fontWeight: "700",
    color: Brand.ink,
    marginBottom: 7,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: Brand.border,
    backgroundColor: "#FBFCFD",
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 14.5,
    color: Brand.ink,
  },
  defaultRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 18,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxOn: { backgroundColor: Brand.red, borderColor: Brand.red },
  checkmark: { color: "#FFF", fontSize: 12, fontWeight: "bold" },
  defaultLabel: { fontSize: 13.5, color: Brand.ink },

  sheetBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: Brand.red,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetBtnText: { color: "#FFF", fontSize: 14.5, fontWeight: "700" },
  sheetBtnGhost: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: Brand.border,
  },
  sheetBtnGhostText: { color: Brand.ink, fontSize: 14.5, fontWeight: "600" },
});
