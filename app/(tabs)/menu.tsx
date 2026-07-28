import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MenuScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [cartCount, setCartCount] = useState(2);

  const menuItems = [
    {
      id: "1",
      name: "Single Cheese Burger",
      category: "Burgers",
      price: "GHS 70",
      rating: "4.8",
      emoji: "🍔",
      desc: "Beef patty, cheddar, lettuce, onions & yard sauce",
    },
    {
      id: "2",
      name: "Double Cheese Burger",
      category: "Burgers",
      price: "GHS 100",
      rating: "4.9",
      emoji: "🍔",
      desc: "Double beef patties, double cheese, caramelized onions",
    },
    {
      id: "3",
      name: "Crispy Chicken Burger",
      category: "Burgers",
      price: "GHS 85",
      rating: "4.7",
      emoji: "🍗",
      desc: "Crunchy fried chicken fillet, coleslaw & spicy mayo",
    },
    {
      id: "4",
      name: "Loaded French Fries",
      category: "Sides",
      price: "GHS 40",
      rating: "4.6",
      emoji: "🍟",
      desc: "Crispy golden fries topped with melted cheese and bits",
    },
    {
      id: "5",
      name: "Onion Rings",
      category: "Sides",
      price: "GHS 35",
      rating: "4.5",
      emoji: "🧅",
      desc: "Golden battered crispy onion rings with dip",
    },
    {
      id: "6",
      name: "Coca-Cola (Cold)",
      category: "Drinks",
      price: "GHS 15",
      rating: "4.9",
      emoji: "🥤",
      desc: "Chilled 500ml PET bottle",
    },
    {
      id: "7",
      name: "Sprite / Fanta",
      category: "Drinks",
      price: "GHS 15",
      rating: "4.8",
      emoji: "🥤",
      desc: "Chilled 500ml refreshing soda",
    },
  ];

  const filteredItems =
    selectedCategory === "All"
      ? menuItems
      : menuItems.filter((item) => item.category === selectedCategory);

  const handleAddToCart = (itemName: string) => {
    setCartCount((prev) => prev + 1);
    Alert.alert("Added to Cart", `${itemName} has been added to your order!`);
  };

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
          {cartCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{cartCount}</Text>
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
          {["All", "Burgers", "Sides", "Drinks"].map((cat) => (
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
              style={styles.emojiBox}
              onPress={() => router.push("/product-detail")}
            >
              <Text style={styles.emoji}>{item.emoji}</Text>
            </TouchableOpacity>

            <View style={styles.cardInfo}>
              <TouchableOpacity onPress={() => router.push("/product-detail")}>
                <Text style={styles.itemName}>{item.name}</Text>
              </TouchableOpacity>
              <Text style={styles.itemDesc} numberOfLines={1}>
                {item.desc}
              </Text>

              <View style={styles.cardFooter}>
                <Text style={styles.itemPrice}>{item.price}</Text>
                <TouchableOpacity
                  style={styles.addBtn}
                  onPress={() => handleAddToCart(item.name)}
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
    backgroundColor: "#DA291C",
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
  filterTabActive: { backgroundColor: "#DA291C" },
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
  emojiBox: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  emoji: { fontSize: 36 },
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
  itemPrice: { fontSize: 15, fontWeight: "bold", color: "#DA291C" },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#DA291C",
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
