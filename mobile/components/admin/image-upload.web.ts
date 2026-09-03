import { API_URL, getToken } from "@/api";

/** Opens the browser's native file picker (which includes any cloud-drive
 * provider the OS/browser integrates — Google Drive, iCloud, OneDrive,
 * etc. — that's the OS's own capability, not something wired up here) and
 * uploads the chosen image to the backend. Returns the resulting URL, or
 * null if the user cancelled. */
export async function pickAndUploadImage(): Promise<string | null> {
  const file = await new Promise<File | null>((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = () => resolve(input.files?.[0] ?? null);
    // Not universally supported, but resolves the promise immediately in
    // browsers that do fire it instead of leaving the caller hanging.
    input.oncancel = () => resolve(null);
    input.click();
  });

  if (!file) return null;

  const form = new FormData();
  form.append("image", file, file.name);

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
