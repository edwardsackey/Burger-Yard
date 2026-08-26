import { Brand } from "@/constants/brand";
import * as WebBrowser from "expo-web-browser";
import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

// Must run as soon as this module loads (not inside an effect) — on web this
// is what actually signals the opener window to close the popup and resolve
// openAuthSessionAsync. Paystack redirects here once checkout is done.
WebBrowser.maybeCompleteAuthSession();

export default function PaymentCallbackScreen() {
  return (
    <View style={styles.container}>
      <ActivityIndicator color={Brand.red} />
      <Text style={styles.text}>Completing your payment…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Brand.white,
    gap: 12,
  },
  text: { fontSize: 13, color: Brand.grey },
});
