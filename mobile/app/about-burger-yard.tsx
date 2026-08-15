import { useRouter } from "expo-router";
import React from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AboutScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About The Burger Yard</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.logoBox}>
          <Text style={styles.emoji}>🍔</Text>
          <Text style={styles.appName}>THE BURGER YARD</Text>
          <Text style={styles.version}>Version 1.0.4</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Don't be shy, take a bite</Text>
          <Text style={styles.body}>
            Born in Ayeduase and expanding across Ghana, The Burger Yard serves
            up uncompromisingly juicy gourmet burgers made with fresh local
            ingredients, signature sauces, and stacked with flavor.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Locations</Text>
          <Text style={styles.body}>
            • Kumasi: Ayeduase New Site (Main Kitchen)
          </Text>
          <Text style={styles.body}>• Accra: Osu Branch</Text>
        </View>
      </ScrollView>
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
  scrollContent: { padding: 20, gap: 16 },
  logoBox: { alignItems: "center", paddingVertical: 20 },
  emoji: { fontSize: 56, marginBottom: 10 },
  appName: { fontSize: 18, fontWeight: "900", color: "#111", letterSpacing: 1 },
  version: { fontSize: 12, color: "#888", marginTop: 4 },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  title: { fontSize: 15, fontWeight: "bold", color: "#111", marginBottom: 8 },
  body: { fontSize: 13, color: "#555", lineHeight: 20, marginBottom: 6 },
});
