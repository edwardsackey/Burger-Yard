import { Brand, FillParent } from "@/constants/brand";
import { BRAND_IMAGES } from "@/constants/catalog";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Image,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";

// react-native-web has no native animated module; asking for it only logs a warning.
const USE_NATIVE_DRIVER = Platform.OS !== "web";

const SIZE = 150;

type Props = {
  /** Optional caption under the badge. Omit for the bare Figma layout. */
  label?: string;
};

/**
 * The system loading state, matching the "loading" frame in Figma:
 * a 150px circular burger centred on white. The gentle breathe-and-turn
 * keeps it alive without adding anything the design does not have.
 */
export function LoadingScreen({ label }: Props) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const scale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.94, 1.04],
  });
  const rotate = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: ["-6deg", "6deg"],
  });

  return (
    <View style={styles.container}>
      <Animated.View style={{ transform: [{ scale }, { rotate }] }}>
        <Image
          source={BRAND_IMAGES.loadingBurger}
          style={styles.burger}
          resizeMode="cover"
        />
      </Animated.View>
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </View>
  );
}

/** Same visual, laid over whatever screen is already mounted. */
export function LoadingOverlay({ label }: Props) {
  return (
    <View style={styles.overlay}>
      <LoadingScreen label={label} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Brand.white,
    alignItems: "center",
    justifyContent: "center",
  },
  overlay: { ...FillParent, zIndex: 10 },
  burger: { width: SIZE, height: SIZE, borderRadius: SIZE / 2 },
  label: {
    marginTop: 28,
    fontSize: 13,
    fontWeight: "600",
    color: Brand.grey,
    letterSpacing: 0.3,
  },
});

export default LoadingScreen;
