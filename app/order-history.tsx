import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function OrderHistoryScreen() {
  const router = useRouter();
  const [tab, setTab] = useState("All");

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order History</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.tabsRow}>
        {["All", "Active", "Completed"].map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.filterTab, tab === t && styles.activeFilterTab]}
            onPress={() => setTab(t)}
          >
            <Text
              style={[styles.filterText, tab === t && styles.activeFilterText]}
            >
              {t}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.orderNo}>Order #1042</Text>
            <Text style={styles.orderDate}>Today, 12:09</Text>
            <View style={styles.statusPreparing}>
              <Text style={styles.statusPrepText}>● Preparing</Text>
            </View>
          </View>
          <Text style={styles.itemsSummary}>
            2x Single Cheese Burger (+Bacon), Chicken Burger, Coca-Cola
          </Text>
          <View style={styles.cardFooter}>
            <Text style={styles.price}>GHS 195</Text>
            <TouchableOpacity
              style={styles.trackBtn}
              onPress={() => router.push("/order-tracking")}
            >
              <Text style={styles.trackBtnText}>Track order</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.orderNo}>Order #1037</Text>
            <Text style={styles.orderDate}>Yesterday</Text>
            <View style={styles.statusDelivered}>
              <Text style={styles.statusDelText}>■ Delivered</Text>
            </View>
          </View>
          <Text style={styles.itemsSummary}>
            Single Cheese Burger, Fries Regular, Coca-Cola
          </Text>
          <View style={styles.cardFooter}>
            <Text style={styles.price}>GHS 105</Text>
            <TouchableOpacity style={styles.reorderBtn}>
              <Text style={styles.reorderText}>Reorder</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    padding: 20,
  },
  backText: { fontSize: 22, fontWeight: "bold" },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#111" },
  tabsRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 14,
  },
  filterTab: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: "#E5E7EB",
  },
  activeFilterTab: { backgroundColor: "#111" },
  filterText: { fontSize: 13, fontWeight: "600", color: "#444" },
  activeFilterText: { color: "#FFF" },
  list: { padding: 20, gap: 14 },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  orderNo: { fontSize: 14, fontWeight: "bold", color: "#111" },
  orderDate: { fontSize: 11, color: "#666", flex: 1, marginLeft: 8 },
  statusPreparing: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusPrepText: { fontSize: 10, fontWeight: "bold", color: "#B45309" },
  statusDelivered: {
    backgroundColor: "#DEF7EC",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusDelText: { fontSize: 10, fontWeight: "bold", color: "#03543F" },
  itemsSummary: { fontSize: 13, color: "#555", marginBottom: 14 },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingTop: 12,
  },
  price: { fontSize: 15, fontWeight: "bold", color: "#111" },
  trackBtn: {
    borderWidth: 1,
    borderColor: "#DA291C",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  trackBtnText: { fontSize: 12, fontWeight: "bold", color: "#DA291C" },
  reorderBtn: {
    backgroundColor: "#DA291C",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  reorderText: { fontSize: 12, fontWeight: "bold", color: "#FFF" },
});
