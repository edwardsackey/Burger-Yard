import { PROMO_IMAGES } from "@/constants/catalog";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
  type ImageSourcePropType,
} from "react-native";

const USE_NATIVE_DRIVER = Platform.OS !== "web";
const SLIDES: ImageSourcePropType[] = [PROMO_IMAGES.hunger, PROMO_IMAGES.bite];
const HOLD_MS = 4000;
const FADE_MS = 450;

type Props = {
  onPress?: () => void;
};

/**
 * One full-width promo card that cross-fades between the flyers, rather than a
 * side-by-side rail. Each flyer gets the whole card so its own artwork and
 * headline read at full size.
 */
export function PromoSlider({ onPress }: Props) {
  const [index, setIndex] = useState(0);
  const fade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (SLIDES.length < 2) return;

    const timer = setInterval(() => {
      Animated.timing(fade, {
        toValue: 0,
        duration: FADE_MS,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: USE_NATIVE_DRIVER,
      }).start(({ finished }) => {
        if (!finished) return;
        setIndex((i) => (i + 1) % SLIDES.length);
        Animated.timing(fade, {
          toValue: 1,
          duration: FADE_MS,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: USE_NATIVE_DRIVER,
        }).start();
      });
    }, HOLD_MS);

    return () => clearInterval(timer);
  }, [fade]);

  return (
    <View style={styles.wrap}>
      <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
        <Animated.View style={{ opacity: fade }}>
          <Image
            source={SLIDES[index]}
            style={styles.image}
            resizeMode="cover"
          />
        </Animated.View>
      </TouchableOpacity>

      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === index && styles.dotActive]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 20 },
  image: {
    width: "100%",
    height: 190,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginTop: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#D1D5DB",
  },
  dotActive: { backgroundColor: "#D62828", width: 18 },
});

export default PromoSlider;
