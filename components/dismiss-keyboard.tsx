import React from "react";
import {
  Keyboard,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
  type ViewStyle,
} from "react-native";

type Props = {
  children: React.ReactNode;
  style?: ViewStyle;
};

/**
 * Taps anywhere in the wrapped area close the keyboard.
 *
 * Without this the number pad stays up after the last OTP digit and covers the
 * Verify button, leaving no way forward. `accessible={false}` keeps the wrapper
 * out of the screen reader's control tree so it does not swallow the real
 * controls underneath.
 */
export function DismissKeyboard({ children, style }: Props) {
  return (
    <TouchableWithoutFeedback accessible={false} onPress={Keyboard.dismiss}>
      <View style={[styles.fill, style]}>{children}</View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});

export default DismissKeyboard;
