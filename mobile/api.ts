import Constants from 'expo-constants';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// In dev (Expo Go / dev build), derive the API host from the same LAN address Metro
// is already using to serve the JS bundle to this device — no manual IP editing needed,
// and it stays correct whenever the network changes.
const getApiUrl = () => {
  // Explicit override — needed when testing over an Expo tunnel, since the
  // tunnel's hostname only forwards Metro's own port, not the backend's.
  // Set EXPO_PUBLIC_API_URL to a publicly reachable backend URL to use this.
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // The web build runs in a browser on the same machine as the backend.
  if (__DEV__ && Platform.OS === 'web') {
    return 'http://localhost:3000/api';
  }

  const hostUri = Constants.expoConfig?.hostUri ?? Constants.expoGoConfig?.hostUri;
  const host = hostUri?.split(':')[0];

  if (__DEV__ && host) {
    return `http://${host}:3000/api`;
  }

  // Fallback for environments without a Metro connection (e.g. production build).
  return 'http://192.168.100.15:3000/api';
};

export const API_URL = getApiUrl();
const API_ORIGIN = API_URL.replace(/\/api\/?$/, '');

/**
 * Uploaded photos are served by this same backend, but during dev the
 * backend's own public URL changes every time its cloudflared tunnel
 * restarts (a fresh random hostname each time). Resolving by the URL's
 * *path* against whatever host is currently configured — rather than
 * trusting whatever host was baked in when the photo was uploaded — means
 * a tunnel restart doesn't leave every previously uploaded photo pointing
 * at a dead hostname. Handles both the new relative form ("/uploads/x.jpg")
 * and old absolute URLs from before this existed.
 */
export function resolveUploadUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const path = url.startsWith('http') ? new URL(url).pathname : url;
    return `${API_ORIGIN}${path}`;
  } catch {
    return url;
  }
}

// expo-secure-store has no web implementation at all — it throws immediately
// on web, which previously broke every apiFetch call (getToken runs before
// every request). localStorage is the web equivalent; native keeps the Keychain/Keystore-backed SecureStore.
export const saveToken = async (token: string) => {
  if (Platform.OS === 'web') {
    localStorage.setItem('jwt_token', token);
    return;
  }
  await SecureStore.setItemAsync('jwt_token', token);
};

export const getToken = async () => {
  if (Platform.OS === 'web') {
    return localStorage.getItem('jwt_token');
  }
  return await SecureStore.getItemAsync('jwt_token');
};

export const deleteToken = async () => {
  if (Platform.OS === 'web') {
    localStorage.removeItem('jwt_token');
    return;
  }
  await SecureStore.deleteItemAsync('jwt_token');
};

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const token = await getToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  let data;
  try {
    data = await response.json();
  } catch {
    // An empty/non-JSON body usually means the connection was interrupted
    // in transit (e.g. a dropped tunnel), not a real API error.
    throw new Error(
      response.ok
        ? 'Lost connection to the server. Please try again.'
        : `Server error (${response.status}). Please try again.`,
    );
  }

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
};
