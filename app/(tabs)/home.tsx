import { FillParent } from "@/constants/brand";
import {
  BRAND_IMAGES,
  PRODUCTS,
  PROMO_IMAGES,
  formatPrice,
} from "@/constants/catalog";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
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

  const filteredItems =
    activeCategory === "All"
      ? PRODUCTS
      : PRODUCTS.filter((item) => item.category === activeCategory);

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
          {/* A plain product shot, not one of the promo posters - those carry
              their own baked-in headline and fight with the copy below. */}
          <Image
            source={BRAND_IMAGES.hero}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
          <View style={styles.bannerScrim} />
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
              onPress={() => router.push("/product-detail?id=2")}
            >
              <Text style={styles.bannerBtnText}>Order now</Text>
            </TouchableOpacity>
          </View>
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

        {/* Promo posters, shown whole so their own artwork reads */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.promoRow}
        >
          {[PROMO_IMAGES.hunger, PROMO_IMAGES.bite].map((art, index) => (
            <TouchableOpacity
              key={index}
              style={styles.promoCard}
              activeOpacity={0.9}
              onPress={() => router.push("/(tabs)/menu")}
            >
              <Image
                source={art}
                style={styles.promoImage}
                resizeMode="cover"
              />
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
                onPress={() => router.push(`/product-detail?id=${item.id}`)}
              >
                <Image
                  source={item.image}
                  style={styles.cardImage}
                  resizeMode="cover"
                />
                <View style={styles.ratingBadge}>
                  <Text style={styles.ratingText}>★ {item.rating}</Text>
                </View>
              </TouchableOpacity>

              <View style={styles.cardInfo}>
                <TouchableOpacity
                  onPress={() => router.push(`/product-detail?id=${item.id}`)}
                >
                  <Text style={styles.itemName} numberOfLines={1}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
                <Text style={styles.itemCategory}>{item.category}</Text>

                <View style={styles.cardFooter}>
                  <Text style={styles.itemPrice}>{formatPrice(item.price)}</Text>
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
    color: "#D62828",
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
    backgroundColor: "#D62828",
  },
  cartBadge: {
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
    marginBottom: 20,
    overflow: "hidden",
    minHeight: 176,
    justifyContent: "center",
  },
  bannerScrim: {
    ...FillParent,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  bannerTextContainer: { paddingRight: 10 },
  bannerTag: {
    backgroundColor: "#D62828",
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
    backgroundColor: "#D62828",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    alignSelf: "flex-start",
  },
  bannerBtnText: { color: "#FFF", fontSize: 12, fontWeight: "bold" },
  categoriesRow: { gap: 8, marginBottom: 20 },
  categoryPill: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  categoryPillActive: { backgroundColor: "#D62828", borderColor: "#D62828" },
  categoryText: { fontSize: 13, fontWeight: "600", color: "#444" },
  categoryTextActive: { color: "#FFF" },
  promoRow: { gap: 12, marginBottom: 20 },
  promoCard: {
    width: 210,
    height: 196,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#FFF",
  },
  promoImage: { width: "100%", height: "100%" },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitleText: { fontSize: 16, fontWeight: "bold", color: "#111" },
  seeAllText: { fontSize: 13, fontWeight: "bold", color: "#D62828" },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    // Row gap only - a column gap on top of the 48% widths pushes the
    // second card onto its own line at 390px.
    rowGap: 14,
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
  cardImage: { width: "100%", height: "100%" },
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
  itemPrice: { fontSize: 14, fontWeight: "bold", color: "#D62828" },
  addBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
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
