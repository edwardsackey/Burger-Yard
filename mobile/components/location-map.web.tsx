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

let cssInjected = false;

/** Metro's web CSS support injects a <style> tag as a side effect of
 * requiring a .css file — calling this lazily, instead of a static
 * top-level `import "leaflet/dist/leaflet.css"`, defers that injection
 * until a real browser actually mounts this component. */
function injectLeafletCss() {
  if (cssInjected) return;
  cssInjected = true;
  require("leaflet/dist/leaflet.css");
}

/**
 * react-native-maps has no web renderer, so web gets its own real map here —
 * Leaflet against public OpenStreetMap tiles, free and keyless.
 *
 * `leaflet` is `require()`'d lazily inside useEffect rather than statically
 * imported at module scope, for two reasons:
 *  1. leaflet touches `window` the instant it's evaluated, but Expo Router's
 *     static web build pre-renders every route in Node first (no `window`)
 *     — a top-level import crashes that pass immediately.
 *  2. A dynamic `import()` here (the more usual fix for #1) hit a Metro
 *     "Requiring unknown module" error in this project's web setup — Metro's
 *     async-chunk machinery, not a stale cache. A synchronous `require()`
 *     stays in the main bundle (no async chunk at all) while still only
 *     *executing* when useEffect calls it — after mount, browser-only,
 *     never during the Node prerender.
 */
export function LocationMap({ initialRegion, onRegionChangeComplete }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  // Avoids re-subscribing the Leaflet event on every parent re-render —
  // the map itself is only ever created once (see the empty dep array below).
  const onChangeRef = useRef(onRegionChangeComplete);
  onChangeRef.current = onRegionChangeComplete;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    injectLeafletCss();
    const L = require("leaflet") as typeof import("leaflet");

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
    // Clicking a point directly, rather than dragging the map under the
    // fixed center pin the screen renders — panTo keeps the current zoom
    // and fires "moveend" itself once it settles, so emitRegion still runs.
    map.on("click", (e: import("leaflet").LeafletMouseEvent) => {
      map.panTo(e.latlng);
    });
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
