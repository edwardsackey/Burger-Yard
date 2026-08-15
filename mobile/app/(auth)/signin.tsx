import { useRouter } from "expo-router";
import React from "react";
import {
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function SignInScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push("/(auth)/signup")}>
          <Text style={styles.topRightLink}>Sign up</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>
          Sign in with your phone number. We'll send a one-time code.
        </Text>

        <Text style={styles.label}>Phone number</Text>
        <View style={styles.phoneInputContainer}>
          <View style={styles.prefixBox}>
            <Text style={styles.prefixText}>+233</Text>
          </View>
          <TextInput
            style={styles.phoneInput}
            placeholder="54 392 7440"
            placeholderTextColor="#999"
            keyboardType="phone-pad"
          />
        </View>
        <Text style={styles.hintText}>A 4-digit OTP will be sent via SMS</Text>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push("/(auth)/otp")}
        >
          <Text style={styles.buttonText}>Send OTP</Text>
        </TouchableOpacity>
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push("/(auth)/signup")}>
            <Text style={styles.linkText}>Create one</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 24,
    justifyContent: "space-between",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backButton: { width: 36, height: 36, justifyContent: "center" },
  backButtonText: { fontSize: 24, color: "#111" },
  topRightLink: { fontSize: 14, fontWeight: "bold", color: "#DA291C" },
  formContainer: { marginTop: 20 },
  title: { fontSize: 22, fontWeight: "bold", color: "#111", marginBottom: 8 },
  subtitle: { fontSize: 13, color: "#666", lineHeight: 18, marginBottom: 24 },
  label: { fontSize: 12, fontWeight: "600", color: "#444", marginBottom: 6 },
  phoneInputContainer: { flexDirection: "row", marginBottom: 6 },
  prefixBox: {
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    paddingHorizontal: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  prefixText: { fontSize: 14, fontWeight: "600", color: "#333" },
  phoneInput: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
  },
  hintText: { fontSize: 11, color: "#888", marginBottom: 20 },
  footer: { paddingBottom: 20 },
  button: {
    backgroundColor: "#DA291C",
    borderRadius: 24,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  buttonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "bold" },
  footerRow: { flexDirection: "row", justifyContent: "center" },
  footerText: { fontSize: 13, color: "#666" },
  linkText: { fontSize: 13, fontWeight: "bold", color: "#DA291C" },
});
