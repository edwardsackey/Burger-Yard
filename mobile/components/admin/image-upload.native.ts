import { API_URL, getToken } from "@/api";
import * as ImagePicker from "expo-image-picker";

/** Opens the system photo picker (which includes any cloud-drive provider
 * the device's Files/Photos app is integrated with — that's an OS-level
 * capability, not something built here) and uploads the chosen image to
 * the backend. Returns the resulting URL, or null if the user cancelled. */
export async function pickAndUploadImage(): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error("Photo library permission was denied.");
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    quality: 0.8,
  });
  if (result.canceled || !result.assets?.[0]) return null;

  const asset = result.assets[0];
  const filename = asset.uri.split("/").pop() || `photo-${Date.now()}.jpg`;
  const ext = /\.(\w+)$/.exec(filename)?.[1]?.toLowerCase() ?? "jpg";
  const mimeType = asset.mimeType ?? `image/${ext === "jpg" ? "jpeg" : ext}`;

  const form = new FormData();
  // React Native's fetch expects this {uri, name, type} shape for a file
  // field — not a real Blob/File, which don't exist as such on native.
  form.append("image", { uri: asset.uri, name: filename, type: mimeType } as unknown as Blob);

  const token = await getToken();
  const response = await fetch(`${API_URL}/admin/uploads/image`, {
    method: "POST",
    // No Content-Type here — fetch sets the multipart boundary itself,
    // and setting it manually breaks the upload.
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: form,
  });

  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.url) {
    throw new Error(data?.message ?? "Upload failed. Please try again.");
  }
  return data.url as string;
}
