import { createHash } from "node:crypto";

/**
 * Cloudinary unsigned-params signed upload (server-side).
 *
 * We talk to Cloudinary's REST API directly with a signed request instead of
 * pulling in the SDK, so there's no extra dependency. Credentials come from
 * CLOUDINARY_URL (cloudinary://<api_key>:<api_secret>@<cloud_name>) or the
 * individual CLOUDINARY_CLOUD_NAME / _API_KEY / _API_SECRET vars.
 */

type CloudinaryConfig = {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  folder?: string;
};

/** Returns the config when Cloudinary is set up, otherwise null (use local storage). */
export function getCloudinaryConfig(): CloudinaryConfig | null {
  const url = process.env.CLOUDINARY_URL;
  if (url) {
    try {
      const u = new URL(url);
      const cloudName = u.hostname;
      const apiKey = decodeURIComponent(u.username);
      const apiSecret = decodeURIComponent(u.password);
      if (cloudName && apiKey && apiSecret) {
        return { cloudName, apiKey, apiSecret, folder: process.env.CLOUDINARY_FOLDER || undefined };
      }
    } catch {
      // fall through to the individual vars
    }
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (cloudName && apiKey && apiSecret) {
    return { cloudName, apiKey, apiSecret, folder: process.env.CLOUDINARY_FOLDER || undefined };
  }
  return null;
}

/** Cloudinary signs a sorted `k=v&...` string + api_secret with SHA-1. */
function sign(params: Record<string, string>, apiSecret: string): string {
  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return createHash("sha1").update(toSign + apiSecret).digest("hex");
}

/** Upload one image to Cloudinary and return its delivery URL + public id. */
export async function uploadToCloudinary(
  file: Blob,
  opts?: { folder?: string },
): Promise<{ url: string; publicId: string }> {
  const cfg = getCloudinaryConfig();
  if (!cfg) throw new Error("Cloudinary is not configured");

  const timestamp = String(Math.round(Date.now() / 1000));
  const folder = opts?.folder ?? cfg.folder;
  const params: Record<string, string> = { timestamp };
  if (folder) params.folder = folder;
  const signature = sign(params, cfg.apiSecret);

  const form = new FormData();
  form.append("file", file, "upload");
  form.append("api_key", cfg.apiKey);
  form.append("timestamp", timestamp);
  form.append("signature", signature);
  if (folder) form.append("folder", folder);

  const endpoint = `https://api.cloudinary.com/v1_1/${cfg.cloudName}/image/upload`;
  const res = await fetch(endpoint, { method: "POST", body: form });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Cloudinary upload failed (${res.status}): ${detail}`);
  }

  const data = (await res.json()) as { secure_url?: string; public_id?: string };
  if (!data.secure_url) throw new Error("Cloudinary did not return a URL");
  return { url: data.secure_url, publicId: data.public_id ?? "" };
}
