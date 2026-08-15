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

export default function OtpScreen() {
  const router = useRouter();
  const [otp, setOtp] = useState(["", "", "", ""]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verify Phone</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.titleBox}>
          <Text style={styles.title}>Enter verification code</Text>
          <Text style={styles.subtitle}>
            We've sent a 4-digit code to your phone number.
          </Text>
        </View>

        <View style={styles.otpRow}>
          {[0, 1, 2, 3].map((index) => (
            <TextInput
              key={index}
              style={styles.otpInput}
              keyboardType="number-pad"
              maxLength={1}
              value={otp[index]}
              onChangeText={(text) => {
                const newOtp = [...otp];
                newOtp[index] = text;
                setOtp(newOtp);
              }}
            />
          ))}
        </View>

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => {
            Alert.alert("Success", "Phone number verified!", [
              {
                text: "Continue",
                onPress: () => router.replace("/(tabs)/home"),
              },
            ]);
          }}
        >
          <Text style={styles.primaryBtnText}>Verify</Text>
        </TouchableOpacity>
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
  content: { flex: 1, padding: 24 },
  titleBox: { marginTop: 20, marginBottom: 30 },
  title: { fontSize: 22, fontWeight: "bold", color: "#111", marginBottom: 6 },
  subtitle: { fontSize: 13, color: "#666" },
  otpRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  otpInput: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    color: "#111",
  },
  primaryBtn: {
    backgroundColor: "#DA291C",
    borderRadius: 24,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  primaryBtnText: { color: "#FFF", fontSize: 15, fontWeight: "bold" },
});
