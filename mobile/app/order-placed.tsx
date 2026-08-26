import { apiFetch } from "@/api";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PAYMENT_LABEL: Record<string, string> = {
  MOMO: "MoMo",
  CARD: "Card",
  CASH: "Cash on Delivery",
};

export default function OrderPlacedScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const [order, setOrder] = useState<any | null>(null);

  useEffect(() => {
    if (!orderId) return;
    apiFetch(`/customer/orders/${orderId}`)
      .then(setOrder)
      .catch(() => {
        // Order was placed either way — this screen is best-effort detail.
      });
  }, [orderId]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.successCircle}>
          <Text style={styles.check}>✓</Text>
        </View>

        <Text style={styles.title}>Order placed!</Text>
        <Text style={styles.subtitle}>
          {order
            ? `Your order #${order.id} is confirmed and the kitchen is on it.`
            : "Your order is confirmed and the kitchen is on it."}
        </Text>

        {!order ? (
          <ActivityIndicator color="#D62828" />
        ) : (
          <View style={styles.receiptCard}>
            <View style={styles.row}>
              <Text style={styles.label}>Estimated arrival</Text>
              <Text style={styles.val}>~25 min</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Delivery to</Text>
              <Text style={styles.val}>
                {order.address?.label ?? order.landmark ?? "—"}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Payment</Text>
              <Text style={styles.val}>
                {PAYMENT_LABEL[order.paymentMethod] ?? order.paymentMethod}
              </Text>
            </View>
            <View style={[styles.row, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total paid</Text>
              <Text style={styles.totalVal}>GHS {order.total_amount}</Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() =>
            router.push({ pathname: "/order-tracking", params: { orderId } })
          }
        >
          <Text style={styles.primaryText}>Track order</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => router.push("/(tabs)/home")}
        >
          <Text style={styles.secondaryText}>Back to menu</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 24,
    justifyContent: "space-between",
  },
  content: { alignItems: "center", marginTop: 60 },
  successCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#DEF7EC",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  check: { fontSize: 36, color: "#03543F", fontWeight: "bold" },
  title: { fontSize: 24, fontWeight: "bold", color: "#111", marginBottom: 8 },
  subtitle: {
    fontSize: 13,
    color: "#666",
    textAlign: "center",
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  receiptCard: {
    width: "100%",
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  label: { fontSize: 13, color: "#666" },
  val: { fontSize: 13, fontWeight: "600", color: "#111" },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 14,
    marginBottom: 0,
  },
  totalLabel: { fontSize: 14, fontWeight: "bold", color: "#111" },
  totalVal: { fontSize: 16, fontWeight: "bold", color: "#D62828" },
  footer: { width: "100%", gap: 12 },
  primaryBtn: {
    backgroundColor: "#D62828",
    borderRadius: 24,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  primaryText: { color: "#FFF", fontSize: 15, fontWeight: "bold" },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 24,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  secondaryText: { color: "#333", fontSize: 15, fontWeight: "600" },
});
