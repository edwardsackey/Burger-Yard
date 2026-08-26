import { apiFetch } from "@/api";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type DisplayStatus = "Active" | "Completed";

type OrderRow = {
  id: number;
  /** This customer's own Nth order, not the database id — never reveals
   * how many orders the app has processed for everyone else. */
  orderNumber: number;
  date: string;
  status: DisplayStatus;
  items: string;
  total: number;
};

// Kitchen/delivery statuses collapse into just two buckets for this list —
// customers care whether it's still coming or already done, not the stage.
const ACTIVE_STATUSES = new Set(["PENDING", "PREPARING", "OUT_FOR_DELIVERY"]);

function formatOrderDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) {
    return `Today, ${date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
  }
  if (isYesterday) return "Yesterday";
  return date.toLocaleDateString([], { day: "numeric", month: "short" });
}

export default function OrderHistoryScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<"All" | DisplayStatus>("All");
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/customer/users/me/orders")
      .then((data) => {
        // The API returns newest first; number chronologically (1st order
        // ever placed = #1) so it reads like a personal history, then keep
        // the newest-first display order.
        const chronological = [...data].sort(
          (a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
        const orderNumberById = new Map<number, number>(
          chronological.map((order: any, index: number) => [order.id, index + 1]),
        );

        const rows: OrderRow[] = data.map((order: any) => ({
          id: order.id,
          orderNumber: orderNumberById.get(order.id)!,
          date: formatOrderDate(order.createdAt),
          status: ACTIVE_STATUSES.has(order.status) ? "Active" : "Completed",
          items: order.orderItems
            .map((oi: any) =>
              oi.quantity > 1 ? `${oi.quantity}x ${oi.menuItem.name}` : oi.menuItem.name,
            )
            .join(", "),
          total: order.total_amount,
        }));
        setOrders(rows);
      })
      .catch(() => {
        // Not signed in, or request failed — the empty state covers this fine.
      })
      .finally(() => setLoading(false));
  }, []);

  const visibleOrders =
    tab === "All" ? orders : orders.filter((o) => o.status === tab);

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
        {(["All", "Active", "Completed"] as const).map((t) => (
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
        {loading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color="#D62828" />
        ) : visibleOrders.length === 0 ? (
          <Text style={styles.emptyText}>
            {orders.length === 0
              ? "No orders yet. Your first order will show up here."
              : `No ${tab.toLowerCase()} orders.`}
          </Text>
        ) : (
          visibleOrders.map((order) => (
            <View key={order.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.orderNo}>Order #{order.orderNumber}</Text>
                <Text style={styles.orderDate}>{order.date}</Text>
                <View
                  style={
                    order.status === "Active"
                      ? styles.statusPreparing
                      : styles.statusDelivered
                  }
                >
                  <Text
                    style={
                      order.status === "Active"
                        ? styles.statusPrepText
                        : styles.statusDelText
                    }
                  >
                    {order.status === "Active" ? "● Preparing" : "■ Delivered"}
                  </Text>
                </View>
              </View>
              <Text style={styles.itemsSummary}>{order.items}</Text>
              <View style={styles.cardFooter}>
                <Text style={styles.price}>GHS {order.total}</Text>
                {order.status === "Active" ? (
                  <TouchableOpacity
                    style={styles.trackBtn}
                    onPress={() =>
                      router.push({
                        pathname: "/order-tracking",
                        params: { orderId: String(order.id) },
                      })
                    }
                  >
                    <Text style={styles.trackBtnText}>Track order</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.reorderBtn}>
                    <Text style={styles.reorderText}>Reorder</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
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
  emptyText: {
    fontSize: 13,
    color: "#666",
    textAlign: "center",
    marginTop: 40,
  },
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
    borderColor: "#D62828",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  trackBtnText: { fontSize: 12, fontWeight: "bold", color: "#D62828" },
  reorderBtn: {
    backgroundColor: "#D62828",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  reorderText: { fontSize: 12, fontWeight: "bold", color: "#FFF" },
});
