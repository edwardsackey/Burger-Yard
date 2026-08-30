import { Admin } from "@/constants/admin-theme";
import { useNewOrders } from "@/context/NewOrdersContext";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { startAlertSound, stopAlertSound } from "./alert-sound";
import { Icon } from "./ui";

/** Sits at the top of every admin screen (mounted once in the admin layout)
 * and keeps ringing until a new order is acknowledged — easy to miss a
 * quiet toast when heads-down in the kitchen, harder to miss a sound that
 * doesn't stop on its own. */
export function NewOrderAlert() {
  const { incoming, dismissAll } = useNewOrders();
  const router = useRouter();

  useEffect(() => {
    if (incoming.length > 0) {
      startAlertSound();
    } else {
      stopAlertSound();
    }
    return () => stopAlertSound();
  }, [incoming.length]);

  if (incoming.length === 0) return null;

  const latest = incoming[incoming.length - 1];

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <View style={styles.banner}>
        <View style={styles.iconCircle}>
          <Icon name="bell" size={18} color="#FFFFFF" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>
            {incoming.length === 1
              ? `New order from ${latest.customer}`
              : `${incoming.length} new orders`}
          </Text>
          <Text style={styles.sub} numberOfLines={1}>
            {incoming.length === 1
              ? `#${latest.id} · GHS ${latest.total}`
              : incoming.map((o) => `#${o.id}`).join(", ")}
          </Text>
        </View>
        <Pressable
          style={styles.viewBtn}
          onPress={() => {
            router.push({
              pathname: "/(admin)/orders",
              params: { orderId: String(latest.id) },
            });
            dismissAll();
          }}
        >
          <Text style={styles.viewBtnText}>View</Text>
        </Pressable>
        <Pressable
          style={styles.dismissBtn}
          onPress={dismissAll}
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
        >
          <Icon name="x" size={16} color="#B8B8B8" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    top: 14,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 999,
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#111111",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    maxWidth: 440,
    width: "92%",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 10,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Admin.red,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { color: "#FFFFFF", fontSize: 13.5, fontWeight: "700" },
  sub: { color: "#B8B8B8", fontSize: 11.5, marginTop: 2 },
  viewBtn: {
    backgroundColor: Admin.red,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  viewBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 12 },
  dismissBtn: { padding: 4 },
});
