import { Brand } from "@/constants/brand";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const NATIVE = Platform.OS !== "web";

type Props = {
  visible: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

/**
 * A panel that drops in from the top of the screen.
 *
 * Tapping the dimmed area below it closes the sheet, and tapping anywhere
 * inside puts the keyboard away, so a form does not get stuck behind the
 * number pad with its buttons out of reach.
 */
export function TopSheet({
  visible,
  title,
  subtitle,
  onClose,
  children,
  footer,
}: Props) {
  const insets = useSafeAreaInsets();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const target = visible ? 1 : 0;
    const duration = visible ? 280 : 200;

    const animation = Animated.timing(anim, {
      toValue: target,
      duration,
      easing: visible ? Easing.out(Easing.cubic) : Easing.in(Easing.quad),
      useNativeDriver: NATIVE,
    });
    animation.start();

    // If requestAnimationFrame is starved, the panel would stay parked off
    // the top of the screen while the modal reports itself open, leaving the
    // user looking at a scrim they cannot type into. setValue needs no frame.
    const settle = setTimeout(() => anim.setValue(target), duration + 140);

    return () => {
      animation.stop();
      clearTimeout(settle);
    };
  }, [visible, anim]);

  // Comes down from above the top edge rather than up from the bottom.
  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-340, 0],
  });

  const close = () => {
    Keyboard.dismiss();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={close}
    >
      <View style={styles.root}>
        <Animated.View
          style={[
            styles.panel,
            { paddingTop: insets.top + 14, transform: [{ translateY }] },
          ]}
        >
          {/* Taps inside the panel dismiss the keyboard without closing */}
          <TouchableWithoutFeedback accessible={false} onPress={Keyboard.dismiss}>
            <View>
              <View style={styles.head}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>{title}</Text>
                  {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
                </View>
                <Pressable
                  onPress={close}
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                  style={styles.close}
                >
                  <Text style={styles.closeGlyph}>✕</Text>
                </Pressable>
              </View>

              <ScrollView
                style={styles.body}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {children}
              </ScrollView>

              {footer ? <View style={styles.footer}>{footer}</View> : null}
              <View style={styles.grabber} />
            </View>
          </TouchableWithoutFeedback>
        </Animated.View>

        {/* The dim area under the panel closes it */}
        <Animated.View style={[styles.scrimWrap, { opacity: anim }]}>
          <Pressable style={styles.scrim} onPress={close} />
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  panel: {
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    paddingHorizontal: 20,
    paddingBottom: 10,
    maxHeight: "82%",
    zIndex: 2,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 14,
  },
  head: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 16 },
  title: { fontSize: 17, fontWeight: "800", color: Brand.ink },
  sub: { fontSize: 12.5, color: Brand.grey, marginTop: 4 },
  close: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Brand.divider,
  },
  closeGlyph: { fontSize: 14, fontWeight: "700", color: Brand.grey },
  body: {},
  footer: { flexDirection: "row", gap: 10, marginTop: 16 },
  grabber: {
    alignSelf: "center",
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: Brand.border,
    marginTop: 14,
  },
  scrimWrap: { flex: 1 },
  scrim: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)" },
});

export default TopSheet;
