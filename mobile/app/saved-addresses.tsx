import { useRouter } from "expo-router";
import React from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SavedAddressesScreen() {
  const router = useRouter();

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
        <View style={[styles.card, styles.cardActive]}>
          <View style={styles.cardTop}>
            <Text style={styles.addressTitle}>Ayeduase New Site</Text>
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultText}>DEFAULT</Text>
            </View>
          </View>
          <Text style={styles.addressSub}>Near ECG transformer • Kumasi</Text>
          <View style={styles.cardActions}>
            <TouchableOpacity style={styles.actionBtn}>
              <Text style={styles.actionText}>Edit</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardTop}>
            <Text style={styles.addressTitle}>Osu Residential Area</Text>
          </View>
          <Text style={styles.addressSub}>Near Oxford Street • Accra</Text>
          <View style={styles.cardActions}>
            <TouchableOpacity style={styles.actionBtn}>
              <Text style={styles.actionText}>Set as default</Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <Text style={styles.deleteText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.addBtn}>
          <Text style={styles.addBtnText}>+ Add new address</Text>
        </TouchableOpacity>
      </ScrollView>
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
  scrollContent: { padding: 20, gap: 14 },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cardActive: { borderColor: "#DA291C", borderWidth: 1.5 },
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
  defaultText: { fontSize: 9, fontWeight: "bold", color: "#DA291C" },
  addressSub: { fontSize: 13, color: "#666", marginBottom: 12 },
  cardActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingTop: 10,
  },
  actionBtn: { paddingVertical: 4 },
  actionText: { fontSize: 12, fontWeight: "bold", color: "#DA291C" },
  deleteText: { fontSize: 12, fontWeight: "bold", color: "#9CA3AF" },
  addBtn: {
    borderWidth: 1.5,
    borderColor: "#DA291C",
    borderStyle: "dashed",
    borderRadius: 16,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF",
    marginTop: 10,
  },
  addBtnText: { color: "#DA291C", fontSize: 14, fontWeight: "bold" },
});
