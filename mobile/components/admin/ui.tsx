import { Admin, StatusTone } from "@/constants/admin-theme";
import Feather from "@expo/vector-icons/Feather";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

// react-native-web has no native animated module; asking for it only warns.
const NATIVE = Platform.OS !== "web";

export type IconName = React.ComponentProps<typeof Feather>["name"];

/** Line icons throughout, in place of the emoji the console used to draw. */
export function Icon({
  name,
  size = 18,
  color = Admin.textMuted,
}: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  return <Feather name={name} size={size} color={color} />;
}

/* ------------------------------------------------------------------ card */

export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionTitle({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <View style={styles.sectionHead}>
      <View style={{ flex: 1 }}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle ? <Text style={styles.sectionSub}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

/* ---------------------------------------------------------------- button */

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  icon?: IconName;
  /** Overrides `icon` — for a brand mark (e.g. WhatsApp) outside the Feather set. */
  iconElement?: React.ReactNode;
  size?: "sm" | "md";
  disabled?: boolean;
  style?: ViewStyle;
};

/** Presses scale the button slightly, so every tap gives feedback. */
export function Button({
  label,
  onPress,
  variant = "primary",
  icon,
  iconElement,
  size = "md",
  disabled,
  style,
}: ButtonProps) {
  const press = useRef(new Animated.Value(0)).current;

  const animate = (to: number) =>
    Animated.timing(press, {
      toValue: to,
      duration: 110,
      easing: Easing.out(Easing.quad),
      useNativeDriver: NATIVE,
    }).start();

  const scale = press.interpolate({ inputRange: [0, 1], outputRange: [1, 0.96] });

  const tone = {
    primary: { bg: Admin.red, fg: "#FFFFFF", border: Admin.red },
    danger: { bg: Admin.redSoft, fg: Admin.red, border: "#F7C9C9" },
    secondary: { bg: Admin.surface, fg: Admin.text, border: Admin.border },
    ghost: { bg: "transparent", fg: Admin.textMuted, border: "transparent" },
  }[variant];

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        onPressIn={() => animate(1)}
        onPressOut={() => animate(0)}
        onPress={onPress}
        style={[
          styles.btn,
          size === "sm" && styles.btnSm,
          {
            backgroundColor: tone.bg,
            borderColor: tone.border,
            opacity: disabled ? 0.45 : 1,
          },
        ]}
      >
        {iconElement ?? (icon ? <Icon name={icon} size={size === "sm" ? 13 : 15} color={tone.fg} /> : null)}
        <Text
          style={[
            styles.btnText,
            size === "sm" && styles.btnTextSm,
            { color: tone.fg },
          ]}
        >
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

/** A square icon-only button, for row actions like edit and delete. */
export function IconButton({
  name,
  onPress,
  tone = "neutral",
  label,
}: {
  name: IconName;
  onPress: () => void;
  tone?: "neutral" | "danger";
  label: string;
}) {
  const press = useRef(new Animated.Value(0)).current;
  const scale = press.interpolate({ inputRange: [0, 1], outputRange: [1, 0.88] });
  const animate = (to: number) =>
    Animated.timing(press, {
      toValue: to,
      duration: 110,
      easing: Easing.out(Easing.quad),
      useNativeDriver: NATIVE,
    }).start();

  const fg = tone === "danger" ? Admin.red : Admin.textMuted;

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPressIn={() => animate(1)}
        onPressOut={() => animate(0)}
        onPress={onPress}
        style={[
          styles.iconBtn,
          tone === "danger" && { backgroundColor: Admin.redSoft, borderColor: "#F7C9C9" },
        ]}
      >
        <Icon name={name} size={15} color={fg} />
      </Pressable>
    </Animated.View>
  );
}

/* ---------------------------------------------------------------- toggle */

/**
 * Availability switch. The knob slides and the track cross-fades, which is the
 * bit the plain two-state version was missing.
 */
export function Toggle({
  value,
  onChange,
  label,
}: {
  value: boolean;
  onChange: (next: boolean) => void;
  label?: string;
}) {
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: value ? 1 : 0,
      duration: 220,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      // colour cannot run on the native driver, and the knob has to stay in
      // step with the track, so both are JS driven.
      useNativeDriver: false,
    }).start();
  }, [value, anim]);

  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [2, 20] });
  const backgroundColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ["#D6D9DF", Admin.green],
  });

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={label}
      onPress={() => onChange(!value)}
      style={styles.toggleHit}
    >
      <Animated.View style={[styles.track, { backgroundColor }]}>
        <Animated.View style={[styles.knob, { transform: [{ translateX }] }]} />
      </Animated.View>
    </Pressable>
  );
}

/* ------------------------------------------------------------------ pill */

export function StatusPill({ status }: { status: string }) {
  const tone = StatusTone[status] ?? { fg: Admin.textMuted, bg: "#F3F4F6" };
  return (
    <View style={[styles.pill, { backgroundColor: tone.bg }]}>
      <View style={[styles.pillDot, { backgroundColor: tone.fg }]} />
      <Text style={[styles.pillText, { color: tone.fg }]}>{status}</Text>
    </View>
  );
}

/* ----------------------------------------------------------------- chart */

export type Bar = { label: string; value: number; caption?: string };

/**
 * Each bar has its own driver, started on a stagger, so they rise one after
 * another rather than as a block. The caption above a bar counts up on that
 * same driver, so the number climbs with its own bar instead of every figure
 * landing at once.
 */
function ChartColumn({
  bar,
  index,
  max,
  height,
  isMax,
  formatCaption,
}: {
  bar: Bar;
  index: number;
  max: number;
  height: number;
  isMax: boolean;
  formatCaption?: (v: number) => string;
}) {
  const grow = useRef(new Animated.Value(0)).current;
  const [shown, setShown] = useState(0);

  useEffect(() => {
    grow.setValue(0);
    setShown(0);

    // The listener turns the same 0..1 progress into the counting figure, so
    // the number cannot drift out of step with the bar it sits above.
    const id = grow.addListener(({ value }) => {
      setShown(Math.round(value * bar.value));
    });

    const duration = 620;
    const delay = index * 110;

    const animation = Animated.timing(grow, {
      toValue: 1,
      duration,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    animation.start();

    // A throttled tab starves requestAnimationFrame, which would leave the
    // caption reading 0 - a wrong number, not just an unanimated one. Settle
    // on the true figure once the run should have finished either way.
    const settle = setTimeout(() => setShown(bar.value), delay + duration + 120);

    return () => {
      animation.stop();
      grow.removeListener(id);
      clearTimeout(settle);
    };
  }, [grow, bar.value, index]);

  const full = Math.max((bar.value / max) * (height - 46), 4);

  return (
    <View style={styles.chartCol}>
      <Text style={styles.chartCaption} numberOfLines={1}>
        {formatCaption ? formatCaption(shown) : shown}
      </Text>
      <Animated.View
        style={[
          styles.bar,
          {
            height: grow.interpolate({ inputRange: [0, 1], outputRange: [0, full] }),
            backgroundColor: isMax ? Admin.red : "#F6B9B9",
          },
        ]}
      />
      <Text style={styles.chartLabel}>{bar.label}</Text>
    </View>
  );
}

export function BarChart({
  data,
  height = 200,
  highlightMax = true,
  formatCaption,
}: {
  data: Bar[];
  height?: number;
  highlightMax?: boolean;
  formatCaption?: (v: number) => string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  // Re-keying on the data replays the whole sequence when the period changes,
  // rather than sliding the old bars to new heights.
  const runKey = data.map((d) => `${d.label}:${d.value}`).join("|");

  return (
    <View style={[styles.chart, { height }]}>
      {data.map((d, i) => (
        <ChartColumn
          key={`${runKey}-${d.label}`}
          bar={d}
          index={i}
          max={max}
          height={height}
          isMax={highlightMax && d.value === max}
          formatCaption={formatCaption}
        />
      ))}
    </View>
  );
}

/** Horizontal progress track, used by the best sellers list. */
export function ProgressBar({ pct }: { pct: number }) {
  const grow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(grow, {
      toValue: pct,
      duration: 650,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [pct, grow]);

  const width = grow.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
    extrapolate: "clamp",
  });

  return (
    <View style={styles.progressTrack}>
      <Animated.View style={[styles.progressFill, { width }]} />
    </View>
  );
}

/** Fades and lifts its children in once, to soften screen changes. */
export function FadeIn({
  children,
  delay = 0,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 320,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: NATIVE,
    }).start();
  }, [anim, delay]);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] });

  return (
    <Animated.View style={[{ opacity: anim, transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  );
}

export const styles = StyleSheet.create({
  card: {
    backgroundColor: Admin.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Admin.border,
    padding: 18,
  },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: Admin.text },
  sectionSub: { fontSize: 12, color: Admin.textMuted, marginTop: 2 },

  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
  },
  btnSm: { height: 32, paddingHorizontal: 12, borderRadius: 8, gap: 6 },
  btnText: { fontSize: 13, fontWeight: "700" },
  btnTextSm: { fontSize: 12 },

  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Admin.border,
    backgroundColor: Admin.surface,
    alignItems: "center",
    justifyContent: "center",
  },

  toggleHit: { padding: 4 },
  track: { width: 42, height: 24, borderRadius: 12, justifyContent: "center" },
  knob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },

  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  pillDot: { width: 6, height: 6, borderRadius: 3 },
  pillText: { fontSize: 11, fontWeight: "700" },

  chart: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  chartCol: { flex: 1, alignItems: "center", justifyContent: "flex-end" },
  chartCaption: { fontSize: 10, color: Admin.textFaint, marginBottom: 6 },
  bar: { width: "58%", borderRadius: 6, minHeight: 4 },
  chartLabel: { fontSize: 11, color: Admin.textMuted, marginTop: 10 },

  progressTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: Admin.divider,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 3, backgroundColor: Admin.red },
});
