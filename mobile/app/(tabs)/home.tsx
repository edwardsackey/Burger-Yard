import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState("All");
  const [cartCount, setCartCount] = useState(2); // Simulated cart items count

  // Menu items list with categories
  const menuItems = [
    {
      id: "1",
      name: "Single Cheese Burger",
      category: "Burgers",
      price: "GHS 70",
      rating: "4.8",
      emoji: "🍔",
    },
    {
      id: "2",
      name: "Double Cheese Burger",
      category: "Burgers",
      price: "GHS 100",
      rating: "4.9",
      emoji: "🍔",
    },
    {
      id: "3",
      name: "Crispy Chicken Burger",
      category: "Burgers",
      price: "GHS 85",
      rating: "4.7",
      emoji: "🍗",
    },
    {
      id: "4",
      name: "Loaded French Fries",
      category: "Sides",
      price: "GHS 40",
      rating: "4.6",
      emoji: "🍟",
    },
    {
      id: "5",
      name: "Onion Rings",
      category: "Sides",
      price: "GHS 35",
      rating: "4.5",
      emoji: "🧅",
    },
    {
      id: "6",
      name: "Coca-Cola (Cold)",
      category: "Drinks",
      price: "GHS 15",
      rating: "4.9",
      emoji: "🥤",
    },
    {
      id: "7",
      name: "Sprite / Fanta",
      category: "Drinks",
      price: "GHS 15",
      rating: "4.8",
      emoji: "🥤",
    },
  ];

  const filteredItems =
    activeCategory === "All"
      ? menuItems
      : menuItems.filter((item) => item.category === activeCategory);

  const handleAddToCart = (itemName: string) => {
    setCartCount((prev) => prev + 1);
    Alert.alert("Added to Cart", `${itemName} has been added to your cart!`);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Top Header Bar */}
      <View style={styles.header}>
        <View>
          <Text style={styles.locationLabel}>DELIVER TO</Text>
          <TouchableOpacity
            style={styles.locationRow}
            onPress={() => router.push("/saved-addresses")}
          >
            <Text style={styles.locationText}>Ayeduase New Site</Text>
            <Text style={styles.chevron}>▾</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.headerIcons}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.push("/notifications")}
          >
            <Text style={styles.iconEmoji}>🔔</Text>
            <View style={styles.notifBadge} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.push("/(tabs)/cart")}
          >
            <Text style={styles.iconEmoji}>🛒</Text>
            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar */}
        <TouchableOpacity
          style={styles.searchBar}
          activeOpacity={0.9}
          onPress={() => router.push("/search-favorites")}
        >
          <Text style={styles.searchIcon}>🔍</Text>
          <Text style={styles.searchPlaceholder}>
            Search burgers, sides, drinks...
          </Text>
        </TouchableOpacity>

        {/* Hero Promo Banner */}
        <View style={styles.banner}>
          <View style={styles.bannerTextContainer}>
            <View style={styles.bannerTag}>
              <Text style={styles.bannerTagText}>WEEKEND SPECIAL</Text>
            </View>
            <Text style={styles.bannerTitle}>Double Yard Deal</Text>
            <Text style={styles.bannerSub}>
              Get 2 Double Cheese Burgers + Large Fries for GHS 180
            </Text>

            <TouchableOpacity
              style={styles.bannerBtn}
              onPress={() => router.push("/product-detail")}
            >
              <Text style={styles.bannerBtnText}>Order now</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.bannerEmoji}>🍔</Text>
        </View>

        {/* Category Pills Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesRow}
        >
          {["All", "Burgers", "Sides", "Drinks", "See All"].map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryPill,
                activeCategory === cat && styles.categoryPillActive,
              ]}
              onPress={() => {
                if (cat === "See All") {
                  router.push("/(tabs)/menu");
                } else {
                  setActiveCategory(cat);
                }
              }}
            >
              <Text
                style={[
                  styles.categoryText,
                  activeCategory === cat && styles.categoryTextActive,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Section Title */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitleText}>
            Popular items ({activeCategory})
          </Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/menu")}>
            <Text style={styles.seeAllText}>See all</Text>
          </TouchableOpacity>
        </View>

        {/* Menu Grid / List */}
        <View style={styles.grid}>
          {filteredItems.map((item) => (
            <View key={item.id} style={styles.card}>
              <TouchableOpacity
                style={styles.cardImageContainer}
                onPress={() => router.push("/product-detail")}
              >
                <Text style={styles.cardEmoji}>{item.emoji}</Text>
                <View style={styles.ratingBadge}>
                  <Text style={styles.ratingText}>★ {item.rating}</Text>
                </View>
              </TouchableOpacity>

              <View style={styles.cardInfo}>
                <TouchableOpacity
                  onPress={() => router.push("/product-detail")}
                >
                  <Text style={styles.itemName} numberOfLines={1}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
                <Text style={styles.itemCategory}>{item.category}</Text>

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
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  locationLabel: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#DA291C",
    letterSpacing: 0.5,
  },
  locationRow: { flexDirection: "row", alignItems: "center", marginTop: 2 },
  locationText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#111",
    marginRight: 4,
  },
  chevron: { fontSize: 12, color: "#666" },
  headerIcons: { flexDirection: "row", gap: 10 },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  iconEmoji: { fontSize: 16 },
  notifBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#DA291C",
  },
  cartBadge: {
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
  cartBadgeText: { color: "#FFF", fontSize: 10, fontWeight: "bold" },
  scrollContent: { padding: 20, paddingBottom: 40 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  searchIcon: { fontSize: 16, marginRight: 10 },
  searchPlaceholder: { color: "#888", fontSize: 14 },
  banner: {
    backgroundColor: "#111",
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    overflow: "hidden",
  },
  bannerTextContainer: { flex: 1, paddingRight: 10 },
  bannerTag: {
    backgroundColor: "#DA291C",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  bannerTagText: {
    color: "#FFF",
    fontSize: 9,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 4,
  },
  bannerSub: {
    fontSize: 12,
    color: "#D1D5DB",
    lineHeight: 16,
    marginBottom: 14,
  },
  bannerBtn: {
    backgroundColor: "#DA291C",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    alignSelf: "flex-start",
  },
  bannerBtnText: { color: "#FFF", fontSize: 12, fontWeight: "bold" },
  bannerEmoji: { fontSize: 56 },
  categoriesRow: { gap: 8, marginBottom: 20 },
  categoryPill: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  categoryPillActive: { backgroundColor: "#DA291C", borderColor: "#DA291C" },
  categoryText: { fontSize: 13, fontWeight: "600", color: "#444" },
  categoryTextActive: { color: "#FFF" },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitleText: { fontSize: 16, fontWeight: "bold", color: "#111" },
  seeAllText: { fontSize: 13, fontWeight: "bold", color: "#DA291C" },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 14,
  },
  card: {
    width: "48%",
    backgroundColor: "#FFF",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 4,
  },
  cardImageContainer: {
    height: 110,
    backgroundColor: "#F9FAFB",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  cardEmoji: { fontSize: 44 },
  ratingBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ratingText: { color: "#FFF", fontSize: 10, fontWeight: "bold" },
  cardInfo: { padding: 12 },
  itemName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#111",
    marginBottom: 2,
  },
  itemCategory: { fontSize: 11, color: "#666", marginBottom: 8 },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemPrice: { fontSize: 14, fontWeight: "bold", color: "#DA291C" },
  addBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
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
