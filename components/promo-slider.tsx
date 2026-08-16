import { PROMO_IMAGES } from "@/constants/catalog";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  Platform,
  StyleSheet,
  View,
  useWindowDimensions,
  type ImageSourcePropType,
} from "react-native";

const USE_NATIVE_DRIVER = Platform.OS !== "web";
const SLIDES: ImageSourcePropType[] = [PROMO_IMAGES.hunger, PROMO_IMAGES.bite];

const HOLD_MS = 4000;
const SLIDE_MS = 260;

/** Landscape banner. The flyers are near square, so cover crops them. */
const CARD_HEIGHT = 180;

type Props = {
  /** Horizontal padding of the surrounding scroll content, per side. */
  horizontalInset?: number;
};

/**
 * A non-interactive promo banner that slides between the flyers on its own.
 * Deliberately not pressable - it is artwork, not navigation.
 */
export function PromoSlider({ horizontalInset = 20 }: Props) {
  const [index, setIndex] = useState(0);
  const offset = useRef(new Animated.Value(0)).current;

  const { width: windowWidth } = useWindowDimensions();
  // Sized up front rather than measured: react-native-web writes the asset's
  // intrinsic height inline on an Image, which beats both aspectRatio and a
  // height arriving from a later layout pass.
  const cardWidth = windowWidth - horizontalInset * 2;

  useEffect(() => {
    if (SLIDES.length < 2) return;

    const timer = setInterval(() => {
      // Out to the left, jump to the right edge, then back in.
      Animated.timing(offset, {
        toValue: -cardWidth,
        duration: SLIDE_MS,
        easing: Easing.in(Easing.quad),
        useNativeDriver: USE_NATIVE_DRIVER,
      }).start(({ finished }) => {
        if (!finished) return;
        setIndex((i) => (i + 1) % SLIDES.length);
        offset.setValue(cardWidth);
        Animated.timing(offset, {
          toValue: 0,
          duration: SLIDE_MS,
          easing: Easing.out(Easing.quad),
          useNativeDriver: USE_NATIVE_DRIVER,
        }).start();
      });
    }, HOLD_MS);

    return () => clearInterval(timer);
  }, [offset, cardWidth]);

  return (
    <View style={styles.wrap}>
      <View style={[styles.viewport, { width: cardWidth }]}>
        <Animated.View style={{ transform: [{ translateX: offset }] }}>
          <Image
            source={SLIDES[index]}
            style={{ width: cardWidth, height: CARD_HEIGHT }}
            resizeMode="cover"
          />
        </Animated.View>
      </View>

      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 20 },
  viewport: {
    height: CARD_HEIGHT,
    borderRadius: 16,
    // clips the outgoing slide so it does not bleed past the card
    overflow: "hidden",
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
