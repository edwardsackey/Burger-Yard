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

export default function CheckoutScreen() {
  const router = useRouter();
  const [payment, setPayment] = useState("momo");

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>Delivery location</Text>
        <View style={styles.mapBox}>
          <View style={styles.mockMap}>
            <View style={styles.mapPin} />
          </View>
          <View style={styles.addressRow}>
            <View>
              <Text style={styles.addressTitle}>Ayeduase New Site</Text>
              <Text style={styles.addressSub}>Kumasi • GPS pin set</Text>
            </View>
            <TouchableOpacity>
              <Text style={styles.changeText}>Change</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.landmarkBox}>
          <Text style={styles.landmarkText}>
            📍 Landmark — near Ayeduase gate
          </Text>
        </View>

        <View style={styles.phoneBox}>
          <Text style={styles.phoneLabel}>Phone</Text>
          <Text style={styles.phoneVal}>054 392 7440</Text>
        </View>

        <Text style={styles.sectionLabel}>Payment method</Text>

        <TouchableOpacity
          style={[styles.payCard, payment === "momo" && styles.paySelected]}
          onPress={() => setPayment("momo")}
        >
          <View style={styles.payHeader}>
            <Text style={styles.payTitle}>MoMo — Mobile Money</Text>
            <View style={styles.radioOuter}>
              {payment === "momo" && <View style={styles.radioInner} />}
            </View>
          </View>
          <View style={styles.telcos}>
            <Text style={styles.telcoTag}>🟡 MTN</Text>
            <Text style={styles.telcoTag}>🔴 Telecel</Text>
            <Text style={styles.telcoTag}>🔵 AT</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.payCard, payment === "card" && styles.paySelected]}
          onPress={() => setPayment("card")}
        >
          <View style={styles.payHeader}>
            <Text style={styles.payTitle}>Card</Text>
            <View style={styles.radioOuter}>
              {payment === "card" && <View style={styles.radioInner} />}
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.payCard, payment === "cash" && styles.paySelected]}
          onPress={() => setPayment("cash")}
        >
          <View style={styles.payHeader}>
            <Text style={styles.payTitle}>Cash on Delivery</Text>
            <View style={styles.radioOuter}>
              {payment === "cash" && <View style={styles.radioInner} />}
            </View>
          </View>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.orderBtn}
          onPress={() => router.push("/order-placed")}
        >
          <Text style={styles.orderBtnText}>Place order • GHS 195</Text>
        </TouchableOpacity>
      </View>
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
  backText: { fontSize: 20, fontWeight: "bold" },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#111" },
  content: { padding: 20 },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
    marginTop: 10,
  },
  mapBox: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 12,
  },
  mockMap: {
    height: 100,
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
  },
  mapPin: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#DA291C",
    borderWidth: 2,
    borderColor: "#FFF",
  },
  addressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
  },
  addressTitle: { fontSize: 14, fontWeight: "bold", color: "#111" },
  addressSub: { fontSize: 11, color: "#666", marginTop: 2 },
  changeText: { fontSize: 13, fontWeight: "bold", color: "#DA291C" },
  landmarkBox: {
    backgroundColor: "#FFF",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 12,
  },
  landmarkText: { fontSize: 13, color: "#555" },
  phoneBox: {
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  phoneLabel: { fontSize: 14, color: "#666" },
  phoneVal: { fontSize: 14, fontWeight: "bold", color: "#111" },
  payCard: {
    backgroundColor: "#FFF",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 10,
  },
  paySelected: { borderColor: "#DA291C", borderWidth: 1.5 },
  payHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  payTitle: { fontSize: 14, fontWeight: "bold", color: "#111" },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "#DA291C",
    justifyContent: "center",
    alignItems: "center",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#DA291C",
  },
  telcos: { flexDirection: "row", gap: 10, marginTop: 10 },
  telcoTag: {
    fontSize: 11,
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    fontWeight: "600",
  },
  footer: {
    padding: 20,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  orderBtn: {
    backgroundColor: "#DA291C",
    borderRadius: 24,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  orderBtnText: { color: "#FFF", fontSize: 15, fontWeight: "bold" },
});
