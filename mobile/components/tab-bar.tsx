import { Brand } from "@/constants/brand";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ICONS: Record<string, string> = {
  home: "🍽️",
  menu: "🍔",
  cart: "🛒",
  you: "👤",
};

/**
 * One tab. Focus animates its flex, so the selected tab widens and physically
 * pushes the others aside rather than the highlight simply appearing. The
 * label rides out from behind the icon on the same driver.
 */
function TabItem({
  label,
  icon,
  focused,
  onPress,
}: {
  label: string;
  icon: string;
  focused: boolean;
  onPress: () => void;
}) {
  const anim = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    const target = focused ? 1 : 0;

    const animation = Animated.timing(anim, {
      toValue: target,
      duration: 280,
      easing: Easing.bezier(0.32, 0.72, 0, 1),
      // flex, colour and width are layout and paint props, so this cannot run
      // on the native driver.
      useNativeDriver: false,
    });
    animation.start();

    // A throttled tab starves requestAnimationFrame, which would leave the
    // highlight sitting on the previous tab: not a missing animation but the
    // wrong tab looking selected. setValue lands without needing a frame.
    const settle = setTimeout(() => anim.setValue(target), 420);

    return () => {
      animation.stop();
      clearTimeout(settle);
    };
  }, [focused, anim]);

  // The selected tab takes roughly twice the room, which is what squeezes the
  // unselected ones inward.
  const flex = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 2] });
  const backgroundColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(214,40,40,0)", "#FDECEC"],
  });
  // Clipped rather than faded, so the text slides out instead of ghosting in.
  const labelWidth = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 58] });
  const labelOpacity = anim.interpolate({
    inputRange: [0, 0.45, 1],
    outputRange: [0, 0, 1],
  });

  return (
    <Animated.View style={{ flex }}>
      <Pressable
        accessibilityRole="tab"
        accessibilityState={{ selected: focused }}
        accessibilityLabel={label}
        onPress={onPress}
        style={styles.pressable}
      >
        <Animated.View style={[styles.pill, { backgroundColor }]}>
          <Text style={styles.icon}>{icon}</Text>
          <Animated.View
            style={[styles.labelClip, { width: labelWidth, opacity: labelOpacity }]}
          >
            <Text numberOfLines={1} style={styles.label}>
              {label}
            </Text>
          </Animated.View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

/**
 * Floating tab bar. It sits clear of the bottom edge rather than flush against
 * it, which is what made it look sunk into the screen.
 */
export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.wrap,
        // Clear the home indicator, but keep a floor so it still floats on
        // devices that report no inset.
        { paddingBottom: Math.max(insets.bottom, 10) },
      ]}
    >
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label =
            typeof options.title === "string" ? options.title : route.name;
          const focused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TabItem
              key={route.key}
              label={label}
              icon={ICONS[route.name] ?? "•"}
              focused={focused}
              onPress={onPress}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: "transparent",
    paddingHorizontal: 14,
    paddingTop: 6,
  },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Brand.border,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  pressable: { alignItems: "center", justifyContent: "center" },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 44,
    borderRadius: 18,
    paddingHorizontal: 8,
    overflow: "hidden",
  },
  icon: { fontSize: 17, lineHeight: 21 },
  labelClip: { overflow: "hidden", justifyContent: "center" },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: Brand.red,
    marginLeft: 7,
  },
});

export default TabBar;
