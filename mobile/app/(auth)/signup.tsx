import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SignUpScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const handleSendCode = () => {
    if (!fullName.trim() || !phoneNumber.trim()) {
      Alert.alert(
        "Missing Details",
        "Please enter both your full name and phone number.",
      );
      return;
    }

    // Simulate sending verification code SMS to the phone number
    Alert.alert(
      "Verification Code Sent",
      `A 4-digit code has been sent via SMS to ${phoneNumber}`,
      [
        {
          text: "Continue",
          onPress: () => router.push("/(auth)/otp"),
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Account</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.titleBox}>
          <Text style={styles.title}>Join The Burger Yard 🍔</Text>
          <Text style={styles.subtitle}>
            Enter your details to get started with fast gourmet deliveries.
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Kofi Mensah"
              placeholderTextColor="#999"
              value={fullName}
              onChangeText={setFullName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.phoneRow}>
              <View style={styles.countryCode}>
                <Text style={styles.countryCodeText}>🇬🇭 +233</Text>
              </View>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="54 392 7440"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
              />
            </View>
          </View>

          <TouchableOpacity style={styles.primaryBtn} onPress={handleSendCode}>
            <Text style={styles.primaryBtnText}>Send verification code</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push("/(auth)/signin")}>
            <Text style={styles.linkText}>Sign in</Text>
          </TouchableOpacity>
        </View>
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
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  backBtn: { width: 24, justifyContent: "center" },
  backText: { fontSize: 22, fontWeight: "bold", color: "#111" },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#111" },
  content: { flex: 1, padding: 24, justifyContent: "space-between" },
  titleBox: { marginTop: 20 },
  title: { fontSize: 22, fontWeight: "bold", color: "#111", marginBottom: 6 },
  subtitle: { fontSize: 13, color: "#666", lineHeight: 18 },
  form: { gap: 16, marginVertical: 20 },
  inputGroup: { gap: 6 },
  label: { fontSize: 12, fontWeight: "bold", color: "#444" },
  input: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    fontSize: 14,
    color: "#111",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  phoneRow: { flexDirection: "row", gap: 8 },
  countryCode: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  countryCodeText: { fontSize: 13, fontWeight: "bold", color: "#111" },
  primaryBtn: {
    backgroundColor: "#DA291C",
    borderRadius: 24,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  primaryBtnText: { color: "#FFF", fontSize: 15, fontWeight: "bold" },
  footer: { flexDirection: "row", justifyContent: "center", marginBottom: 20 },
  footerText: { fontSize: 13, color: "#666" },
  linkText: { fontSize: 13, fontWeight: "bold", color: "#DA291C" },
});
