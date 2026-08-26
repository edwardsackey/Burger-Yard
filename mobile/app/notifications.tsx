import { BRAND_IMAGES } from "@/constants/catalog";
import { useNotifications } from "@/store/app-store";
import { useRouter } from "expo-router";
import React from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NotificationsScreen() {
  const router = useRouter();
  const { items, unreadCount, markAllRead } = useNotifications();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllRead}>
            <Text style={styles.markRead}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Image
            source={BRAND_IMAGES.logo}
            style={styles.emptyLogo}
            resizeMode="contain"
          />
          <Text style={styles.emptyTitle}>No notifications yet</Text>
          <Text style={styles.emptySub}>
            Order updates will show up here once you place your first order.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          <Text style={styles.sectionHeader}>TODAY</Text>

          {items.map((item) => (
            <View key={item.id} style={styles.notifCard}>
              <View style={styles.iconBox}>
                <Image
                  source={BRAND_IMAGES.logo}
                  style={styles.iconImage}
                  resizeMode="contain"
                />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.notifTitle}>{item.title}</Text>
                <Text style={styles.notifSub}>{item.body}</Text>
                <Text style={styles.time}>{item.time}</Text>
              </View>
              {!item.read && <View style={styles.redDot} />}
            </View>
          ))}
        </ScrollView>
      )}
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
  markRead: { fontSize: 13, fontWeight: "bold", color: "#D62828" },
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
    overflow: "hidden",
  },
  iconImage: { width: "100%", height: "100%" },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  emptyLogo: { width: 96, height: 96, borderRadius: 48, marginBottom: 18 },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#111",
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: "#666",
    textAlign: "center",
    lineHeight: 19,
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
    backgroundColor: "#D62828",
    marginLeft: 8,
    marginTop: 4,
  },
});
