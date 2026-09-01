import "leaflet/dist/leaflet.css";
import L from "leaflet";
import React, { useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";

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
 * react-native-maps has no web renderer, so web gets its own real map here —
 * Leaflet against public OpenStreetMap tiles, free and keyless. Reports the
 * same Region shape the native MapView does, so the screens that use this
 * don't need to know which platform they're on.
 */
export function LocationMap({ initialRegion, onRegionChangeComplete }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  // Avoids re-subscribing the Leaflet event on every parent re-render —
  // the map itself is only ever created once (see the empty dep array below).
  const onChangeRef = useRef(onRegionChangeComplete);
  onChangeRef.current = onRegionChangeComplete;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [initialRegion.latitude, initialRegion.longitude],
      zoom: 16,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);

    const emitRegion = () => {
      const center = map.getCenter();
      const bounds = map.getBounds();
      onChangeRef.current({
        latitude: center.lat,
        longitude: center.lng,
        latitudeDelta: bounds.getNorth() - bounds.getSouth(),
        longitudeDelta: bounds.getEast() - bounds.getWest(),
      });
    };

    map.on("moveend", emitRegion);
    mapRef.current = map;

    // The container can be zero-sized on the first paint (layout not
    // settled yet) — Leaflet then renders the tiles at the wrong size.
    const resizeTimer = setTimeout(() => map.invalidateSize(), 150);

    return () => {
      clearTimeout(resizeTimer);
      map.remove();
      mapRef.current = null;
    };
    // Deliberately empty — the map is created once; panning to a new
    // initialRegion after mount isn't a supported case here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <View ref={containerRef as never} style={styles.container} />;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
