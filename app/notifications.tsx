import { useRouter } from "expo-router";
import React from "react";
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function NotificationsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
        </View>
        <TouchableOpacity>
          <Text style={styles.markRead}>Mark all read</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        <Text style={styles.sectionHeader}>TODAY</Text>

        <View style={styles.notifCard}>
          <View style={styles.iconBox}>
            <Text>🍔</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.notifTitle}>Your order is being prepared</Text>
            <Text style={styles.notifSub}>
              Order #1042 - Single Cheese Burger (+Bacon), Chicken Burger.
              Estimated 20 min.
            </Text>
            <Text style={styles.time}>12:11 PM</Text>
          </View>
          <View style={styles.redDot} />
        </View>

        <View style={styles.notifCard}>
          <View style={styles.iconBox}>
            <Text>🛵</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.notifTitle}>Rider is on the way!</Text>
            <Text style={styles.notifSub}>
              Order #1040 - Chicken Burger x Fries. Arriving in ~8 min. Show
              OTP: 4729
            </Text>
            <Text style={styles.time}>11:52 AM</Text>
          </View>
          <View style={styles.redDot} />
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
    padding: 20,
  },
  backText: { fontSize: 22, fontWeight: "bold" },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#111" },
  markRead: { fontSize: 13, fontWeight: "bold", color: "#DA291C" },
  list: { padding: 20 },
  sectionHeader: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#888",
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  notifCard: {
    backgroundColor: "#FFF",
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 10,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  notifTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#111",
    marginBottom: 2,
  },
  notifSub: { fontSize: 12, color: "#555", lineHeight: 16, marginBottom: 6 },
  time: { fontSize: 10, color: "#999" },
  redDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#DA291C",
    marginLeft: 8,
    marginTop: 4,
  },
});
