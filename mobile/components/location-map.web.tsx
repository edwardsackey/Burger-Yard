import React from "react";
import { StyleSheet, Text, View } from "react-native";

export type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

type Props = {
  initialRegion: Region;
  onRegionChangeComplete: (region: Region) => void;
};

/**
 * react-native-maps has no web renderer, so the web preview shows a
 * placeholder and confirms with the default region instead of a live pin.
 */
export function LocationMap({ initialRegion }: Props) {
  return (
    <View style={[StyleSheet.absoluteFillObject, styles.placeholder]}>
      <Text style={styles.emoji}>🗺️</Text>
      <Text style={styles.title}>Map preview isn't available on web</Text>
      <Text style={styles.subtitle}>
        Open this screen on a phone with Expo Go to drag the map and pin an
        exact spot. Confirming here will use the default location.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
    padding: 24,
  },
  emoji: { fontSize: 40, marginBottom: 12 },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111",
    marginBottom: 6,
    textAlign: "center",
  },
  subtitle: { fontSize: 12.5, color: "#666", textAlign: "center", lineHeight: 18 },
});
