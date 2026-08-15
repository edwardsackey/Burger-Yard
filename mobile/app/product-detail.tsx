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

export default function ProductDetailScreen() {
  const router = useRouter();
  const [baconSelected, setBaconSelected] = useState(true);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.heroHeader}>
        <TouchableOpacity
          style={styles.circleBtn}
          onPress={() => router.back()}
        >
          <Text style={styles.btnText}>✕</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.circleBtn}>
          <Text style={styles.btnText}>❤️</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.heroImageContainer}>
        <Text style={styles.heroEmoji}>🍔</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleRow}>
          <Text style={styles.title}>Single Cheese Burger</Text>
          <Text style={styles.price}>GHS 70</Text>
        </View>
        <Text style={styles.metaText}>4.8 • 200+ sold</Text>
        <Text style={styles.description}>
          Beef patty, cheddar, lettuce, caramelized onions and our signature
          yard sauce.
        </Text>

        <Text style={styles.sectionHeader}>Add extras</Text>

        {[
          {
            name: "Bacon",
            price: "+ GHS 15",
            selected: baconSelected,
            toggle: () => setBaconSelected(!baconSelected),
          },
          {
            name: "Sausage",
            price: "+ GHS 8",
            selected: false,
            toggle: () => {},
          },
          {
            name: "Extra Egg",
            price: "+ GHS 8",
            selected: false,
            toggle: () => {},
          },
          {
            name: "Extra Cheese",
            price: "+ GHS 15",
            selected: false,
            toggle: () => {},
          },
          {
            name: "Extra Patty",
            price: "+ GHS 25",
            selected: false,
            toggle: () => {},
          },
          {
            name: "Coca-Cola",
            price: "+ GHS 10",
            selected: false,
            toggle: () => {},
          },
        ].map((extra, index) => (
          <TouchableOpacity
            key={index}
            style={styles.extraItem}
            onPress={extra.toggle}
          >
            <View
              style={[
                styles.checkbox,
                extra.selected && styles.checkboxSelected,
              ]}
            >
              {extra.selected && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.extraName}>{extra.name}</Text>
            <Text style={styles.extraPrice}>{extra.price}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.addToCartBtn}
          onPress={() => router.back()}
        >
          <Text style={styles.addToCartText}>Add to cart • GHS 85</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  heroHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 10,
    zIndex: 10,
  },
  circleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  btnText: { fontSize: 16, fontWeight: "bold" },
  heroImageContainer: {
    height: 200,
    backgroundColor: "#FDE68A",
    justifyContent: "center",
    alignItems: "center",
    marginTop: -48,
  },
  heroEmoji: { fontSize: 72 },
  scrollContent: { padding: 20, paddingBottom: 100 },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  title: { fontSize: 20, fontWeight: "bold", color: "#111", flex: 1 },
  price: { fontSize: 20, fontWeight: "bold", color: "#DA291C" },
  metaText: { fontSize: 12, color: "#666", marginBottom: 12 },
  description: {
    fontSize: 13,
    color: "#444",
    lineHeight: 18,
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#111",
    marginBottom: 14,
  },
  extraItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#D1D5DB",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  checkboxSelected: { backgroundColor: "#DA291C", borderColor: "#DA291C" },
  checkmark: { color: "#FFF", fontSize: 12, fontWeight: "bold" },
  extraName: { flex: 1, fontSize: 14, color: "#333" },
  extraPrice: { fontSize: 14, fontWeight: "600", color: "#666" },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFF",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  addToCartBtn: {
    backgroundColor: "#DA291C",
    borderRadius: 24,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  addToCartText: { color: "#FFF", fontSize: 16, fontWeight: "bold" },
});
