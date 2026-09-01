import { apiFetch } from "@/api";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const STAGES = [
  "Order placed",
  "Preparing your food",
  "Ready for pickup",
  "On the way",
  "Delivered",
] as const;

// Kitchen/delivery statuses map onto the five customer-facing stages above.
const STAGE_INDEX: Record<string, number> = {
  NEW: 0,
  PREPARING: 1,
  READY: 2,
  OUT_FOR_DELIVERY: 3,
  COMPLETED: 4,
};

const STATUS_TITLE: Record<string, string> = {
  NEW: "Order placed",
  PREPARING: "Preparing your food",
  READY: "Ready for pickup",
  OUT_FOR_DELIVERY: "On the way",
  COMPLETED: "Delivered",
  CANCELLED: "Order cancelled",
};

// Which raw order field holds the moment each stage was actually reached —
// lets the timeline show a real time instead of just a done/not-done dot.
// COMPLETED has no dedicated column: updatedAt is accurate for it since
// nothing else changes on an order after it's delivered.
const STAGE_TIME_FIELD: Record<number, string> = {
  0: "createdAt",
  1: "acceptedAt",
  2: "readyAt",
  3: "outForDeliveryAt",
  4: "updatedAt",
};

function formatStageTime(iso?: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

// Polling rather than a live push channel — good enough for a status that
// only changes a handful of times over an order's life, without needing a
// websocket/notification server.
const POLL_MS = 8000;

export default function OrderTrackingScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const [order, setOrder] = useState<any | null>(null);

  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;

    const load = () => {
      apiFetch(`/customer/orders/${orderId}`)
        .then((data) => {
          if (!cancelled) setOrder(data);
        })
        .catch(() => {
          // Transient network hiccup — the next poll will retry.
        });
    };

    load();
    const interval = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [orderId]);

  const handleCallRider = () => {
    if (order?.riderPhone) Linking.openURL(`tel:${order.riderPhone}`);
  };

  const stageIndex = order ? STAGE_INDEX[order.status] : undefined;
  const cancelled = order?.status === "CANCELLED";

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Track order</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.panel}>
        {!order ? (
          <ActivityIndicator style={{ marginTop: 20 }} color="#D62828" />
        ) : (
          <>
            <View style={styles.statusHeader}>
              <View>
                <Text style={styles.statusSub}>
                  {cancelled ? "" : "Status"}
                </Text>
                <Text style={styles.statusTitle}>
                  {STATUS_TITLE[order.status] ?? order.status}
                </Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.orderId}>Order #{order.id}</Text>
              </View>
            </View>

            {!cancelled && (
              <View style={styles.timeline}>
                {STAGES.map((label, i) => {
                  const done = i <= (stageIndex ?? -1);
                  const time = done ? formatStageTime(order[STAGE_TIME_FIELD[i]]) : "";
                  return (
                    <View key={label} style={styles.timelineRow}>
                      <View style={[styles.dot, done && styles.dotDone]} />
                      <Text style={done ? styles.timelineText : styles.timelineTextDim}>
                        {label}
                      </Text>
                      {time ? <Text style={styles.timelineTime}>{time}</Text> : null}
                    </View>
                  );
                })}
              </View>
            )}

            {order.riderName && (
              <View style={styles.riderCard}>
                <View style={styles.riderAvatar}>
                  <Text>🛵</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.riderName}>{order.riderName} · Your rider</Text>
                  {order.riderVehicle && (
                    <Text style={styles.riderBike}>{order.riderVehicle}</Text>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.callBtn}
                  onPress={handleCallRider}
                  disabled={!order.riderPhone}
                >
                  <Text style={styles.callText}>Call</Text>
                </TouchableOpacity>
              </View>
            )}

            {!cancelled && order.deliveryCode && (
              <View style={styles.codeCard}>
                <Text style={styles.codeTitle}>Delivery code</Text>
                <Text style={styles.codeSub}>Share with rider on arrival</Text>
                <View style={styles.codeBoxes}>
                  {order.deliveryCode.split("").map((n: string, i: number) => (
                    <View key={i} style={styles.codeBox}>
                      <Text style={styles.codeDigit}>{n}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    elevation: 3,
  },
  closeText: { fontSize: 16, fontWeight: "bold" },
  headerTitle: { fontSize: 16, fontWeight: "bold", color: "#111" },
  panel: {
    flex: 1,
    backgroundColor: "#FFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    elevation: 5,
  },
  statusHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  statusSub: { fontSize: 12, color: "#666" },
  statusTitle: { fontSize: 18, fontWeight: "bold", color: "#111" },
  orderId: { fontSize: 11, color: "#666" },
  timeline: { marginBottom: 16, gap: 12 },
  timelineRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#D1D5DB" },
  dotDone: { backgroundColor: "#D62828" },
  timelineText: { flex: 1, fontSize: 13, fontWeight: "600", color: "#111" },
  timelineTextDim: { flex: 1, fontSize: 13, color: "#9CA3AF" },
  timelineTime: { fontSize: 11.5, color: "#888" },
  riderCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  riderAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FDE68A",
    justifyContent: "center",
    alignItems: "center",
  },
  riderName: { fontSize: 14, fontWeight: "bold", color: "#111" },
  riderBike: { fontSize: 11, color: "#666" },
  callBtn: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  callText: { fontSize: 12, fontWeight: "bold", color: "#333" },
  codeCard: {
    backgroundColor: "#FFF5F5",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FEE2E2",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  codeTitle: { fontSize: 12, fontWeight: "bold", color: "#111" },
  codeSub: { fontSize: 10, color: "#666" },
  codeBoxes: { flexDirection: "row", gap: 6 },
  codeBox: {
    width: 28,
    height: 28,
    backgroundColor: "#FFF",
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  codeDigit: { fontSize: 14, fontWeight: "bold", color: "#D62828" },
});
