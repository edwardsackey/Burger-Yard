import { Brand, FillParent } from "@/constants/brand";
import { BRAND_IMAGES } from "@/constants/catalog";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * Frame 5 of the new auth flow: the hero burger fills the frame, dimmed, with
 * the brand lockup and the two entry actions on top.
 *
 * Per the Figma note, only the frame fill is dimmed - the text and buttons keep
 * full opacity, so the image sits in its own layer with a scrim above it rather
 * than the whole screen carrying an opacity.
 */
export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* Frame fill */}
      <Image
        source={BRAND_IMAGES.hero}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />
      <View style={styles.scrim} />

      {/* Content, at full opacity */}
      <SafeAreaView style={styles.safe}>
        <View style={styles.content}>
          <Text style={styles.brandTitle}>THE BURGER YARD</Text>
          <Text style={styles.tagline}>DON&apos;T BE SHY, TAKE A BITE</Text>
          <Text style={styles.description}>
            Order your favourite burgers,{"\n"}pay with MoMo, and track{"\n"}your
            delivery in real time.
          </Text>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.85}
            onPress={() => router.push("/(auth)/signup")}
          >
            <Text style={styles.primaryButtonText}>Create account</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            activeOpacity={0.85}
            onPress={() => router.push("/(auth)/signin")}
          >
            <Text style={styles.secondaryButtonText}>Sign in</Text>
          </TouchableOpacity>

          <Text style={styles.termsText}>
            By continuing you agree to our Terms &amp; Privacy Policy
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Brand.ink },
  scrim: { ...FillParent, backgroundColor: "rgba(0,0,0,0.45)" },
  safe: { flex: 1, justifyContent: "space-between" },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  brandTitle: {
    fontSize: 30,
    fontWeight: "800",
    color: Brand.white,
    letterSpacing: 0.4,
    textAlign: "center",
    marginBottom: 14,
  },
  tagline: {
    fontSize: 12,
    fontWeight: "700",
    color: Brand.white,
    letterSpacing: 1.1,
    textAlign: "center",
    marginBottom: 22,
  },
  description: {
    textAlign: "center",
    color: "#F1F1F1",
    fontSize: 15,
    lineHeight: 24,
  },
  footer: { paddingHorizontal: 20, paddingBottom: 18 },
  primaryButton: {
    backgroundColor: Brand.red,
    borderRadius: 14,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  primaryButtonText: { color: Brand.white, fontSize: 16, fontWeight: "700" },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.55)",
    borderRadius: 14,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,
  },
  secondaryButtonText: { color: Brand.white, fontSize: 16, fontWeight: "600" },
  termsText: {
    textAlign: "center",
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
  },
});
