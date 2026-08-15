import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SearchFavoritesScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  // Complete menu database for searching
  const allMenuItems = [
    {
      id: "1",
      name: "Single Cheese Burger",
      category: "Burgers",
      price: "GHS 70",
      emoji: "🍔",
    },
    {
      id: "2",
      name: "Double Cheese Burger",
      category: "Burgers",
      price: "GHS 100",
      emoji: "🍔",
    },
    {
      id: "3",
      name: "Crispy Chicken Burger",
      category: "Burgers",
      price: "GHS 85",
      emoji: "🍗",
    },
    {
      id: "4",
      name: "Loaded French Fries",
      category: "Sides",
      price: "GHS 40",
      emoji: "🍟",
    },
    {
      id: "5",
      name: "Onion Rings",
      category: "Sides",
      price: "GHS 35",
      emoji: "🧅",
    },
    {
      id: "6",
      name: "Coca-Cola (Cold)",
      category: "Drinks",
      price: "GHS 15",
      emoji: "🥤",
    },
    {
      id: "7",
      name: "Sprite / Fanta",
      category: "Drinks",
      price: "GHS 15",
      emoji: "🥤",
    },
  ];

  // Smart spelling/partial match filtering
  const filteredResults =
    searchQuery.trim() === ""
      ? []
      : allMenuItems.filter(
          (item) =>
            item.name
              .toLowerCase()
              .includes(searchQuery.toLowerCase().trim()) ||
            item.category
              .toLowerCase()
              .includes(searchQuery.toLowerCase().trim()),
        );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.searchInput}
          placeholder="Search burgers, drinks, sides..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoFocus
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {searchQuery.trim() === "" ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🔍</Text>
            <Text style={styles.emptyTitle}>Search The Burger Yard</Text>
            <Text style={styles.emptySub}>
              Type any burger, side, or drink to find matches instantly.
            </Text>
          </View>
        ) : filteredResults.length > 0 ? (
          <View style={styles.resultsList}>
            <Text style={styles.resultCount}>
              Found {filteredResults.length} match(es)
            </Text>
            {filteredResults.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.resultCard}
                onPress={() => router.push("/product-detail")}
              >
                <View style={styles.emojiBox}>
                  <Text style={styles.itemEmoji}>{item.emoji}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemCategory}>{item.category}</Text>
                </View>
                <Text style={styles.itemPrice}>{item.price}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🍔</Text>
            <Text style={styles.emptyTitle}>No matching items found</Text>
            <Text style={styles.emptySub}>
              Try checking your spelling or search for another favorite.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    gap: 12,
  },
  backBtn: { width: 24, justifyContent: "center" },
  backText: { fontSize: 22, fontWeight: "bold", color: "#111" },
  searchInput: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 44,
    fontSize: 14,
    color: "#111",
  },
  clearText: { fontSize: 13, fontWeight: "bold", color: "#DA291C" },
  content: { padding: 20 },
  emptyContainer: {
    alignItems: "center",
    marginTop: 80,
    paddingHorizontal: 20,
  },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111",
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 13,
    color: "#666",
    textAlign: "center",
    lineHeight: 18,
  },
  resultsList: { gap: 10 },
  resultCount: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#888",
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  resultCard: {
    backgroundColor: "#FFF",
    borderRadius: 14,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  emojiBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#F9FAFB",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  itemEmoji: { fontSize: 24 },
  itemName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#111",
    marginBottom: 2,
  },
  itemCategory: { fontSize: 11, color: "#666" },
  itemPrice: { fontSize: 14, fontWeight: "bold", color: "#DA291C" },
});
