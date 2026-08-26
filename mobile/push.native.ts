import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { apiFetch } from "./api";

// Show the alert + play a sound even while the app is open — otherwise a
// status update arriving while the customer is looking at the app produces
// no visible sign anything happened.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Requests permission and registers this device's Expo push token with the
 * backend. Call once right after a successful sign-in/sign-up — no-ops on
 * web (no Expo push support there) and on a simulator (no real push
 * capability), and never throws: a customer who never grants permission
 * just doesn't get push updates, nothing else should break because of it.
 */
export async function registerForPushNotifications(): Promise<void> {
  if (Platform.OS === "web") return;
  if (!Device.isDevice) return;

  try {
    const existing = await Notifications.getPermissionsAsync();
    let status = existing.status;
    if (status !== "granted") {
      const requested = await Notifications.requestPermissionsAsync();
      status = requested.status;
    }
    if (status !== "granted") return;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const { data: pushToken } = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );

    await apiFetch("/auth/push-token", {
      method: "PUT",
      body: JSON.stringify({ pushToken }),
    });
  } catch (error) {
    // No EAS project configured yet, permission dialog dismissed, etc. —
    // push is a nice-to-have, not something that should block sign-in.
    console.log("Push registration skipped:", error);
  }
}
