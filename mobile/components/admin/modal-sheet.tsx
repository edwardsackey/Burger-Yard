import { Admin } from "@/constants/admin-theme";
import { useResponsive } from "@/hooks/use-responsive";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Icon } from "./ui";

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
 * The dialog behind every admin edit flow. It rises from the bottom on a phone
 * and scales in from the centre on a wider screen, so the same component suits
 * both layouts.
 */
export function ModalSheet({
  visible,
  title,
  subtitle,
  onClose,
  children,
  footer,
}: Props) {
  const { isPhone, height } = useResponsive();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: visible ? 1 : 0,
      duration: visible ? 260 : 180,
      easing: visible ? Easing.out(Easing.cubic) : Easing.in(Easing.quad),
      useNativeDriver: NATIVE,
    }).start();
  }, [visible, anim]);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [isPhone ? height * 0.35 : 24, 0],
  });
  const scale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [isPhone ? 1 : 0.96, 1],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.backdrop, { opacity: anim }]}>
        {/* tapping the dim area closes, the panel itself swallows the tap */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <Animated.View
          style={[
            styles.panel,
            isPhone ? styles.panelPhone : styles.panelWide,
            { transform: [{ translateY }, { scale }] },
          ]}
        >
          <View style={styles.head}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{title}</Text>
              {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
            </View>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close"
              style={styles.close}
            >
              <Icon name="x" size={18} color={Admin.textMuted} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.body}
            contentContainerStyle={{ paddingBottom: 4 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>

          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(17,24,39,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  panel: {
    backgroundColor: Admin.surface,
    borderWidth: 1,
    borderColor: Admin.border,
    maxHeight: "88%",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  panelWide: { width: "100%", maxWidth: 520, borderRadius: 16 },
  panelPhone: {
    width: "100%",
    borderRadius: 18,
    marginTop: "auto",
    marginBottom: 0,
  },
  head: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 20,
    paddingBottom: 14,
  },
  title: { fontSize: 16, fontWeight: "700", color: Admin.text },
  sub: { fontSize: 12, color: Admin.textMuted, marginTop: 3 },
  close: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Admin.divider,
  },
  body: { paddingHorizontal: 20 },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    padding: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Admin.divider,
  },
});

/** Labelled text field used inside the sheets. */
export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={fieldStyles.label}>{label}</Text>
      {children}
    </View>
  );
}

export const fieldStyles = StyleSheet.create({
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: Admin.text,
    marginBottom: 7,
  },
  input: {
    borderWidth: 1,
    borderColor: Admin.border,
    backgroundColor: "#FBFCFD",
    borderRadius: 10,
    paddingHorizontal: 13,
    height: 44,
    fontSize: 14,
    color: Admin.text,
  },
  row: { flexDirection: "row", gap: 12 },
});

export default ModalSheet;
