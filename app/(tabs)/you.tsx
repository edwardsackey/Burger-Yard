import { ORDERS } from "@/constants/orders";
import { useNotifications } from "@/store/app-store";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const router = useRouter();
  // Counts, not unread flags, so the totals are still there after a visit.
  const { items: notifications } = useNotifications();

  // Profile editable state
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("Ama Mensah");
  const [phone, setPhone] = useState("+233 54 392 7440");

  const handleSave = () => {
    setIsEditing(false);
    // You can add logic here to sync with a backend or local storage if needed
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Account</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card Section */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .substring(0, 2)
                .toUpperCase()}
            </Text>
          </View>

          <View style={styles.profileInfo}>
            {isEditing ? (
              <View style={styles.editInputsContainer}>
                <TextInput
                  style={styles.inputField}
                  value={name}
                  onChangeText={setName}
                  placeholder="Full name"
                  placeholderTextColor="#999"
                />
                <TextInput
                  style={styles.inputField}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="Phone number"
                  placeholderTextColor="#999"
                  keyboardType="phone-pad"
                />
              </View>
            ) : (
              <>
                <Text style={styles.profileName}>{name}</Text>
                <Text style={styles.profilePhone}>{phone}</Text>
              </>
            )}

            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedDot}>●</Text>
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.editBtn, isEditing && styles.saveBtnActive]}
            onPress={() => (isEditing ? handleSave() : setIsEditing(true))}
          >
            <Text
              style={[
                styles.editBtnText,
                isEditing && styles.saveBtnTextActive,
              ]}
            >
              {isEditing ? "Save" : "Edit"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Menu Options List */}
        <View style={styles.menuList}>
          {[
            {
              title: "Order History",
              subtitle: "View past orders",
              badge: ORDERS.length ? String(ORDERS.length) : null,
              route: "/order-history",
              icon: "📋",
            },
            {
              title: "Saved Addresses",
              subtitle: "Ayeduase New Site + 1 more",
              badge: null,
              route: "/saved-addresses",
              icon: "📍",
            },
            {
              title: "Payment Methods",
              subtitle: "MoMo • MTN ending 440",
              badge: null,
              route: "/payment-methods",
              icon: "💳",
            },
            {
              title: "Notifications",
              subtitle: "Order updates & promos",
              badge: notifications.length
                ? String(notifications.length)
                : null,
              route: "/notifications",
              icon: "🔔",
            },
            {
              title: "Help & Support",
              subtitle: "FAQs, contact us",
              badge: null,
              route: "/help-support",
              icon: "❓",
            },
            {
              title: "About The Burger Yard",
              subtitle: "v1.0 • Ayeduase & Osu",
              badge: null,
              route: "/about-burger-yard",
              icon: "ℹ️",
            },
          ].map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={() => item.route && router.push(item.route as any)}
            >
              <View style={styles.menuIconBox}>
                <Text>{item.icon}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.menuItemTitle}>{item.title}</Text>
                <Text style={styles.menuItemSub}>{item.subtitle}</Text>
              </View>
              {item.badge && (
                <View style={styles.badgeContainer}>
                  <Text style={styles.badgeText}>{item.badge}</Text>
                </View>
              )}
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          style={styles.signOutBtn}
          onPress={() => router.replace("/(auth)/welcome")}
        >
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#111" },
  scrollContent: { padding: 20, paddingBottom: 40 },
  profileCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#D62828",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { color: "#FFF", fontSize: 18, fontWeight: "bold" },
  profileInfo: { flex: 1, marginLeft: 12 },
  profileName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111",
    marginBottom: 2,
  },
  profilePhone: { fontSize: 12, color: "#666", marginBottom: 6 },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DEF7EC",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  verifiedDot: { color: "#03543F", fontSize: 8, marginRight: 4 },
  verifiedText: { color: "#03543F", fontSize: 10, fontWeight: "bold" },
  editInputsContainer: { gap: 6, marginBottom: 4 },
  inputField: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 13,
    color: "#111",
    backgroundColor: "#FAFAFA",
  },
  editBtn: {
    borderWidth: 1.5,
    borderColor: "#D62828",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  saveBtnActive: { backgroundColor: "#D62828" },
  editBtnText: { color: "#D62828", fontSize: 12, fontWeight: "bold" },
  saveBtnTextActive: { color: "#FFF" },
  menuList: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F9FAFB",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  menuItemTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#111",
    marginBottom: 2,
  },
  menuItemSub: { fontSize: 11, color: "#666" },
  badgeContainer: {
    backgroundColor: "#D62828",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  badgeText: { color: "#FFF", fontSize: 10, fontWeight: "bold" },
  chevron: { fontSize: 20, color: "#9CA3AF", fontWeight: "bold" },
  signOutBtn: {
    borderWidth: 1.5,
    borderColor: "#D62828",
    borderRadius: 24,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF",
  },
  signOutText: { color: "#D62828", fontSize: 15, fontWeight: "bold" },
});
