import React, { useRef } from "react";
import { StyleSheet } from "react-native";
import MapView, { MapPressEvent, Region } from "react-native-maps";

export type { Region };

type Props = {
  initialRegion: Region;
  onRegionChangeComplete: (region: Region) => void;
};

export function LocationMap({ initialRegion, onRegionChangeComplete }: Props) {
  const mapRef = useRef<MapView>(null);
  // Tracks the live zoom level so a tap re-centers without resetting it.
  const currentRegionRef = useRef<Region>(initialRegion);

  const handleRegionChangeComplete = (region: Region) => {
    currentRegionRef.current = region;
    onRegionChangeComplete(region);
  };

  return (
    <MapView
      ref={mapRef}
      style={StyleSheet.absoluteFillObject}
      initialRegion={initialRegion}
      onRegionChangeComplete={handleRegionChangeComplete}
      onPress={(e: MapPressEvent) => {
        // Tapping a point directly, rather than dragging the map under the
        // fixed center pin the screen renders — animate there so the pin
        // ends up over the tapped spot too.
        const { latitude, longitude } = e.nativeEvent.coordinate;
        mapRef.current?.animateToRegion(
          {
            latitude,
            longitude,
            latitudeDelta: currentRegionRef.current.latitudeDelta,
            longitudeDelta: currentRegionRef.current.longitudeDelta,
          },
          400,
        );
      }}
    />
  );
}
