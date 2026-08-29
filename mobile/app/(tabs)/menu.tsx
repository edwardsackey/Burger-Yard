import { formatPrice, getCategories, getProducts } from "@/constants/catalog";
import { useCart, useMenuLoaded } from "@/store/app-store";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MenuScreen() {
  const router = useRouter();
  useMenuLoaded();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const { itemCount, addItem } = useCart();

  const products = getProducts();
  const filteredItems =
    selectedCategory === "All"
      ? products
      : products.filter((item) => item.category === selectedCategory);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Full Menu</Text>
        <TouchableOpacity
          style={styles.cartBtn}
          onPress={() => router.push("/(tabs)/cart")}
        >
          <Text style={styles.cartIcon}>🛒</Text>
          {itemCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{itemCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Category Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {["All", ...getCategories()].map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.filterTab,
                selectedCategory === cat && styles.filterTabActive,
              ]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text
                style={[
                  styles.filterText,
                  selectedCategory === cat && styles.filterTextActive,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Item List */}
      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredItems.map((item) => (
          <View key={item.id} style={styles.card}>
            <TouchableOpacity
              style={styles.thumbBox}
              onPress={() => router.push(`/product-detail?id=${item.id}`)}
            >
              <Image
                source={item.image}
                style={styles.thumb}
                resizeMode={item.fit}
              />
            </TouchableOpacity>

            <View style={styles.cardInfo}>
              <TouchableOpacity
                onPress={() => router.push(`/product-detail?id=${item.id}`)}
              >
                <Text style={styles.itemName}>{item.name}</Text>
              </TouchableOpacity>
              <Text style={styles.itemDesc} numberOfLines={1}>
                {item.desc}
              </Text>

              <View style={styles.cardFooter}>
                <Text style={styles.itemPrice}>{formatPrice(item.price)}</Text>
                <TouchableOpacity
                  style={styles.addBtn}
                  onPress={() => addItem(item.id)}
                >
                  <Text style={styles.addBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
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
    paddingVertical: 14,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#111" },
  cartBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  cartIcon: { fontSize: 16 },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#D62828",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeText: { color: "#FFF", fontSize: 10, fontWeight: "bold" },
  filterContainer: {
    backgroundColor: "#FFF",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  filterScroll: { paddingHorizontal: 20, gap: 8 },
  filterTab: {
    paddingVertical: 6,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
  },
  filterTabActive: { backgroundColor: "#D62828" },
  filterText: { fontSize: 13, fontWeight: "600", color: "#555" },
  filterTextActive: { color: "#FFF" },
  listContent: { padding: 20, gap: 12 },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  thumbBox: {
    width: 72,
    height: 72,
    borderRadius: 12,
    // white, so letterboxed packshots blend into their own backdrop
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  thumb: { width: "100%", height: "100%" },
  cardInfo: { flex: 1, marginLeft: 14 },
  itemName: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#111",
    marginBottom: 2,
  },
  itemDesc: { fontSize: 12, color: "#666", marginBottom: 8 },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemPrice: { fontSize: 15, fontWeight: "bold", color: "#D62828" },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#D62828",
    justifyContent: "center",
    alignItems: "center",
  },
  addBtnText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
    lineHeight: 20,
  },
});
