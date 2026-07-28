import { useRouter } from "expo-router";
import React from "react";
import {
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo / Brand Icon */}
        <View style={styles.logoContainer}>
          <Text style={styles.logoEmoji}>🍔</Text>
        </View>

        <Text style={styles.brandTitle}>THE BURGER YARD</Text>
        <Text style={styles.tagline}>DON'T BE SHY, TAKE A BITE</Text>

        <Text style={styles.description}>
          Order your favourite burgers, pay with MoMo, and track your delivery
          in real time.
        </Text>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push("/(auth)/signup")}
        >
          <Text style={styles.primaryButtonText}>Create account</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push("/(auth)/signin")}
        >
          <Text style={styles.secondaryButtonText}>Sign in</Text>
        </TouchableOpacity>

        <Text style={styles.termsText}>
          By continuing you agree to our Terms & Privacy Policy
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    justifyContent: "space-between",
    padding: 24,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 10,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#DA291C",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  logoEmoji: { fontSize: 36 },
  brandTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#111",
    letterSpacing: 1,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 11,
    fontWeight: "600",
    color: "#666",
    letterSpacing: 0.5,
    marginBottom: 20,
  },
  description: {
    textAlign: "center",
    color: "#777",
    fontSize: 13,
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  footer: { width: "100%", paddingBottom: 20 },
  primaryButton: {
    backgroundColor: "#DA291C",
    borderRadius: 24,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  primaryButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "bold" },
  secondaryButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 24,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  secondaryButtonText: { color: "#111", fontSize: 15, fontWeight: "bold" },
  termsText: { textAlign: "center", fontSize: 10, color: "#999" },
});
