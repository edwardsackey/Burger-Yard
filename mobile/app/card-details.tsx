import { DismissKeyboard } from "@/components/dismiss-keyboard";
import { Brand } from "@/constants/brand";
import { useAccount } from "@/store/app-store";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/** "4242 4242 4242 4242" from a raw digit string. */
function groupCardNumber(digits: string) {
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
}

/** "09/28" from "0928". */
function formatExpiry(digits: string) {
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}`;
}

export default function CardDetailsScreen() {
  const router = useRouter();
  const { card, setCard } = useAccount();

  const [number, setNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [holder, setHolder] = useState("");

  const digits = number.replace(/\D/g, "");
  const expiryDigits = expiry.replace(/\D/g, "");

  const handleSave = () => {
    if (digits.length < 15) {
      Alert.alert("Check the card number", "Enter the full number on the card.");
      return;
    }
    if (expiryDigits.length < 4) {
      Alert.alert("Check the expiry", "Enter the expiry as MM/YY.");
      return;
    }
    const month = Number(expiryDigits.slice(0, 2));
    if (month < 1 || month > 12) {
      Alert.alert("Check the expiry", "The month should be between 01 and 12.");
      return;
    }
    if (cvv.replace(/\D/g, "").length < 3) {
      Alert.alert("Check the CVV", "The CVV is the 3 digits on the back.");
      return;
    }
    if (!holder.trim()) {
      Alert.alert("Missing name", "Enter the name printed on the card.");
      return;
    }

    // Only the last four, the expiry and the name are kept. The full number
    // and the CVV are never stored.
    setCard({
      last4: digits.slice(-4),
      expiry: formatExpiry(expiryDigits),
      holder: holder.trim(),
    });
    router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Card details</Text>
        <View style={{ width: 32 }} />
      </View>

      <DismissKeyboard>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {card && (
            <View style={styles.savedBox}>
              <Text style={styles.savedText}>
                Saved: •••• {card.last4} · {card.expiry}
              </Text>
              <TouchableOpacity onPress={() => setCard(null)}>
                <Text style={styles.removeText}>Remove</Text>
              </TouchableOpacity>
            </View>
          )}

          <Text style={styles.label}>Card number</Text>
          <TextInput
            style={styles.input}
            value={groupCardNumber(digits)}
            onChangeText={(t) => setNumber(t.replace(/\D/g, "").slice(0, 19))}
            keyboardType="number-pad"
            placeholder="Card number"
            placeholderTextColor="#9CA3AF"
          />

          <View style={styles.row}>
            <View style={styles.half}>
              <Text style={styles.label}>Expiry</Text>
              <TextInput
                style={styles.input}
                value={formatExpiry(expiryDigits)}
                onChangeText={(t) => setExpiry(t.replace(/\D/g, "").slice(0, 4))}
                keyboardType="number-pad"
                placeholder="MM/YY"
                placeholderTextColor="#9CA3AF"
              />
            </View>
            <View style={styles.half}>
              <Text style={styles.label}>CVV</Text>
              <TextInput
                style={styles.input}
                value={cvv}
                onChangeText={(t) => setCvv(t.replace(/\D/g, "").slice(0, 4))}
                keyboardType="number-pad"
                placeholder="3 digits"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
              />
            </View>
          </View>

          <Text style={styles.label}>Name on card</Text>
          <TextInput
            style={styles.input}
            value={holder}
            onChangeText={setHolder}
            autoCapitalize="words"
            placeholder="Name as printed"
            placeholderTextColor="#9CA3AF"
          />

          <Text style={styles.note}>
            Only the last four digits and the expiry are kept on this device, so
            you can recognise the card. The full number and CVV are not stored.
          </Text>
        </ScrollView>
      </DismissKeyboard>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.saveBtn}
          activeOpacity={0.85}
          onPress={handleSave}
        >
          <Text style={styles.saveBtnText}>Save card</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.white },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  backBtn: { width: 32, height: 32, justifyContent: "center" },
  backText: { fontSize: 24, color: Brand.ink },
  headerTitle: { fontSize: 17, fontWeight: "700", color: Brand.ink },
  content: { paddingHorizontal: 20, paddingBottom: 30 },
  savedBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFF5F5",
    borderWidth: 1,
    borderColor: "#FEE2E2",
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  savedText: { fontSize: 13, fontWeight: "600", color: Brand.ink },
  removeText: { fontSize: 13, fontWeight: "700", color: Brand.red },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: Brand.ink,
    marginBottom: 8,
    marginTop: 14,
  },
  input: {
    backgroundColor: Brand.field,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    fontSize: 15,
    color: Brand.ink,
  },
  row: { flexDirection: "row", gap: 12 },
  half: { flex: 1 },
  note: {
    fontSize: 11,
    color: "#9CA3AF",
    lineHeight: 16,
    marginTop: 20,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Brand.border,
  },
  saveBtn: {
    backgroundColor: Brand.red,
    borderRadius: 14,
    height: 54,
    justifyContent: "center",
    alignItems: "center",
  },
  saveBtnText: { color: Brand.white, fontSize: 16, fontWeight: "700" },
});
