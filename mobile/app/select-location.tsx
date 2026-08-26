import { apiFetch } from "@/api";
import { LocationMap, Region } from "@/components/location-map";
import { Brand } from "@/constants/brand";
import { useDeliveryLocation } from "@/store/app-store";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Roughly central Kumasi — a reasonable default until the map is moved.
const DEFAULT_REGION: Region = {
  latitude: 6.6666,
  longitude: -1.6163,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export default function SelectLocationScreen() {
  const router = useRouter();
  const { setDeliveryLocation } = useDeliveryLocation();
  const [region, setRegion] = useState<Region>(DEFAULT_REGION);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      const { landmark, city } = await apiFetch(
        `/places/nearby-landmark?lat=${region.latitude}&lng=${region.longitude}`,
      );
      setDeliveryLocation({
        label: landmark,
        city,
        landmark,
        latitude: region.latitude,
        longitude: region.longitude,
      });
      router.back();
    } catch (error) {
      // Errors are shown inline rather than blocking with an alert, since
      // the user can just try confirming again once they see the message.
      setConfirming(false);
      setError(
        error instanceof Error ? error.message : "Couldn't look up that location.",
      );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pin delivery location</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.mapWrap}>
        <LocationMap
          initialRegion={DEFAULT_REGION}
          onRegionChangeComplete={(next) => {
            setRegion(next);
            setError(null);
          }}
        />
        {/* Fixed at screen center; the map pans underneath it. */}
        <View pointerEvents="none" style={styles.centerPin}>
          <Text style={styles.pinGlyph}>📍</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.hint}>
          Move the map so the pin sits on your delivery spot.
        </Text>
        {error && <Text style={styles.errorText}>{error}</Text>}
        <TouchableOpacity
          style={styles.confirmBtn}
          onPress={handleConfirm}
          disabled={confirming}
        >
          {confirming ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.confirmText}>Confirm this location</Text>
          )}
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
  headerTitle: { fontSize: 16, fontWeight: "bold", color: "#111" },
  mapWrap: { flex: 1 },
  centerPin: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -16,
    marginTop: -32,
  },
  pinGlyph: { fontSize: 32 },
  footer: {
    padding: 20,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  hint: { fontSize: 12, color: "#666", marginBottom: 10, textAlign: "center" },
  errorText: {
    fontSize: 12,
    color: Brand.red,
    marginBottom: 10,
    textAlign: "center",
  },
  confirmBtn: {
    backgroundColor: Brand.red,
    borderRadius: 24,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  confirmText: { color: "#FFF", fontSize: 15, fontWeight: "bold" },
});
