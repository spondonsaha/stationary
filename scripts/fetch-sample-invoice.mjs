/**
 * Downloads a real invoice PDF from the running app into samples/.
 * Proves the /invoice/[token]/pdf route end to end.
 *
 * Usage:
 *   1. npm run dev   (in another terminal)
 *   2. npm run pdf:sample            # uses the most recent invoice in the DB
 *      npm run pdf:sample -- <token> # or a specific invoice public token
 */
import postgres from "postgres";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const baseUrl = process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000";

async function main() {
  let token = process.argv[2];

  if (!token) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set and no token was provided");
    const sql = postgres(url, { max: 1 });
    const rows = await sql`SELECT public_token FROM invoices ORDER BY created_at DESC LIMIT 1`;
    await sql.end();
    token = rows[0]?.public_token;
    if (!token) throw new Error("No invoices found — run npm run db:seed first");
  }

  const res = await fetch(`${baseUrl}/invoice/${token}/pdf`);
  if (!res.ok) {
    throw new Error(`GET /invoice/${token}/pdf -> ${res.status}. Is the app running?`);
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.subarray(0, 4).toString() !== "%PDF") {
    throw new Error("Response was not a PDF");
  }

  const outDir = join(__dirname, "..", "samples");
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, "sample-invoice.pdf");
  writeFileSync(outPath, buffer);
  console.log(`Wrote ${outPath} (${(buffer.length / 1024).toFixed(1)} KB)`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
