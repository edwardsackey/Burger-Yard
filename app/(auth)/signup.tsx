import { DismissKeyboard } from "@/components/dismiss-keyboard";
import { LoadingOverlay } from "@/components/loading-screen";
import { Brand } from "@/constants/brand";
import { useAccount } from "@/store/app-store";
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

/** SCR/Sign Up (node 2:1425). */
export default function SignUpScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [sending, setSending] = useState(false);
  const { setAccount } = useAccount();

  const handleSendCode = () => {
    if (!fullName.trim() || !phoneNumber.trim()) {
      Alert.alert(
        "Missing details",
        "Please enter both your full name and phone number.",
      );
      return;
    }

    // Remembered so checkout and the profile default to it.
    setAccount({ name: fullName.trim(), phone: phoneNumber.trim() });

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
        <Text style={styles.headerTitle}>Sign up</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <DismissKeyboard>
          <View style={styles.content}>
            <Text style={styles.title}>Create your account</Text>
            <Text style={styles.subtitle}>
              Enter your phone number and we&apos;ll send you a one-time code to
              verify.
            </Text>

            <Text style={styles.label}>Full name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Ama Mensah"
              placeholderTextColor="#9CA3AF"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
            />

            <Text style={[styles.label, styles.labelSpaced]}>Phone number</Text>
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
            <Text style={styles.hint}>
              We&apos;ll send a verification code via SMS
            </Text>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.primaryBtn}
              activeOpacity={0.85}
              onPress={handleSendCode}
            >
              <Text style={styles.primaryBtnText}>Send verification code</Text>
            </TouchableOpacity>

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push("/(auth)/signin")}>
                <Text style={styles.linkText}>Sign in</Text>
              </TouchableOpacity>
            </View>
          </View>
        </DismissKeyboard>
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
  labelSpaced: { marginTop: 20 },
  input: {
    backgroundColor: Brand.field,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    fontSize: 15,
    color: Brand.ink,
  },
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
