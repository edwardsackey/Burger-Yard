import { EXTRAS, formatPrice, getProduct } from "@/constants/catalog";
import { useCart, useMenuLoaded } from "@/store/app-store";
import { useLocalSearchParams, useRouter } from "expo-router";
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

export default function ProductDetailScreen() {
  const router = useRouter();
  useMenuLoaded();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const product = getProduct(id ?? "1");
  const { addItem } = useCart();
  // Nothing is pre-selected; extras are opt-in.
  const [selected, setSelected] = useState<string[]>([]);
  const [favourite, setFavourite] = useState(false);

  // Per product rather than per category: chips and drinks take no toppings.
  const offersExtras = product.allowsExtras;

  const toggleExtra = (name: string) =>
    setSelected((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name],
    );

  const chosenExtras = offersExtras ? selected : [];
  const extrasTotal = EXTRAS.filter((e) =>
    chosenExtras.includes(e.name),
  ).reduce((sum, e) => sum + e.price, 0);
  const total = product.price + extrasTotal;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.heroHeader}>
        <TouchableOpacity
          style={styles.circleBtn}
          onPress={() => router.back()}
        >
          <Text style={styles.btnText}>✕</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.circleBtn}
          onPress={() => setFavourite((f) => !f)}
        >
          <Text style={styles.btnText}>{favourite ? "❤️" : "🤍"}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.heroImageContainer}>
        <Image
          source={product.image}
          style={styles.heroImage}
          resizeMode={product.fit}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleRow}>
          <Text style={styles.title}>{product.name}</Text>
          <Text style={styles.price}>{formatPrice(product.price)}</Text>
        </View>
        <Text style={styles.metaText}>{product.rating} • 200+ sold</Text>
        <Text style={styles.description}>{product.desc}</Text>

        {offersExtras && (
          <>
            <Text style={styles.sectionHeader}>Add extras</Text>

            {EXTRAS.map((extra) => {
              const isOn = selected.includes(extra.name);
              return (
                <TouchableOpacity
                  key={extra.name}
                  style={styles.extraItem}
                  onPress={() => toggleExtra(extra.name)}
                >
                  <View
                    style={[styles.checkbox, isOn && styles.checkboxSelected]}
                  >
                    {isOn && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={styles.extraName}>{extra.name}</Text>
                  <Text style={styles.extraPrice}>
                    + {formatPrice(extra.price)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.addToCartBtn}
          onPress={() => {
            addItem(product.id, chosenExtras);
            router.back();
          }}
        >
          <Text style={styles.addToCartText}>
            Add to cart • {formatPrice(total)}
          </Text>
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
    height: 240,
    // white, so letterboxed packshots blend into their own backdrop
    backgroundColor: "#FFFFFF",
    marginTop: -48,
    overflow: "hidden",
  },
  heroImage: { width: "100%", height: "100%" },
  scrollContent: { padding: 20, paddingBottom: 100 },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  title: { fontSize: 20, fontWeight: "bold", color: "#111", flex: 1 },
  price: { fontSize: 20, fontWeight: "bold", color: "#D62828" },
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
  checkboxSelected: { backgroundColor: "#D62828", borderColor: "#D62828" },
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
    backgroundColor: "#D62828",
    borderRadius: 24,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  addToCartText: { color: "#FFF", fontSize: 16, fontWeight: "bold" },
});
