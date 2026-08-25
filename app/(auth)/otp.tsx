import { DismissKeyboard } from "@/components/dismiss-keyboard";
import { LoadingOverlay } from "@/components/loading-screen";
import { Brand } from "@/constants/brand";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Keyboard,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  TextInput,
  TextInputKeyPressEventData,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/** Two minutes to key the code in before a resend is offered. */
const RESEND_SECONDS = 120;

/** SCR/OTP Verify (node 2:1459). */
export default function OtpScreen() {
  const router = useRouter();
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [verifying, setVerifying] = useState(false);
  const inputs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [secondsLeft]);

  const handleChange = (index: number, text: string) => {
    const digit = text.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);

    if (digit && index < 3) {
      inputs.current[index + 1]?.focus();
    } else if (digit && next.every((d) => d)) {
      // The code is complete, so drop the number pad rather than leave it
      // sitting over the Verify button. Blur the field as well as calling
      // Keyboard.dismiss: on web the latter goes through TextInputState,
      // which only tracks fields it focused itself.
      inputs.current[index]?.blur();
      Keyboard.dismiss();
    }
  };

  const handleKeyPress = (
    index: number,
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
  ) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = () => {
    if (otp.some((d) => !d)) {
      Alert.alert("Incomplete code", "Enter all 4 digits to continue.");
      return;
    }

    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
      router.replace("/(tabs)/home");
    }, 1600);
  };

  const handleResend = () => {
    setSecondsLeft(RESEND_SECONDS);
    setOtp(["", "", "", ""]);
    inputs.current[0]?.focus();
  };

  const timer = `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, "0")}`;

  if (verifying) return <LoadingOverlay label="Verifying your number" />;

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <StatusBar style="dark" />
      <DismissKeyboard>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Verification</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.lockCircle}>
            <Text style={styles.lockGlyph}>🔒</Text>
          </View>

          <Text style={styles.title}>Enter OTP</Text>
          <Text style={styles.subtitle}>
            We sent a 4-digit code to{"\n"}+233 54 392 7440
          </Text>

          <View style={styles.otpRow}>
            {[0, 1, 2, 3].map((index) => (
              <TextInput
                key={index}
                ref={(el) => {
                  inputs.current[index] = el;
                }}
                style={[
                  styles.otpInput,
                  otp[index] ? styles.otpInputFilled : null,
                ]}
                keyboardType="number-pad"
                maxLength={1}
                value={otp[index]}
                onChangeText={(text) => handleChange(index, text)}
                onKeyPress={(e) => handleKeyPress(index, e)}
              />
            ))}
          </View>

          <Text style={styles.resendLine}>
            Resend code in <Text style={styles.timer}>{timer}</Text>
          </Text>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.primaryBtn}
            activeOpacity={0.85}
            onPress={handleVerify}
          >
            <Text style={styles.primaryBtnText}>Verify</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleResend}
            disabled={secondsLeft > 0}
            style={styles.resendBtn}
          >
            <Text
              style={[
                styles.resendText,
                secondsLeft === 0 && styles.resendTextActive,
              ]}
            >
              Didn&apos;t get it? Resend SMS
            </Text>
          </TouchableOpacity>
        </View>
      </DismissKeyboard>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.white },
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
  content: { flex: 1, alignItems: "center", paddingHorizontal: 22 },
  lockCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#FDECEC",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 30,
    marginBottom: 22,
    overflow: "hidden",
  },
  lockGlyph: { fontSize: 28 },
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
    textAlign: "center",
    marginBottom: 26,
  },
  otpRow: { flexDirection: "row", gap: 16, marginBottom: 20 },
  otpInput: {
    width: 66,
    height: 66,
    borderRadius: 14,
    backgroundColor: Brand.field,
    borderWidth: 1,
    borderColor: "transparent",
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    color: Brand.ink,
  },
  otpInputFilled: { backgroundColor: "#FDECEC", borderColor: Brand.red },
  resendLine: { fontSize: 13, color: Brand.grey },
  timer: { color: Brand.red, fontWeight: "700" },
  footer: { paddingHorizontal: 22, paddingBottom: 12 },
  primaryBtn: {
    backgroundColor: Brand.red,
    borderRadius: 14,
    height: 54,
    justifyContent: "center",
    alignItems: "center",
  },
  primaryBtnText: { color: Brand.white, fontSize: 16, fontWeight: "700" },
  resendBtn: { marginTop: 18, alignItems: "center" },
  resendText: { fontSize: 13, color: "#9CA3AF" },
  resendTextActive: { color: Brand.red, fontWeight: "700" },
});
