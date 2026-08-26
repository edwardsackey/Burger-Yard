import { Admin } from "@/constants/admin-theme";
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Button, Icon, type IconName } from "./ui";

/**
 * Replaces Alert.alert, which react-native-web implements as an empty
 * function:
 *
 *   class Alert { static alert() {} }
 *
 * Every confirmation and validation message in the console was therefore
 * silent on the web, which is why destructive buttons appeared to do nothing.
 * This renders a real dialog on every platform.
 */

type ConfirmOptions = {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  icon?: IconName;
};

type NotifyOptions = {
  title: string;
  message?: string;
  icon?: IconName;
};

type DialogValue = {
  /** Resolves true when confirmed, false when dismissed. */
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  notify: (options: NotifyOptions) => void;
};

const DialogContext = createContext<DialogValue | null>(null);

type State =
  | { kind: "hidden" }
  | { kind: "confirm"; options: ConfirmOptions }
  | { kind: "notify"; options: NotifyOptions };

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>({ kind: "hidden" });
  const resolver = useRef<((value: boolean) => void) | null>(null);

  const settle = useCallback((value: boolean) => {
    setState({ kind: "hidden" });
    resolver.current?.(value);
    resolver.current = null;
  }, []);

  const confirm = useCallback((options: ConfirmOptions) => {
    setState({ kind: "confirm", options });
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const notify = useCallback((options: NotifyOptions) => {
    setState({ kind: "notify", options });
  }, []);

  const value = useMemo<DialogValue>(() => ({ confirm, notify }), [confirm, notify]);

  const options = state.kind === "hidden" ? null : state.options;
  const isConfirm = state.kind === "confirm";
  const destructive = isConfirm && (state.options as ConfirmOptions).destructive;

  return (
    <DialogContext.Provider value={value}>
      {children}

      <Modal
        visible={state.kind !== "hidden"}
        transparent
        animationType="fade"
        onRequestClose={() => settle(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => settle(false)}>
          <Pressable style={styles.panel} onPress={(e) => e.stopPropagation()}>
            <View
              style={[styles.iconWrap, destructive && { backgroundColor: Admin.redSoft }]}
            >
              <Icon
                name={options?.icon ?? (destructive ? "alert-triangle" : "info")}
                size={20}
                color={destructive ? Admin.red : Admin.textMuted}
              />
            </View>

            <Text style={styles.title}>{options?.title}</Text>
            {options?.message ? (
              <Text style={styles.message}>{options.message}</Text>
            ) : null}

            <View style={styles.actions}>
              {isConfirm && (
                <Button
                  label={(state.options as ConfirmOptions).cancelLabel ?? "Cancel"}
                  variant="secondary"
                  onPress={() => settle(false)}
                  style={{ flex: 1 }}
                />
              )}
              <Button
                label={
                  isConfirm
                    ? ((state.options as ConfirmOptions).confirmLabel ?? "Confirm")
                    : "OK"
                }
                variant={destructive ? "danger" : "primary"}
                onPress={() => settle(true)}
                style={{ flex: 1 }}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const value = useContext(DialogContext);
  if (!value) throw new Error("useDialog must be used inside DialogProvider");
  return value;
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(17,24,39,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  panel: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: Admin.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Admin.border,
    padding: 22,
    alignItems: "center",
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Admin.divider,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
    color: Admin.text,
    textAlign: "center",
  },
  message: {
    fontSize: 13,
    color: Admin.textMuted,
    textAlign: "center",
    lineHeight: 19,
    marginTop: 8,
  },
  actions: { flexDirection: "row", gap: 10, marginTop: 20, width: "100%" },
});

export default DialogProvider;
