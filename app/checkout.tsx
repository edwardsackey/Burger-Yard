import { LoadingScreen } from "@/components/loading-screen";
import {
  NETWORKS,
  detectNetwork,
  isCompletePhone,
  networkLabel,
  type NetworkId,
} from "@/constants/networks";
import { useAccount, useCart, useNotifications } from "@/store/app-store";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CheckoutScreen() {
  const router = useRouter();
  const { account, card } = useAccount();
  const [payment, setPayment] = useState("momo");
  const [network, setNetwork] = useState<NetworkId>("mtn");
  const [phone, setPhone] = useState(account.phone);
  const [placing, setPlacing] = useState(false);
  const { lines, total, clear } = useCart();
  const { notify } = useNotifications();

  // Default to the number they signed in with, without locking them to it:
  // only seed it while the field is still untouched.
  useEffect(() => {
    setPhone((current) => (current ? current : account.phone));
  }, [account.phone]);

  // Which network the number itself belongs to, once enough digits are in.
  const detected = detectNetwork(phone);
  const complete = isCompletePhone(phone);
  const mismatch = payment === "momo" && detected !== null && detected !== network;

  const handlePlaceOrder = () => {
    if (!complete) {
      Alert.alert(
        "Check your phone number",
        "Enter the full 10 digit number the rider should call.",
      );
      return;
    }

    if (mismatch && detected) {
      Alert.alert(
        "Wrong network selected",
        `That number belongs to ${networkLabel(detected)}, but you picked ${networkLabel(network)}. Switch provider, or enter a number on ${networkLabel(network)}.`,
        [
          { text: "Change number", style: "cancel" },
          {
            text: `Use ${networkLabel(detected)}`,
            onPress: () => setNetwork(detected),
          },
        ],
      );
      return;
    }

    if (payment === "card" && !card) {
      Alert.alert("No card saved", "Add your card details before ordering.", [
        { text: "Not now", style: "cancel" },
        {
          text: "Add card",
          onPress: () => router.push("/card-details"),
        },
      ]);
      return;
    }

    const summary = lines
      .map((l) => (l.quantity > 1 ? `${l.quantity}x ${l.name}` : l.name))
      .join(", ");

    setPlacing(true);
    setTimeout(() => {
      setPlacing(false);
      notify(
        "Your order is being prepared",
        `${summary || "Your order"}. Estimated 20 min.`,
      );
      clear();
      router.push("/order-placed");
    }, 1800);
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
            📍 Landmark: near Ayeduase gate
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
    backgroundColor: "#D62828",
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
  changeText: { fontSize: 13, fontWeight: "bold", color: "#D62828" },
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
  orderBtn: {
    backgroundColor: "#D62828",
    borderRadius: 24,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  orderBtnText: { color: "#FFF", fontSize: 15, fontWeight: "bold" },
});
