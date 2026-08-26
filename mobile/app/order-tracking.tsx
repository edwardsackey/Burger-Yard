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
  "Order accepted",
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
  NEW: "Order accepted",
  PREPARING: "Preparing your food",
  READY: "Ready for pickup",
  OUT_FOR_DELIVERY: "On the way",
  COMPLETED: "Delivered",
  CANCELLED: "Order cancelled",
};

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
      <View style={styles.mapHeader}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.mapArea}>
        <View style={styles.mockRouteLine} />
        <View style={styles.riderPin} />
      </View>

      <View style={styles.panel}>
        <View style={styles.panelHandle} />

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
                {STAGES.map((label, i) => (
                  <View key={label} style={styles.timelineRow}>
                    <View
                      style={[styles.dot, i <= (stageIndex ?? -1) && styles.dotDone]}
                    />
                    <Text
                      style={
                        i <= (stageIndex ?? -1)
                          ? styles.timelineText
                          : styles.timelineTextDim
                      }
                    >
                      {label}
                    </Text>
                  </View>
                ))}
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
  container: { flex: 1, backgroundColor: "#E5E7EB" },
  mapHeader: { position: "absolute", top: 50, left: 20, zIndex: 10 },
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
  mapArea: {
    height: 280,
    backgroundColor: "#EAEAEA",
    justifyContent: "center",
    alignItems: "center",
  },
  mockRouteLine: {
    width: 150,
    height: 4,
    backgroundColor: "#D62828",
    transform: [{ rotate: "45deg" }],
  },
  riderPin: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#D62828",
    borderWidth: 3,
    borderColor: "#FFF",
    position: "absolute",
  },
  panel: {
    flex: 1,
    backgroundColor: "#FFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    marginTop: -20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    elevation: 5,
  },
  panelHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#D1D5DB",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 15,
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
  timeline: { marginBottom: 16, gap: 10 },
  timelineRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#D1D5DB" },
  dotDone: { backgroundColor: "#D62828" },
  timelineText: { fontSize: 13, fontWeight: "600", color: "#111" },
  timelineTextDim: { fontSize: 13, color: "#9CA3AF" },
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
