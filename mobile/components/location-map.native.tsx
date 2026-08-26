import React from "react";
import { StyleSheet } from "react-native";
import MapView, { Region } from "react-native-maps";

export type { Region };

type Props = {
  initialRegion: Region;
  onRegionChangeComplete: (region: Region) => void;
};

export function LocationMap({ initialRegion, onRegionChangeComplete }: Props) {
  return (
    <MapView
      style={StyleSheet.absoluteFillObject}
      initialRegion={initialRegion}
      onRegionChangeComplete={onRegionChangeComplete}
    />
  );
}
