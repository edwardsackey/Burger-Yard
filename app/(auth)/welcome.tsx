import { Brand, FillParent } from "@/constants/brand";
import { BRAND_IMAGES } from "@/constants/catalog";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

/**
 * Frame 5 (node 12:37) - the screen where you choose to sign up or sign in.
 *
 * The dim is opacity on the image itself over an ink background, not a scrim
 * on top, which is what the design note meant by reducing the opacity of the
 * frame fill without touching anything else in the frame. Solving
 * `rendered = 0.4 * source + 0.6 * background` across the render puts the
 * backdrop at #121212.
 */
export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <Image
        source={BRAND_IMAGES.hero}
        style={styles.fill}
        resizeMode="cover"
      />

      {/* Sits above the copy block, bottom edge LOGO_GAP clear of the midpoint */}
      <View style={styles.logoWrap}>
        <Image
          source={BRAND_IMAGES.logo}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {/* Anchored to the vertical midpoint, matching top=422 on the 844 frame */}
      <View style={styles.copy}>
        <Text style={styles.tagline}>DON&apos;T BE SHY, TAKE A BITE</Text>
        <Text style={styles.description}>
          Order your favourite burgers pay with MoMo, and track your delivery in
          real time.
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

        <View style={styles.terms}>
          <Text style={styles.termsText}>
            By continuing you agree to our Terms &amp; Privacy Policy
          </Text>
        </View>
      </View>
    </View>
  );
}

const MUTED = "rgba(255,255,255,0.5)";

/**
 * The badge is not in the Figma frame, so these two are our own call: the logo
 * hangs above the midpoint the copy is anchored to, leaving LOGO_GAP between
 * its bottom edge and the tagline.
 */
const LOGO_SIZE = 120;
const LOGO_GAP = 36;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Brand.ink },
  fill: { ...FillParent, opacity: 0.4 },
  logoWrap: {
    position: "absolute",
    top: "50%",
    left: 0,
    right: 0,
    marginTop: -(LOGO_SIZE + LOGO_GAP),
    alignItems: "center",
  },
  logo: { width: LOGO_SIZE, height: LOGO_SIZE, borderRadius: LOGO_SIZE / 2 },
  copy: {
    position: "absolute",
    top: "50%",
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: 24,
  },
  tagline: {
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.48,
    color: MUTED,
    textAlign: "center",
  },
  description: {
    marginTop: 6,
    width: 279,
    fontSize: 15,
    lineHeight: 23,
    color: MUTED,
    textAlign: "center",
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 14,
    paddingBottom: 40,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: Brand.red,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: Brand.white,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "600",
  },
  secondaryButton: {
    borderWidth: 1.5,
    borderColor: "#E2E2E2",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: Brand.white,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "600",
  },
  terms: { paddingTop: 8, alignItems: "center" },
  termsText: {
    color: "#9A9A9A",
    fontSize: 11,
    lineHeight: 15,
    textAlign: "center",
  },
});
