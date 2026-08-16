import { Brand, SplashGeometry, SplashTiming } from "@/constants/brand";
import { BRAND_IMAGES } from "@/constants/catalog";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, Image, StyleSheet, View } from "react-native";

const { dot, logo, blackOffset, redOffset } = SplashGeometry;

/**
 * Animated brand intro, matching Frames 1-4 of "03 - Customer Screens" in Figma.
 *
 *   1. White screen, a black and a red circle sit apart and collide horizontally.
 *   2. On impact the screen wipes to deep maroon and the pair merges into one
 *      small gold circle.
 *   3. The gold circle grows from 50px to 150px.
 *   4. The gold circle turns into the white Burger Yard logo badge.
 *
 * Every transition runs in 1s or less, then the welcome screen takes over.
 */
export default function SplashScreen() {
  const router = useRouter();
  const [done, setDone] = useState(false);

  // One driver per visual element. All JS-driven: colour and layout props
  // (backgroundColor, width, height) cannot run on the native driver, and
  // mixing drivers across a single node is not allowed.
  const dotsTravel = useRef(new Animated.Value(1)).current; // 1 = apart, 0 = merged
  const dotsOpacity = useRef(new Animated.Value(1)).current;
  const backdrop = useRef(new Animated.Value(0)).current; // 0 = white, 1 = maroon
  const goldOpacity = useRef(new Animated.Value(0)).current;
  const goldSize = useRef(new Animated.Value(dot)).current;
  const impact = useRef(new Animated.Value(1)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.72)).current;

  useEffect(() => {
    const sequence = Animated.sequence([
      // 1 -> the two circles accelerate into each other.
      Animated.timing(dotsTravel, {
        toValue: 0,
        duration: SplashTiming.collide,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: false,
      }),

      // 2 -> impact: colour wipe to maroon while the pair becomes one gold circle.
      Animated.parallel([
        Animated.timing(backdrop, {
          toValue: 1,
          duration: SplashTiming.merge,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.timing(dotsOpacity, {
          toValue: 0,
          duration: SplashTiming.merge * 0.45,
          easing: Easing.linear,
          useNativeDriver: false,
        }),
        Animated.timing(goldOpacity, {
          toValue: 1,
          duration: SplashTiming.merge * 0.45,
          easing: Easing.linear,
          useNativeDriver: false,
        }),
        // squash-and-settle so the collision reads as a hit
        Animated.sequence([
          Animated.timing(impact, {
            toValue: 1.35,
            duration: SplashTiming.merge * 0.4,
            easing: Easing.out(Easing.quad),
            useNativeDriver: false,
          }),
          Animated.timing(impact, {
            toValue: 1,
            duration: SplashTiming.merge * 0.6,
            easing: Easing.out(Easing.back(2)),
            useNativeDriver: false,
          }),
        ]),
      ]),

      // 3 -> the small gold circle grows to the 150px badge size.
      Animated.timing(goldSize, {
        toValue: logo,
        duration: SplashTiming.grow,
        easing: Easing.out(Easing.back(1.4)),
        useNativeDriver: false,
      }),

      // 4 -> the gold badge becomes the Burger Yard logo.
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: SplashTiming.reveal,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(logoScale, {
          toValue: 1,
          duration: SplashTiming.reveal,
          easing: Easing.out(Easing.back(1.6)),
          useNativeDriver: false,
        }),
        Animated.timing(goldOpacity, {
          toValue: 0,
          duration: SplashTiming.reveal,
          easing: Easing.in(Easing.quad),
          useNativeDriver: false,
        }),
      ]),

      Animated.delay(SplashTiming.hold),
    ]);

    sequence.start(({ finished }) => {
      if (finished) setDone(true);
    });

    return () => sequence.stop();
  }, [
    backdrop,
    dotsOpacity,
    dotsTravel,
    goldOpacity,
    goldSize,
    impact,
    logoOpacity,
    logoScale,
  ]);

  // Navigating from the animation callback would run during an Animated
  // commit; flip a flag instead and route from an effect.
  useEffect(() => {
    if (done) router.replace("/(auth)/welcome");
  }, [done, router]);

  const blackX = dotsTravel.interpolate({
    inputRange: [0, 1],
    outputRange: [0, blackOffset],
  });
  const redX = dotsTravel.interpolate({
    inputRange: [0, 1],
    outputRange: [0, redOffset],
  });
  const goldRadius = Animated.divide(goldSize, 2);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Frame 2-4 backdrop, wiped in on impact */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: Brand.maroon, opacity: backdrop },
        ]}
      />

      <View style={styles.stage}>
        {/* Frame 1: the two colliding circles */}
        <Animated.View
          style={[
            styles.dot,
            {
              backgroundColor: Brand.ink,
              opacity: dotsOpacity,
              transform: [{ translateX: blackX }],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.dot,
            {
              backgroundColor: Brand.red,
              opacity: dotsOpacity,
              transform: [{ translateX: redX }],
            },
          ]}
        />

        {/* Frames 2-3: the merged gold circle */}
        <Animated.View
          style={[
            styles.centred,
            {
              width: goldSize,
              height: goldSize,
              borderRadius: goldRadius,
              backgroundColor: Brand.gold,
              opacity: goldOpacity,
              transform: [{ scale: impact }],
            },
          ]}
        />

        {/* Frame 4: the logo badge */}
        <Animated.View
          style={[
            styles.centred,
            styles.badge,
            { opacity: logoOpacity, transform: [{ scale: logoScale }] },
          ]}
        >
          <Image
            source={BRAND_IMAGES.logo}
            style={styles.badgeImage}
            resizeMode="contain"
          />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.white },
  stage: { flex: 1, alignItems: "center", justifyContent: "center" },
  dot: {
    position: "absolute",
    width: dot,
    height: dot,
    borderRadius: dot / 2,
  },
  centred: { position: "absolute", alignItems: "center", justifyContent: "center" },
  badge: {
    width: logo,
    height: logo,
    borderRadius: logo / 2,
    backgroundColor: Brand.white,
    overflow: "hidden",
  },
  badgeImage: { width: logo, height: logo },
});
