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
 * Leaflet against public OpenStreetMap tiles, free and keyless. Both leaflet
 * itself and its CSS are imported dynamically inside useEffect rather than
 * at module scope: leaflet touches `window` the instant it's imported, and
 * Expo Router's static web build pre-renders every route in Node (no
 * `window`) before the browser ever sees it — a top-level import crashes
 * that pass immediately. useEffect never runs during that server pass, so
 * the dynamic import inside it only ever executes in an actual browser.
 */
export function LocationMap({ initialRegion, onRegionChangeComplete }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  // Avoids re-subscribing the Leaflet event on every parent re-render —
  // the map itself is only ever created once (see the empty dep array below).
  const onChangeRef = useRef(onRegionChangeComplete);
  onChangeRef.current = onRegionChangeComplete;

  useEffect(() => {
    let cancelled = false;

    (async () => {
      await import("leaflet/dist/leaflet.css");
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current || mapRef.current) return;

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
      setTimeout(() => map.invalidateSize(), 150);
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
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
