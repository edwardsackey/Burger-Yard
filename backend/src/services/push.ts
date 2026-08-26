/**
 * Expo's push API needs no SDK — a plain POST with the token, matching this
 * project's pattern elsewhere (Arkesel, Paystack, Google Places all go
 * through plain fetch too).
 */
export async function sendPushNotification(
  pushToken: string | null | undefined,
  title: string,
  body: string,
  data?: Record<string, unknown>,
): Promise<void> {
  if (!pushToken) return;

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ to: pushToken, title, body, data, sound: 'default' }),
    });

    const result = await response.json();
    if (!response.ok || result?.data?.status === 'error') {
      console.error('Push notification failed:', result);
    }
  } catch (error) {
    console.error('Push notification error:', error);
  }
}
