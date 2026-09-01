import { apiFetch } from "@/api";
import { LoadingScreen } from "@/components/loading-screen";
import { LocationMap, Region } from "@/components/location-map";
import { EXTRAS_PRICES } from "@/constants/catalog";
import {
  NETWORKS,
  detectNetwork,
  isCompletePhone,
  networkLabel,
  type NetworkId,
} from "@/constants/networks";
import { useAccount, useCart, useDeliveryLocation, useNotifications } from "@/store/app-store";
import { useRouter } from "expo-router";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Roughly central Kumasi — a reasonable default until the customer moves the pin.
const DEFAULT_REGION: Region = {
  latitude: 6.6666,
  longitude: -1.6163,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

// Message plus one optional action button — replaces Alert.alert, which is
// unreliable on react-native-web (some versions no-op instead of showing
// a dialog, dropping both plain alerts and multi-button choices silently).
type Prompt = { message: string; actionLabel?: string; onAction?: () => void };

export default function CheckoutScreen() {
  const router = useRouter();
  const { account, card } = useAccount();
  const { deliveryLocation, setDeliveryLocation } = useDeliveryLocation();
  const [payment, setPayment] = useState("momo");
  const [network, setNetwork] = useState<NetworkId>("mtn");
  const [phone, setPhone] = useState(account.phone);
  const [placing, setPlacing] = useState(false);
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const { lines, deliveryFee, total, clear } = useCart();
  const { notify } = useNotifications();

  // The map picker, embedded directly on this screen rather than a separate
  // one — starts centered on whatever's already picked this session, or the
  // default area if nothing's been pinned yet.
  const [region, setRegion] = useState<Region>(
    deliveryLocation?.latitude
      ? { ...DEFAULT_REGION, latitude: deliveryLocation.latitude, longitude: deliveryLocation.longitude }
      : DEFAULT_REGION,
  );
  const [confirmingLocation, setConfirmingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Default to the number they signed in with, without locking them to it:
  // only seed it while the field is still untouched.
  useEffect(() => {
    setPhone((current) => (current ? current : account.phone));
  }, [account.phone]);

  // Nothing picked yet this session — fall back to the account's default
  // saved address rather than showing a blank delivery location.
  useEffect(() => {
    if (deliveryLocation) return;
    apiFetch("/addresses")
      .then((addresses) => {
        const active = addresses.find((a: any) => a.isDefault) ?? addresses[0];
        if (active) {
          setDeliveryLocation({
            label: active.label,
            city: active.city,
            landmark: active.details,
            latitude: 0,
            longitude: 0,
          });
        }
      })
      .catch(() => {
        // No saved address yet — the map picker is still available via "Change".
      });
  }, [deliveryLocation, setDeliveryLocation]);

  // Which network the number itself belongs to, once enough digits are in.
  const detected = detectNetwork(phone);
  const complete = isCompletePhone(phone);
  const mismatch = payment === "momo" && detected !== null && detected !== network;

  const handleConfirmLocation = async () => {
    setConfirmingLocation(true);
    setLocationError(null);
    try {
      const { landmark, city } = await apiFetch(
        `/places/nearby-landmark?lat=${region.latitude}&lng=${region.longitude}`,
      );
      setDeliveryLocation({
        label: landmark,
        city,
        landmark,
        latitude: region.latitude,
        longitude: region.longitude,
      });
    } catch (error) {
      setLocationError(
        error instanceof Error ? error.message : "Couldn't look up that location.",
      );
    } finally {
      setConfirmingLocation(false);
    }
  };

  const handlePlaceOrder = async () => {
    setPrompt(null);

    if (!deliveryLocation) {
      setPrompt({ message: "Pick where the rider should bring your order." });
      return;
    }

    if (!complete) {
      setPrompt({ message: "Enter the full 10 digit number the rider should call." });
      return;
    }

    if (mismatch && detected) {
      setPrompt({
        message: `That number belongs to ${networkLabel(detected)}, but you picked ${networkLabel(network)}.`,
        actionLabel: `Use ${networkLabel(detected)} instead`,
        onAction: () => {
          setNetwork(detected);
          setPrompt(null);
        },
      });
      return;
    }

    if (payment === "card" && !card) {
      setPrompt({
        message: "Add your card details before ordering.",
        actionLabel: "Add card",
        onAction: () => {
          setPrompt(null);
          router.push("/card-details");
        },
      });
      return;
    }

    const summary = lines
      .map((l) => (l.quantity > 1 ? `${l.quantity}x ${l.name}` : l.name))
      .join(", ");

    setPlacing(true);
    try {
      const { order } = await apiFetch("/customer/orders", {
        method: "POST",
        body: JSON.stringify({
          items: lines.map((l) => ({
            menuItemId: parseInt(l.productId),
            quantity: l.quantity,
            extras: l.extras.map((name) => ({ name, price: EXTRAS_PRICES[name] ?? 0 })),
          })),
          landmark: deliveryLocation.landmark,
          phone,
          paymentMethod: payment.toUpperCase(),
          momoNetwork: payment === "momo" ? network.toUpperCase() : undefined,
          deliveryFee,
        }),
      });

      if (payment !== "cash") {
        // openBrowserAsync has no way to detect a redirect — it only
        // resolves when the user manually taps close, which is why the app
        // never noticed a completed MoMo/card payment. openAuthSessionAsync
        // watches for Paystack navigating back to this URL and auto-closes.
        const callbackUrl = Linking.createURL("payment-callback");
        const { authorization_url, reference } = await apiFetch("/payments/initialize", {
          method: "POST",
          body: JSON.stringify({ orderId: order.id, callbackUrl }),
        });
        await WebBrowser.openAuthSessionAsync(authorization_url, callbackUrl);

        // The redirect alone doesn't guarantee the charge succeeded, so the
        // actual outcome is still checked explicitly rather than assumed.
        const { status } = await apiFetch(`/payments/verify/${reference}`);
        if (status !== "success") {
          setPrompt({
            message:
              status === "abandoned"
                ? "Payment wasn't completed. Your order is saved — try paying again."
                : "Payment failed. Your order is saved — try paying again.",
          });
          return;
        }
      }

      notify(
        "Your order is being prepared",
        `${summary || "Your order"}. Estimated 20 min.`,
      );
      clear();
      router.push({ pathname: "/order-placed", params: { orderId: String(order.id) } });
    } catch (err) {
      setPrompt({ message: err instanceof Error ? err.message : "Please try again." });
    } finally {
      setPlacing(false);
    }
  };

  if (placing) return <LoadingScreen label="Placing your order" />;

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
        // dragging the list puts the number pad away, and taps still reach
        // the payment options while it is open
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.sectionLabel}>Delivery location</Text>
        <View style={styles.mapBox}>
          <View style={styles.mapArea}>
            <LocationMap
              initialRegion={region}
              onRegionChangeComplete={(next) => {
                setRegion(next);
                setLocationError(null);
              }}
            />
            {/* Fixed at the box's center; the map pans underneath it. */}
            <View pointerEvents="none" style={styles.centerPin}>
              <Text style={styles.pinGlyph}>📍</Text>
            </View>
          </View>

          <View style={styles.addressRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.addressTitle} numberOfLines={1}>
                {deliveryLocation?.label ?? "Move the map to set your location"}
              </Text>
              <Text style={styles.addressSub}>
                {deliveryLocation ? `${deliveryLocation.city} • GPS pin set` : "Then tap “Use this spot”"}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.confirmLocationBtn}
              onPress={handleConfirmLocation}
              disabled={confirmingLocation}
            >
              {confirmingLocation ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.confirmLocationText}>Use this spot</Text>
              )}
            </TouchableOpacity>
          </View>
          {locationError && <Text style={styles.locationErrorText}>{locationError}</Text>}
        </View>

        <View style={styles.landmarkBox}>
          <Text style={styles.landmarkText}>
            📍 Landmark: {deliveryLocation?.landmark ?? "not set"}
          </Text>
        </View>

        <View style={styles.phoneBox}>
          <Text style={styles.phoneLabel}>Phone</Text>
          <TextInput
            style={styles.phoneInput}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="054 392 7440"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <Text style={styles.sectionLabel}>Payment method</Text>

        <TouchableOpacity
          style={[styles.payCard, payment === "momo" && styles.paySelected]}
          onPress={() => setPayment("momo")}
        >
          <View style={styles.payHeader}>
            <Text style={styles.payTitle}>MoMo Mobile Money</Text>
            <View style={styles.radioOuter}>
              {payment === "momo" && <View style={styles.radioInner} />}
            </View>
          </View>
          {payment === "momo" && (
            <Text style={styles.paySub}>
              {NETWORKS.find((n) => n.id === network)?.label} selected
            </Text>
          )}
        </TouchableOpacity>

        {/* Deliberately a sibling of the card, not a child of it: nesting these
            inside the card's own touchable stops their presses landing. */}
        {payment === "momo" && (
          <View style={styles.networks}>
            {NETWORKS.map((n) => {
              const active = network === n.id;
              return (
                <TouchableOpacity
                  key={n.id}
                  style={[styles.networkRow, active && styles.networkActive]}
                  onPress={() => setNetwork(n.id)}
                >
                  <Image
                    source={n.logo}
                    style={styles.networkLogo}
                    resizeMode="cover"
                    accessibilityLabel={n.label}
                  />
                  <Text
                    style={[
                      styles.networkLabel,
                      active && styles.networkLabelActive,
                    ]}
                  >
                    {n.label}
                  </Text>
                  <View
                    style={[
                      styles.radioOuterSm,
                      !active && styles.radioOuterIdle,
                    ]}
                  >
                    {active && <View style={styles.radioInnerSm} />}
                  </View>
                </TouchableOpacity>
              );
            })}

            {mismatch && detected && (
              <View style={styles.warnBox}>
                <Text style={styles.warnText}>
                  {phone.trim()} belongs to {networkLabel(detected)}, but{" "}
                  {networkLabel(network)} is selected.
                </Text>
                <TouchableOpacity onPress={() => setNetwork(detected)}>
                  <Text style={styles.warnAction}>
                    Switch to {networkLabel(detected)}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

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
          {payment === "card" && card && (
            <Text style={styles.paySub}>
              •••• {card.last4} · expires {card.expiry}
            </Text>
          )}
        </TouchableOpacity>

        {/* Sibling of the card, same reason as the networks above */}
        {payment === "card" && (
          <TouchableOpacity
            style={styles.cardCta}
            onPress={() => router.push("/card-details")}
          >
            <Text style={styles.cardCtaText}>
              {card ? "Change card details" : "+ Add card details"}
            </Text>
          </TouchableOpacity>
        )}

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
        {prompt && (
          <View style={styles.promptBox}>
            <Text style={styles.promptText}>{prompt.message}</Text>
            <View style={styles.promptActions}>
              {prompt.actionLabel && prompt.onAction && (
                <TouchableOpacity onPress={prompt.onAction}>
                  <Text style={styles.promptAction}>{prompt.actionLabel}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => setPrompt(null)}>
                <Text style={styles.promptDismiss}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        <TouchableOpacity
          style={styles.orderBtn}
          onPress={handlePlaceOrder}
        >
          <Text style={styles.orderBtnText}>Place order • GHS {total}</Text>
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
  mapArea: {
    height: 200,
    backgroundColor: "#E5E7EB",
  },
  centerPin: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -14,
    marginTop: -28,
  },
  pinGlyph: { fontSize: 28 },
  addressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    gap: 10,
  },
  addressTitle: { fontSize: 14, fontWeight: "bold", color: "#111" },
  addressSub: { fontSize: 11, color: "#666", marginTop: 2 },
  confirmLocationBtn: {
    backgroundColor: "#D62828",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    minWidth: 92,
    alignItems: "center",
  },
  confirmLocationText: { fontSize: 12.5, fontWeight: "bold", color: "#FFF" },
  locationErrorText: {
    fontSize: 11.5,
    color: "#D62828",
    paddingHorizontal: 14,
    paddingBottom: 12,
  },
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
  phoneInput: {
    flex: 1,
    marginLeft: 16,
    textAlign: "right",
    fontSize: 14,
    fontWeight: "bold",
    color: "#111",
  },
  payCard: {
    backgroundColor: "#FFF",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 10,
  },
  paySelected: { borderColor: "#D62828", borderWidth: 1.5 },
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
    borderColor: "#D62828",
    justifyContent: "center",
    alignItems: "center",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#D62828",
  },
  paySub: { fontSize: 11, color: "#D62828", fontWeight: "600", marginTop: 6 },
  networks: { gap: 8, marginBottom: 10, paddingLeft: 12 },
  warnBox: {
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "#FDE68A",
    borderRadius: 10,
    padding: 12,
    marginTop: 4,
  },
  warnText: { fontSize: 12, color: "#92400E", lineHeight: 17 },
  warnAction: {
    fontSize: 12,
    fontWeight: "700",
    color: "#B45309",
    marginTop: 8,
  },
  cardCta: {
    borderWidth: 1.5,
    borderColor: "#D62828",
    borderStyle: "dashed",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 10,
    marginLeft: 12,
  },
  cardCtaText: { fontSize: 13, fontWeight: "700", color: "#D62828" },
  networkRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  networkActive: { borderColor: "#D62828", backgroundColor: "#FFF5F5" },
  networkLogo: {
    width: 51,
    height: 34,
    borderRadius: 7,
    marginRight: 10,
    // The artwork carries the brand colour right to its edge, so clip it
    // rather than let square corners sit inside a rounded row.
    overflow: "hidden",
  },
  networkLabel: { flex: 1, fontSize: 13, fontWeight: "600", color: "#444" },
  networkLabelActive: { color: "#111" },
  radioOuterSm: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#D62828",
    justifyContent: "center",
    alignItems: "center",
  },
  radioOuterIdle: { borderColor: "#D1D5DB" },
  radioInnerSm: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#D62828",
  },
  footer: {
    padding: 20,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  promptBox: {
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "#FDE68A",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  promptText: { fontSize: 12.5, color: "#92400E", lineHeight: 17 },
  promptActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 16,
    marginTop: 8,
  },
  promptAction: { fontSize: 12.5, fontWeight: "700", color: "#B45309" },
  promptDismiss: { fontSize: 12.5, fontWeight: "600", color: "#92400E" },
  orderBtn: {
    backgroundColor: "#D62828",
    borderRadius: 24,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  orderBtnText: { color: "#FFF", fontSize: 15, fontWeight: "bold" },
});
