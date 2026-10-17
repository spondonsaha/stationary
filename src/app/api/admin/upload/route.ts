import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { getSessionAdmin } from "@/lib/auth/session";
import { getCloudinaryConfig, uploadToCloudinary } from "@/lib/cloudinary";

export const runtime = "nodejs";

const MAX_BYTES = 4 * 1024 * 1024; // 4 MB
const ALLOWED = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/avif", "avif"],
  ["image/svg+xml", "svg"],
]);

/**
 * Admin image upload. When Cloudinary is configured the file is uploaded there
 * and its delivery URL is returned (survives redeploys, CDN-served). Otherwise
 * it falls back to writing to /public/uploads for local/single-host setups.
 * Either way the returned public path/URL is stored on the product/category row.
 */
export async function POST(req: Request) {
  const admin = await getSessionAdmin();
  if (!admin) return Response.json({ error: "Not authenticated" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "No file provided" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return Response.json({ error: "Image must be 4 MB or smaller" }, { status: 413 });
  }

  const ext = ALLOWED.get(file.type);
  if (!ext) {
    return Response.json(
      { error: "Unsupported type. Use JPEG, PNG, WebP, AVIF or SVG." },
      { status: 415 },
    );
  }

  // Preferred: Cloudinary (set CLOUDINARY_URL to enable).
  if (getCloudinaryConfig()) {
    try {
      const { url } = await uploadToCloudinary(file);
      return Response.json({ path: url });
    } catch (err) {
      console.error("Cloudinary upload failed; falling back to local storage.", err);
    }
  }

  // Fallback: write to /public/uploads (single-host deployments only).
  const name = `${Date.now()}-${randomBytes(6).toString("hex")}.${ext}`;
  const dir = join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, name), Buffer.from(await file.arrayBuffer()));

  return Response.json({ path: `/uploads/${name}` });
}
