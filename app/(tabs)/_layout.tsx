import { Tabs } from "expo-router";
import React from "react";
import { ColorValue, StyleSheet, Text } from "react-native";

/**
 * Without a tabBarIcon, react-navigation falls back to a placeholder glyph, so
 * each tab supplies its own. The rest of the app already labels actions with
 * emoji (the header bell and cart), so these stay in the same idiom.
 */
function tabIcon(glyph: string) {
  return function TabIcon({ color }: { color: ColorValue }) {
    return <Text style={[styles.icon, { color }]}>{glyph}</Text>;
  };
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: "#E5E7EB",
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: "#D62828",
        tabBarInactiveTintColor: "#888888",
      }}
    >
      <Tabs.Screen
        name="home"
        options={{ title: "Home", tabBarIcon: tabIcon("🍽️") }}
      />
      <Tabs.Screen
        name="menu"
        options={{ title: "Menu", tabBarIcon: tabIcon("🍔") }}
      />
      <Tabs.Screen
        name="cart"
        options={{ title: "Cart", tabBarIcon: tabIcon("🛒") }}
      />
      <Tabs.Screen
        name="you"
        options={{ title: "You", tabBarIcon: tabIcon("👤") }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  icon: { fontSize: 18, lineHeight: 22 },
});
