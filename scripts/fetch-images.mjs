/**
 * Phase F: download real product photography into /public.
 *
 * Uses the Openverse API (aggregates Wikimedia Commons, StockSnap, Flickr…),
 * prefers CC0/PDM/CC-BY/CC-BY-SA images (reuse allowed), and writes them to:
 *   public/products/product-NN.jpg   (37 products, 1:1 with the seed order)
 *   public/products/cat-<slug>.jpg   (6 categories)
 *   public/images/hero-bookstore.jpg (home hero)
 * plus a credits ledger at public/products/credits.json.
 *
 * Relevance: each target lists several queries and a set of keywords; a result
 * is only accepted when its title matches a keyword, so we avoid the loose
 * matches the raw search returns. If nothing matches, the best-ranked result is
 * used but flagged low-confidence in credits.json.
 *
 * Run: node scripts/fetch-images.mjs          (skips files already present)
 *      $env:FORCE=1; node scripts/fetch-images.mjs   (re-download everything)
 */
import { writeFile, readFile, mkdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const PRODUCTS_DIR = join(ROOT, "public", "products");
const IMAGES_DIR = join(ROOT, "public", "images");
const CREDITS_FILE = join(PRODUCTS_DIR, "credits.json");
const FORCE = process.env.FORCE === "1";

const UA = "NorthgateBookstoreImageFetcher/1.0 (university demo seed)";
const PACE_MS = 3300; // stay under the anonymous Openverse limit (20/min)
const MIN_BYTES = 5000;

// licence preference: fully free first, then attribution-only.
const LICENSE_RANK = { cc0: 0, pdm: 0, by: 1, "cc-by": 1, "by-sa": 2, "cc-by-sa": 2 };

/** [label, queries[], keywords[]] */
const DEFS = [
  ["product-01", ["blue ballpoint pen", "gel pen", "blue pen"], ["pen"]],
  ["product-02", ["black pen", "ballpoint pen", "black gel pen"], ["pen"]],
  ["product-03", ["red pen", "red marker"], ["pen", "marker"]],
  ["product-04", ["fountain pen writing", "fountain pen"], ["fountain pen", "pen"]],
  ["product-05", ["fountain pen nib", "fountain pen case", "fountain pen"], ["fountain pen", "pen"]],
  ["product-06", ["colored pencils on white", "pencils on white", "pencil box", "graphite pencils"], ["pencil"]],
  ["product-07", ["sketching pencils set", "drawing pencils set", "pencil set"], ["pencil"]],
  ["product-08", ["mechanical pencil", "mechanical pencil lead"], ["pencil"]],
  ["product-09", ["hardcover notebook", "notebook"], ["notebook"]],
  ["product-10", ["dot grid notebook", "dotted notebook", "bullet journal", "notebook pages grid"], ["notebook", "journal", "grid"]],
  ["product-11", ["spiral notebook", "spiral bound notebook"], ["notebook", "spiral"]],
  ["product-12", ["memo pad", "memo notes", "notepad"], ["note", "memo", "pad"]],
  ["product-13", ["to do list notepad", "planner pad", "notepad with pen"], ["to do", "todo", "planner", "notepad", "list", "pad"]],
  ["product-14", ["printer paper ream", "white printer paper", "paper stack white", "copy paper"], ["paper"]],
  ["product-15", ["colored paper", "craft paper", "colourful paper sheets"], ["paper"]],
  ["product-16", ["blank sketchbook", "sketchbook cover", "drawing paper pad", "sketch pad"], ["sketchbook", "sketch pad", "drawing pad", "paper pad"]],
  ["product-17", ["composition notebook", "marble composition book", "school notebook cover"], ["composition", "notebook"]],
  ["product-18", ["reading journal", "journal book", "diary book"], ["journal", "diary", "book"]],
  ["product-19", ["address book", "address notebook"], ["address", "book", "notebook"]],
  ["product-20", ["watercolor paint set", "watercolour paints", "watercolor pans"], ["watercolor", "watercolour", "paint"]],
  ["product-21", ["colored pencils", "colour pencils"], ["pencil"]],
  ["product-22", ["acrylic paint tubes", "acrylic paints", "paint tubes"], ["paint", "acrylic"]],
  ["product-23", ["felt tip pens", "brush pen", "markers pens set", "colored pens"], ["brush pen", "marker", "felt tip", "pen"]],
  ["product-24", ["permanent marker", "felt tip markers", "marker pens"], ["marker"]],
  ["product-25", ["highlighters", "highlighter pen", "fluorescent marker"], ["highlighter"]],
  ["product-26", ["dry erase markers", "whiteboard marker", "marker pens"], ["marker", "whiteboard", "erase"]],
  ["product-27", ["file folder", "document folder", "folders stationery"], ["folder"]],
  ["product-28", ["plastic document sleeves", "sheet protector binder", "clear document sleeves", "punched pocket file"], ["sleeve", "protector", "pocket"]],
  ["product-29", ["clipboard", "clip board stationery"], ["clipboard", "clip board"]],
  ["product-30", ["ruler", "measuring ruler", "steel ruler"], ["ruler"]],
  ["product-31", ["geometry set", "compass geometry", "protractor set"], ["geometry", "compass", "protractor"]],
  ["product-32", ["scissors", "craft scissors"], ["scissors"]],
  ["product-33", ["glue stick", "glue sticks stationery"], ["glue"]],
  ["product-34", ["glue bottle", "white glue bottle", "liquid glue container"], ["glue"]],
  ["product-35", ["ring binder", "lever arch file", "binder file"], ["binder", "folder", "file"]],
  ["product-36", ["sticky notes", "post it notes", "sticky note pad"], ["sticky", "note", "post-it", "post it"]],
  ["product-37", ["index tabs", "sticky tabs", "page flags", "bookmark tabs", "notebook tabs"], ["tab", "tabs", "flag", "bookmark"]],
  ["cat-pens", ["pens", "pen holder", "ballpoint pens"], ["pen"]],
  ["cat-notebooks", ["notebooks stack", "notebooks", "stack of notebooks"], ["notebook"]],
  ["cat-paper", ["blank paper", "paper sheets", "paper stack"], ["paper"]],
  ["cat-books", ["books stack", "stack of books", "books"], ["book"]],
  ["cat-art-supplies", ["paint brushes set", "art supplies flat lay", "coloring pencils and paints"], ["paint", "brush", "pencil", "art supplies"]],
  ["cat-office", ["office supplies", "stationery desk", "office desk"], ["office", "stationery", "supplies"]],
];

const TARGETS = DEFS.map(([label, queries, keywords]) => ({
  file: join(PRODUCTS_DIR, `${label}.jpg`),
  label,
  queries,
  keywords,
})).concat([
  {
    file: join(IMAGES_DIR, "hero-bookstore.jpg"),
    label: "hero-bookstore",
    queries: ["bookstore interior", "bookshop shelves", "library bookshelves", "books on shelves"],
    keywords: ["book", "librar", "bookshop", "bookstore", "shelf"],
  },
]);

// Query-variant combos tried in order; the first confident match wins.
const SEARCH_COMBOS = [
  "&size=large",
  "&size=large&extension=jpg",
  "&source=stocksnap&size=large",
  "&extension=jpg",
  "",
];

// Titles that usually mean the picture is an artwork/scan, not the product.
const NEGATIVE = /cartoon|clipart|photocopied|periodogram|tablet|android|asus|samsung|lenovo|momoyogusa|ukiyo|woodblock|proclamation|tsd work/i;

// Extra per-target exclusions (keyed by label).
const NEG_EXTRA = {
  "product-06": /sketch|sketched|drawing|portrait|woman|man\b|figure|study/,
  "product-07": /sketch|portrait|figure|woman|man\b|person|holding|hand/,
  "product-10": /proxima|astronom|star|science|caption/,
  "product-13": /cartoon|comic/,
  "product-14": /plotter|papermaking|soaked|fiber|fibre|mesh|swelled|ledger|manuscript|record book/,
  "product-16": /mountains|met |woodblock|ukiyo|landscape/,
  "product-17": /book of hours|leaf from|manuscript|medieval|illuminat/,
  "product-23": /holding|hand|clipart|interior|stage|room/,
  "product-24": /wall|drawing|graffiti|flower|historical|plaque|sign|memorial/,
  "product-26": /webdesign|website|web design|ui\b/,
  "product-28": /plasma|cutting|corte|proclamation|weld|passport|pass,|visa|currency|coin/,
  "product-34": /stick/,
  "product-37": /tsd|work area|interior view|words across|world/,
  "cat-art-supplies": /momoyogusa|ukiyo|woodblock|century|painting|flowers/,
};

const ONLY = (process.env.ONLY ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function search(query, variant, attempt = 0) {
  const url = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(query)}&page_size=20${variant}`;
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
  if (res.status === 429 || res.status === 503) {
    if (attempt < 3) {
      await sleep(15000);
      return search(query, variant, attempt + 1);
    }
    return [];
  }
  if (!res.ok) return [];
  await sleep(PACE_MS);
  const json = await res.json();
  return json.results ?? [];
}

function matches(title, keywords) {
  const t = (title ?? "").toLowerCase();
  return keywords.some((k) => new RegExp(`\\b${k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(t));
}

function rank(results, keywords, label) {
  const withUrl = results.filter((r) => typeof r.url === "string" && r.url.length > 0);
  const extra = NEG_EXTRA[label] ?? null;
  const clean = withUrl.filter(
    (r) => !NEGATIVE.test(r.title ?? "") && (!extra || !extra.test(r.title ?? "")),
  );
  const pool = clean.length ? clean : withUrl;
  const sorted = [...pool].sort((a, b) => {
    const ra = LICENSE_RANK[(a.license ?? "").toLowerCase()] ?? 9;
    const rb = LICENSE_RANK[(b.license ?? "").toLowerCase()] ?? 9;
    if (ra !== rb) return ra - rb;
    return (b.width ?? 0) * (b.height ?? 0) - (a.width ?? 0) * (a.height ?? 0);
  });
  const hit = sorted.find((r) => matches(r.title, keywords));
  return { chosen: hit ?? sorted[0] ?? null, confident: Boolean(hit) && clean.length > 0 };
}

async function download(url, dest) {
  const res = await fetch(url, { headers: { "User-Agent": UA }, redirect: "follow" });
  if (!res.ok) throw new Error(`http ${res.status}`);
  const type = res.headers.get("content-type") ?? "";
  if (!type.startsWith("image/")) throw new Error(`not an image (${type})`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < MIN_BYTES) throw new Error(`too small (${buf.length} bytes)`);
  await writeFile(dest, buf);
  return buf.length;
}

function betterLoose(a, b) {
  const ra = LICENSE_RANK[(a.license ?? "").toLowerCase()] ?? 9;
  const rb = LICENSE_RANK[(b.license ?? "").toLowerCase()] ?? 9;
  if (ra !== rb) return ra < rb;
  return (a.width ?? 0) * (a.height ?? 0) > (b.width ?? 0) * (b.height ?? 0);
}

function record(map, target, query, chosen, confident, bytes) {
  const rel = "/" + target.file.replace(/\\/g, "/").split("/public/")[1];
  map.set(rel, {
    file: rel,
    query,
    keywordMatch: confident,
    title: chosen.title ?? "",
    creator: chosen.creator ?? "",
    license: chosen.license ?? "",
    source: chosen.foreign_landing_url ?? chosen.url,
    image: chosen.url,
    bytes,
  });
}

async function main() {
  await mkdir(PRODUCTS_DIR, { recursive: true });
  await mkdir(IMAGES_DIR, { recursive: true });

  // Preserve credits from previous runs; replace entries we re-fetch.
  let knownCredits = [];
  if (existsSync(CREDITS_FILE)) {
    try {
      knownCredits = JSON.parse(await readFile(CREDITS_FILE, "utf8")).images ?? [];
    } catch {
      knownCredits = [];
    }
  }
  const creditByFile = new Map(knownCredits.map((c) => [c.file, c]));

  const targets = ONLY.length ? TARGETS.filter((t) => ONLY.includes(t.label)) : TARGETS;
  let done = 0;
  let skipped = 0;
  const failed = [];
  const lowConfidence = [];

  for (const target of targets) {
    if (!FORCE && existsSync(target.file)) {
      const s = await stat(target.file);
      if (s.size >= MIN_BYTES) {
        skipped += 1;
        continue;
      }
    }

    let saved = false;
    let bestLoose = null;
    outer: for (const query of target.queries) {
      for (const combo of SEARCH_COMBOS) {
        try {
          const results = await search(query, combo);
          const { chosen, confident } = rank(results, target.keywords, target.label);
          if (!chosen) continue;
          if (confident) {
            const bytes = await download(chosen.url, target.file);
            record(creditByFile, target, query, chosen, confident, bytes);
            console.log(`ok    ${target.label}  "${chosen.title}"  [${chosen.license}]  ${Math.round(bytes / 1024)} KB`);
            saved = true;
            break outer;
          }
          if (!bestLoose || betterLoose(chosen, bestLoose)) bestLoose = chosen;
        } catch (err) {
          console.warn(`warn  ${target.label} (${query}) : ${err.message}`);
        }
      }
    }
    if (!saved && bestLoose) {
      try {
        const bytes = await download(bestLoose.url, target.file);
        record(creditByFile, target, target.queries[0], bestLoose, false, bytes);
        lowConfidence.push(target.label);
        console.log(`loose ${target.label}  "${bestLoose.title}"  [${bestLoose.license}]  ${Math.round(bytes / 1024)} KB`);
        saved = true;
      } catch (err) {
        console.warn(`warn  ${target.label} (loose) : ${err.message}`);
      }
    }
    if (!saved) {
      failed.push(target.label);
      console.warn(`FAIL  ${target.label}`);
    } else {
      done += 1;
    }
  }

  await writeFile(
    CREDITS_FILE,
    JSON.stringify(
      {
        note: "Stock photography from Openverse (aggregates Wikimedia Commons, StockSnap, Flickr). Verify each licence before commercial use.",
        fetchedAt: new Date().toISOString(),
        images: [...creditByFile.values()],
      },
      null,
      2,
    ),
  );

  console.log(`\nDownloaded ${done}, skipped ${skipped}, failed ${failed.length}.`);
  if (lowConfidence.length) console.log(`Loose matches: ${lowConfidence.join(", ")}`);
  if (failed.length) console.log(`Failed: ${failed.join(", ")}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
