import { Button, FadeIn, Icon } from "@/components/admin/ui";
import { Admin } from "@/constants/admin-theme";
import { BRAND } from "@/constants/menu-catalog";
import {
  HOME_FOR,
  useAdminSession,
  type ActiveStaffOption,
} from "@/context/AdminSession";
import { useResponsive } from "@/hooks/use-responsive";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Mode = "choose" | "manager" | "staff";

export default function AdminAuthScreen() {
  const router = useRouter();
  const { isDesktop, isPhone } = useResponsive();
  const { activeStaff, signInOwner, signInStaff } = useAdminSession();

  const [mode, setMode] = useState<Mode>("choose");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selected, setSelected] = useState<ActiveStaffOption | null>(null);
  const [digits, setDigits] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const codeInputs = useRef<(TextInput | null)[]>([]);

  const reset = () => {
    setError("");
    setEmail("");
    setPassword("");
    setSelected(null);
    setDigits(["", "", "", ""]);
  };

  const handleManager = async () => {
    const result = await signInOwner(email, password);
    if (!result.ok) {
      setError(result.error ?? "Sign in failed.");
      return;
    }
    router.replace(HOME_FOR.owner as never);
  };

  const submitCode = async (member: ActiveStaffOption, code: string) => {
    const result = await signInStaff(member.id, code);
    if (!result.ok) {
      setError(result.error ?? "Sign in failed.");
      setDigits(["", "", "", ""]);
      codeInputs.current[0]?.focus();
      return;
    }
    router.replace(HOME_FOR.staff as never);
  };

  const onDigit = (index: number, text: string) => {
    const typed = text.replace(/\D/g, "");
    if (!typed) {
      const cleared = [...digits];
      cleared[index] = "";
      setDigits(cleared);
      return;
    }

    const next = [...digits];
    // A paste of the whole code fills the row from here; a single keystroke
    // fills one box. Either way we only keep digits.
    if (typed.length > 1) {
      typed.split("").forEach((d, offset) => {
        if (index + offset < 4) next[index + offset] = d;
      });
    } else {
      next[index] = typed;
    }
    setDigits(next);
    setError("");

    const landed = typed.length > 1 ? Math.min(index + typed.length, 4) - 1 : index;
    if (landed < 3) {
      codeInputs.current[landed + 1]?.focus();
    }
    if (next.every(Boolean) && selected) {
      // Complete code, so check it straight away rather than making them
      // reach for a button.
      submitCode(selected, next.join(""));
    }
  };

  const onDigitKey = (index: number, key: string) => {
    if (key === "Backspace" && !digits[index] && index > 0) {
      codeInputs.current[index - 1]?.focus();
    }
  };

  const brandPane = (
    <View style={styles.leftPane}>
      <View style={styles.logoRow}>
        <Image source={BRAND.logo} style={styles.logoImage} resizeMode="contain" />
        <View>
          <Text style={styles.brandTitle}>The Burger Yard</Text>
          <Text style={styles.brandSub}>Admin Console</Text>
        </View>
      </View>

      <View style={styles.heroContent}>
        <Text style={styles.heroHeading}>Manage your burger empire.</Text>
        <Text style={styles.heroText}>
          Orders, menu, payments and analytics, all in one place. Built for how
          Ghana does food.
        </Text>

      </View>

      <View />
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={[styles.row, !isDesktop && styles.rowStacked]}>
        {isDesktop && brandPane}

        <ScrollView
          contentContainerStyle={[styles.rightPane, isPhone && styles.rightPanePhone]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {!isDesktop && (
            <View style={styles.mobileBrand}>
              <Image source={BRAND.logo} style={styles.logoImageSm} resizeMode="contain" />
              <Text style={styles.mobileBrandText}>The Burger Yard</Text>
            </View>
          )}

          {mode === "choose" && (
            <FadeIn style={styles.formContainer}>
              <Text style={styles.formTitle}>Who is signing in?</Text>
              <Text style={styles.formSub}>
                Managers use their email. Staff pick their name and enter the
                4-digit code from their invite.
              </Text>

              <Pressable
                style={styles.choiceCard}
                onPress={() => {
                  reset();
                  setMode("manager");
                }}
              >
                <View style={styles.choiceIcon}>
                  <Icon name="shield" size={18} color={Admin.red} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.choiceTitle}>Log in as Manager</Text>
                  <Text style={styles.choiceSub}>
                    Full console, including sales and reports
                  </Text>
                </View>
                <Icon name="chevron-right" size={18} color={Admin.textFaint} />
              </Pressable>

              <Pressable
                style={styles.choiceCard}
                onPress={() => {
                  reset();
                  setMode("staff");
                }}
              >
                <View style={styles.choiceIcon}>
                  <Icon name="users" size={18} color={Admin.red} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.choiceTitle}>Log in as Staff</Text>
                  <Text style={styles.choiceSub}>Orders, menu and customers</Text>
                </View>
                <Icon name="chevron-right" size={18} color={Admin.textFaint} />
              </Pressable>
            </FadeIn>
          )}

          {mode === "manager" && (
            <FadeIn style={styles.formContainer}>
              <Pressable
                onPress={() => {
                  reset();
                  setMode("choose");
                }}
                style={styles.backLink}
              >
                <Icon name="arrow-left" size={14} color={Admin.red} />
                <Text style={styles.backLinkText}>Back</Text>
              </Pressable>

              <Text style={styles.formTitle}>Manager sign in</Text>
              <Text style={styles.formSub}>
                Use your everyday address or the standby one.
              </Text>

              <Text style={styles.label}>Email address</Text>
              <TextInput
                style={styles.input}
                placeholder="owner@yourbusiness.com"
                placeholderTextColor={Admin.textFaint}
                value={email}
                onChangeText={(v) => {
                  setEmail(v);
                  setError("");
                }}
                autoCapitalize="none"
                keyboardType="email-address"
              />

              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={Admin.textFaint}
                secureTextEntry
                value={password}
                onChangeText={(v) => {
                  setPassword(v);
                  setError("");
                }}
              />

              {error ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <Button
                label="Sign in to console"
                onPress={handleManager}
                style={{ marginTop: 6 }}
              />
            </FadeIn>
          )}

          {mode === "staff" && !selected && (
            <FadeIn style={styles.formContainer}>
              <Pressable
                onPress={() => {
                  reset();
                  setMode("choose");
                }}
                style={styles.backLink}
              >
                <Icon name="arrow-left" size={14} color={Admin.red} />
                <Text style={styles.backLinkText}>Back</Text>
              </Pressable>

              <Text style={styles.formTitle}>Who are you?</Text>
              <Text style={styles.formSub}>
                Pick your name, then enter the code from your invite.
              </Text>

              {activeStaff.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Icon name="user-x" size={20} color={Admin.textFaint} />
                  <Text style={styles.emptyText}>
                    Nobody has been onboarded yet. Ask the owner to send you an
                    invite.
                  </Text>
                </View>
              ) : (
                activeStaff.map((member) => (
                  <Pressable
                    key={member.id}
                    style={styles.staffRow}
                    onPress={() => {
                      setSelected(member);
                      setDigits(["", "", "", ""]);
                      setError("");
                    }}
                  >
                    <View style={styles.staffAvatar}>
                      <Text style={styles.staffAvatarText}>
                        {member.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)}
                      </Text>
                    </View>
                    <Text style={styles.staffName}>{member.name}</Text>
                    <Icon name="chevron-right" size={16} color={Admin.textFaint} />
                  </Pressable>
                ))
              )}
            </FadeIn>
          )}

          {mode === "staff" && selected && (
            <FadeIn style={styles.formContainer}>
              <Pressable
                onPress={() => {
                  setSelected(null);
                  setDigits(["", "", "", ""]);
                  setError("");
                }}
                style={styles.backLink}
              >
                <Icon name="arrow-left" size={14} color={Admin.red} />
                <Text style={styles.backLinkText}>Not you?</Text>
              </Pressable>

              <Text style={styles.formTitle}>Hi {selected.name.split(" ")[0]}</Text>
              <Text style={styles.formSub}>
                Enter the 4-digit code from your invite.
              </Text>

              <View style={styles.codeRow}>
                {[0, 1, 2, 3].map((i) => (
                  <TextInput
                    key={i}
                    ref={(el) => {
                      codeInputs.current[i] = el;
                    }}
                    style={[styles.codeBox, digits[i] ? styles.codeBoxFilled : null]}
                    keyboardType="number-pad"
                    // deliberately not maxLength 1: at that limit the browser
                    // drops keystrokes into an already filled box, so a single
                    // mistyped digit could never be corrected
                    maxLength={4}
                    selectTextOnFocus
                    autoComplete="off"
                    value={digits[i]}
                    onChangeText={(t) => onDigit(i, t)}
                    onKeyPress={(e) => onDigitKey(i, e.nativeEvent.key)}
                    onFocus={() => setError("")}
                  />
                ))}
              </View>

              {error ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <Button
                label="Sign in"
                onPress={() => submitCode(selected, digits.join(""))}
                disabled={digits.some((d) => !d)}
              />

              <Text style={styles.helpText}>
                Lost your code? The owner can resend it from Settings.
              </Text>
            </FadeIn>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Admin.surface },
  row: { flex: 1, flexDirection: "row" },
  rowStacked: { flexDirection: "column" },

  leftPane: {
    width: "42%",
    maxWidth: 520,
    backgroundColor: Admin.sidebar,
    padding: 40,
    justifyContent: "space-between",
  },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  logoImage: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#FFFFFF" },
  logoImageSm: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#FFFFFF" },
  brandTitle: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  brandSub: { color: Admin.sidebarMuted, fontSize: 11, marginTop: 2 },

  heroContent: { gap: 16 },
  heroHeading: { color: "#FFFFFF", fontSize: 32, fontWeight: "800", lineHeight: 40 },
  heroText: { color: Admin.sidebarText, fontSize: 14, lineHeight: 22, maxWidth: 380 },
  statsRow: { flexDirection: "row", gap: 32, marginTop: 14, flexWrap: "wrap" },
  statVal: { color: "#FFFFFF", fontSize: 19, fontWeight: "800" },
  statLbl: { color: Admin.sidebarMuted, fontSize: 11, marginTop: 3 },

  rightPane: { flex: 1, padding: 40, justifyContent: "center", alignItems: "center" },
  rightPanePhone: { padding: 20 },
  mobileBrand: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 26 },
  mobileBrandText: { fontSize: 15, fontWeight: "700", color: Admin.text },

  formContainer: { width: "100%", maxWidth: 400 },
  formTitle: { fontSize: 24, fontWeight: "800", color: Admin.text },
  formSub: {
    fontSize: 13,
    color: Admin.textMuted,
    marginTop: 8,
    marginBottom: 24,
    lineHeight: 19,
  },

  backLink: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 18 },
  backLinkText: { color: Admin.red, fontWeight: "700", fontSize: 13 },

  choiceCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Admin.border,
    backgroundColor: "#FBFCFD",
    marginBottom: 12,
  },
  choiceIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Admin.redSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  choiceTitle: { fontSize: 14.5, fontWeight: "700", color: Admin.text },
  choiceSub: { fontSize: 12, color: Admin.textMuted, marginTop: 3 },

  label: {
    fontSize: 12.5,
    fontWeight: "700",
    color: Admin.text,
    marginBottom: 7,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: Admin.border,
    backgroundColor: "#FBFCFD",
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 46,
    fontSize: 14,
    color: Admin.text,
  },

  staffRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Admin.border,
    backgroundColor: "#FBFCFD",
    marginBottom: 10,
  },
  staffAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Admin.redSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  staffAvatarText: { fontSize: 12, fontWeight: "800", color: Admin.red },
  staffName: { flex: 1, fontSize: 14, fontWeight: "600", color: Admin.text },

  codeRow: { flexDirection: "row", gap: 12, marginBottom: 18 },
  codeBox: {
    flex: 1,
    height: 60,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Admin.border,
    backgroundColor: "#FBFCFD",
    textAlign: "center",
    fontSize: 22,
    fontWeight: "800",
    color: Admin.text,
  },
  codeBoxFilled: { borderColor: Admin.red, backgroundColor: Admin.redSoft },

  errorBox: {
    backgroundColor: Admin.redSoft,
    borderWidth: 1,
    borderColor: "#F7C9C9",
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  errorText: { color: Admin.red, fontSize: 12.5, fontWeight: "600" },

  emptyBox: {
    alignItems: "center",
    gap: 10,
    padding: 26,
    borderRadius: 12,
    backgroundColor: "#FBFCFD",
    borderWidth: 1,
    borderColor: Admin.border,
  },
  emptyText: {
    fontSize: 12.5,
    color: Admin.textMuted,
    textAlign: "center",
    lineHeight: 18,
  },

  helpText: {
    fontSize: 11.5,
    color: Admin.textFaint,
    textAlign: "center",
    marginTop: 16,
  },
});
