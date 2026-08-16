import { LoadingOverlay } from "@/components/loading-screen";
import { Brand } from "@/constants/brand";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/** SCR/Sign In (node 2:1494). */
export default function SignInScreen() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [sending, setSending] = useState(false);

  const handleSendOtp = () => {
    if (!phoneNumber.trim()) {
      Alert.alert("Missing number", "Please enter your phone number.");
      return;
    }

    setSending(true);
    setTimeout(() => {
      setSending(false);
      router.push("/(auth)/otp");
    }, 1400);
  };

  if (sending) return <LoadingOverlay label="Sending your code" />;

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sign in</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>
            Sign in with your phone number. We&apos;ll send a one-time code.
          </Text>

          <Text style={styles.label}>Phone number</Text>
          <View style={styles.phoneField}>
            <Text style={styles.prefix}>+233</Text>
            <View style={styles.prefixDivider} />
            <TextInput
              style={styles.phoneInput}
              placeholder="54 392 7440"
              placeholderTextColor="#9CA3AF"
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
            />
          </View>
          <Text style={styles.hint}>A 4-digit OTP will be sent via SMS</Text>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.primaryBtn}
            activeOpacity={0.85}
            onPress={handleSendOtp}
          >
            <Text style={styles.primaryBtnText}>Send OTP</Text>
          </TouchableOpacity>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Don&apos;t have an account? </Text>
            <TouchableOpacity onPress={() => router.push("/(auth)/signup")}>
              <Text style={styles.linkText}>Create one</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.white },
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 18,
  },
  backBtn: { width: 32, height: 32, justifyContent: "center" },
  backText: { fontSize: 24, color: Brand.ink },
  headerTitle: { fontSize: 17, fontWeight: "700", color: Brand.ink },
  content: { flex: 1, paddingHorizontal: 22 },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: Brand.ink,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: Brand.grey,
    lineHeight: 21,
    marginBottom: 26,
  },
  label: { fontSize: 13, fontWeight: "700", color: Brand.ink, marginBottom: 8 },
  phoneField: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Brand.field,
    borderRadius: 12,
    height: 52,
    paddingHorizontal: 16,
  },
  prefix: { fontSize: 15, fontWeight: "700", color: Brand.ink },
  prefixDivider: {
    width: 1,
    height: 22,
    backgroundColor: "#D9D9D9",
    marginHorizontal: 14,
  },
  phoneInput: { flex: 1, fontSize: 15, color: Brand.ink, height: "100%" },
  hint: { fontSize: 12, color: "#9CA3AF", marginTop: 12 },
  footer: { paddingHorizontal: 22, paddingBottom: 12 },
  primaryBtn: {
    backgroundColor: Brand.red,
    borderRadius: 14,
    height: 54,
    justifyContent: "center",
    alignItems: "center",
  },
  primaryBtnText: { color: Brand.white, fontSize: 16, fontWeight: "700" },
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 18,
  },
  footerText: { fontSize: 13, color: Brand.grey },
  linkText: { fontSize: 13, fontWeight: "700", color: Brand.red },
});
