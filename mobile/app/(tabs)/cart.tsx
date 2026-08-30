import { findProduct, getProduct } from "@/constants/catalog";
import { useCart, useMenuLoaded } from "@/store/app-store";
import { useRouter } from "expo-router";
import React from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CartScreen() {
  const router = useRouter();
  useMenuLoaded();
  const { lines, subtotal, deliveryFee, total, changeQuantity, removeLine, clear } =
    useCart();
  const hasUnavailable = lines.some((line) => !findProduct(line.productId));

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Cart</Text>
        {lines.length > 0 && (
          <TouchableOpacity onPress={clear}>
            <Text style={styles.clearText}>Clear all</Text>
          </TouchableOpacity>
        )}
      </View>

      {lines.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🛒</Text>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySub}>
            Looks like you haven&apos;t added any burgers to your yard yet.
          </Text>
          <TouchableOpacity
            style={styles.exploreBtn}
            onPress={() => router.push("/(tabs)/menu")}
          >
            <Text style={styles.exploreBtnText}>Explore Menu</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Items List */}
            <View style={styles.list}>
              {lines.map((line) => {
                const product = findProduct(line.productId);
                const unavailable = !product;
                const thumb = product ?? getProduct(line.productId);
                return (
                  <View key={line.key} style={styles.card}>
                    {/* The thumbnail and text open the product so extras can
                        be changed. The stepper stays outside this, so tapping
                        a quantity button does not also open the product. */}
                    <TouchableOpacity
                      style={styles.tapArea}
                      activeOpacity={0.7}
                      disabled={unavailable}
                      onPress={() =>
                        router.push(`/product-detail?id=${line.productId}`)
                      }
                    >
                      <View style={[styles.thumbBox, unavailable && styles.thumbBoxDim]}>
                        <Image
                          source={thumb.image}
                          style={styles.thumb}
                          resizeMode={thumb.fit}
                        />
                      </View>

                      <View style={styles.cardInfo}>
                        <Text style={[styles.itemName, unavailable && styles.itemNameDim]}>
                          {line.name}
                        </Text>
                        {unavailable ? (
                          <Text style={styles.unavailableText}>No longer available</Text>
                        ) : (
                          <Text style={styles.itemModifiers}>
                            {line.extras.length
                              ? `+ ${line.extras.join(", ")}`
                              : "Standard"}
                          </Text>
                        )}
                        <Text style={[styles.itemPrice, unavailable && styles.itemNameDim]}>
                          GHS {line.unitPrice * line.quantity}
                        </Text>
                      </View>
                    </TouchableOpacity>

                    {unavailable ? (
                      <TouchableOpacity
                        style={styles.removeBtn}
                        onPress={() => removeLine(line.key)}
                      >
                        <Text style={styles.removeBtnText}>Remove</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.qtyControl}>
                        <TouchableOpacity
                          style={styles.qtyBtn}
                          onPress={() => changeQuantity(line.key, -1)}
                        >
                          <Text style={styles.qtyBtnText}>-</Text>
                        </TouchableOpacity>
                        <Text style={styles.qtyText}>{line.quantity}</Text>
                        <TouchableOpacity
                          style={styles.qtyBtn}
                          onPress={() => changeQuantity(line.key, 1)}
                        >
                          <Text style={styles.qtyBtnText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>

            {/* Promo Code Box */}
            <View style={styles.promoBox}>
              <Text style={styles.promoText}>
                🎁 Have a promo code? Add it at checkout
              </Text>
            </View>

            {/* Bill Summary */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryVal}>GHS {subtotal}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Delivery fee (Ayeduase)</Text>
                <Text style={styles.summaryVal}>GHS {deliveryFee}</Text>
              </View>
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalVal}>GHS {total}</Text>
              </View>
            </View>
          </ScrollView>

          {/* Checkout Footer Bar */}
          <View style={styles.footer}>
            {hasUnavailable && (
              <Text style={styles.blockedHint}>
                Remove the unavailable item(s) above to continue.
              </Text>
            )}
            <TouchableOpacity
              style={[styles.checkoutBtn, hasUnavailable && styles.checkoutBtnDisabled]}
              disabled={hasUnavailable}
              onPress={() => router.push("/checkout")}
            >
              <Text style={styles.checkoutText}>
                Proceed to Checkout • GHS {total}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
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
  clearText: { fontSize: 13, fontWeight: "bold", color: "#D62828" },
  scrollContent: { padding: 20, paddingBottom: 100 },
  list: { gap: 12, marginBottom: 20 },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  tapArea: { flex: 1, flexDirection: "row", alignItems: "center" },
  thumbBox: {
    width: 56,
    height: 56,
    borderRadius: 12,
    // white, so the letterboxed packshots blend into their own backdrop
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  thumb: { width: "100%", height: "100%" },
  thumbBoxDim: { opacity: 0.4 },
  cardInfo: { flex: 1, marginLeft: 12 },
  itemName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#111",
    marginBottom: 2,
  },
  itemNameDim: { color: "#9CA3AF" },
  itemModifiers: { fontSize: 11, color: "#666", marginBottom: 4 },
  unavailableText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#D62828",
    marginBottom: 4,
  },
  itemPrice: { fontSize: 14, fontWeight: "bold", color: "#D62828" },
  removeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D62828",
  },
  removeBtnText: { fontSize: 12, fontWeight: "bold", color: "#D62828" },
  qtyControl: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    padding: 4,
    gap: 8,
  },
  qtyBtn: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    elevation: 1,
  },
  qtyBtnText: { fontSize: 14, fontWeight: "bold", color: "#111" },
  qtyText: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#111",
    minWidth: 14,
    textAlign: "center",
  },
  promoBox: {
    backgroundColor: "#FFF5F5",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FEE2E2",
    marginBottom: 20,
  },
  promoText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#D62828",
    textAlign: "center",
  },
  summaryCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 10,
  },
  summaryRow: { flexDirection: "row", justifyContent: "space-between" },
  summaryLabel: { fontSize: 13, color: "#666" },
  summaryVal: { fontSize: 13, fontWeight: "600", color: "#111" },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingTop: 10,
    marginTop: 4,
  },
  totalLabel: { fontSize: 15, fontWeight: "bold", color: "#111" },
  totalVal: { fontSize: 16, fontWeight: "bold", color: "#D62828" },
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
  checkoutBtn: {
    backgroundColor: "#D62828",
    borderRadius: 24,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  checkoutBtnDisabled: { backgroundColor: "#F3A5A5" },
  checkoutText: { color: "#FFF", fontSize: 15, fontWeight: "bold" },
  blockedHint: {
    fontSize: 12,
    color: "#D62828",
    textAlign: "center",
    marginBottom: 10,
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  emptyEmoji: { fontSize: 64, marginBottom: 14 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111",
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 18,
  },
  exploreBtn: {
    backgroundColor: "#D62828",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  exploreBtnText: { color: "#FFF", fontSize: 14, fontWeight: "bold" },
});
