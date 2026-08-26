import { apiFetch, saveToken } from "@/api";
import { DismissKeyboard } from "@/components/dismiss-keyboard";
import { LoadingOverlay } from "@/components/loading-screen";
import { Brand } from "@/constants/brand";
import { useAccount } from "@/store/app-store";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import {
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
  const [resending, setResending] = useState(false);
  // Shown inline rather than via Alert.alert, which is unreliable on
  // react-native-web — some versions no-op instead of showing a dialog.
  const [error, setError] = useState<string | null>(null);
  const inputs = useRef<(TextInput | null)[]>([]);
  const { account, setAccount } = useAccount();

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [secondsLeft]);

  const handleChange = (index: number, text: string) => {
    const digits = text.replace(/\D/g, "");

    // iOS/Android SMS autofill delivers the whole code at once to whichever
    // box happens to be focused, not one digit per box — spread it across
    // all four rather than keeping only a single character of it. Threshold
    // is 3+ rather than 2+ so retyping over an already-filled box (which can
    // briefly report two characters) still behaves like normal single-key
    // entry instead of being mistaken for a paste.
    if (digits.length >= 3) {
      const filled = digits.slice(0, 4).split("");
      const next = ["", "", "", ""];
      filled.forEach((d, i) => {
        next[i] = d;
      });
      setOtp(next);
      if (filled.length === 4) {
        inputs.current[3]?.blur();
        Keyboard.dismiss();
      } else {
        inputs.current[filled.length]?.focus();
      }
      return;
    }

    const digit = digits.slice(-1);
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

  const handleVerify = async () => {
    setError(null);
    if (otp.some((d) => !d)) {
      setError("Enter all 4 digits to continue.");
      return;
    }

    setVerifying(true);
    try {
      const data = await apiFetch("/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({ phone: account.phone, otp: otp.join("") }),
      });
      await saveToken(data.token);
      setAccount({ name: data.name, phone: data.phone });
      router.replace("/(tabs)/home");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    setResending(true);
    try {
      await apiFetch("/auth/request-otp", {
        method: "POST",
        body: JSON.stringify({ phone: account.phone }),
      });
      setSecondsLeft(RESEND_SECONDS);
      setOtp(["", "", "", ""]);
      inputs.current[0]?.focus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Please try again.");
    } finally {
      setResending(false);
    }
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
            We sent a 4-digit code to{"\n"}{account.phone || "your phone"}
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
                textContentType="oneTimeCode"
                autoComplete="sms-otp"
                value={otp[index]}
                onChangeText={(text) => handleChange(index, text)}
                onKeyPress={(e) => handleKeyPress(index, e)}
              />
            ))}
          </View>

          <Text style={styles.resendLine}>
            Resend code in <Text style={styles.timer}>{timer}</Text>
          </Text>
          {error && <Text style={styles.errorText}>{error}</Text>}
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
            disabled={secondsLeft > 0 || resending}
            style={styles.resendBtn}
          >
            <Text
              style={[
                styles.resendText,
                secondsLeft === 0 && styles.resendTextActive,
              ]}
            >
              {resending ? "Resending…" : "Didn't get it? Resend SMS"}
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
  errorText: {
    fontSize: 12.5,
    color: Brand.red,
    marginTop: 14,
    fontWeight: "600",
    textAlign: "center",
  },
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
