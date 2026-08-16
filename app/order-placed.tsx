import { useRouter } from "expo-router";
import React from "react";
import {
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function OrderPlacedScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.successCircle}>
          <Text style={styles.check}>✓</Text>
        </View>

        <Text style={styles.title}>Order placed!</Text>
        <Text style={styles.subtitle}>
          Your order #1042 is confirmed and the kitchen is on it.
        </Text>

        <View style={styles.receiptCard}>
          <View style={styles.row}>
            <Text style={styles.label}>Estimated arrival</Text>
            <Text style={styles.val}>~25 min</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Delivery to</Text>
            <Text style={styles.val}>Ayeduase New Site</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Payment</Text>
            <Text style={styles.val}>MoMo</Text>
          </View>
          <View style={[styles.row, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total paid</Text>
            <Text style={styles.totalVal}>GHS 195</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => router.push("/order-tracking")}
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
