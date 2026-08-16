import { Stack } from "expo-router";
import React from "react";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Animated brand intro, the entry point of the app */}
      <Stack.Screen name="index" options={{ animation: "none" }} />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="product-detail" />
      <Stack.Screen name="checkout" />
      <Stack.Screen name="order-placed" />
      <Stack.Screen name="order-tracking" />
      <Stack.Screen name="order-history" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="search-favorites" />
      <Stack.Screen name="help-support" />
      <Stack.Screen name="saved-addresses" />
      <Stack.Screen name="payment-methods" />
      <Stack.Screen name="about-burger-yard" />
    </Stack>
  );
}
