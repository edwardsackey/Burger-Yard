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
  useWindowDimensions,
  type ImageSourcePropType,
} from "react-native";

const USE_NATIVE_DRIVER = Platform.OS !== "web";
const SLIDES: ImageSourcePropType[] = [PROMO_IMAGES.hunger, PROMO_IMAGES.bite];
const HOLD_MS = 4000;
const FADE_MS = 450;

/**
 * Both flyers are 713x768. The card takes that same ratio so the artwork
 * fills it exactly - anything else either crops the headline off or leaves
 * bars down the sides.
 */
const SLIDE_ASPECT = 713 / 768;

type Props = {
  onPress?: () => void;
  /** Horizontal padding of the surrounding scroll content, per side. */
  horizontalInset?: number;
};

/**
 * One full-width promo card that cross-fades between the flyers, rather than a
 * side-by-side rail. Each flyer gets the whole card so its own artwork and
 * headline read at full size.
 */
export function PromoSlider({ onPress, horizontalInset = 20 }: Props) {
  const [index, setIndex] = useState(0);
  const fade = useRef(new Animated.Value(1)).current;

  // Derived from the window rather than measured. An explicit height is the
  // only thing that beats the intrinsic height react-native-web writes inline
  // from the asset, and it has to be right on the very first render.
  const { width: windowWidth } = useWindowDimensions();
  const cardWidth = windowWidth - horizontalInset * 2;
  const cardHeight = cardWidth / SLIDE_ASPECT;

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
            style={[styles.image, { width: cardWidth, height: cardHeight }]}
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
  image: { borderRadius: 16, backgroundColor: "#FFFFFF" },
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
