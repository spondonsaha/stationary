/**
 * Generates lightweight SVG artwork for seed products and categories.
 * Keeps the repo free of binary assets and the storefront fast (tiny SVGs).
 * Admin-uploaded images live in /public/uploads and take precedence.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "public", "products");
mkdirSync(outDir, { recursive: true });

const PALETTES = [
  { bg: "#EEF4FA", ink: "#1B3A5C", accent: "#F5C542" },
  { bg: "#FDF3D0", ink: "#7A5B10", accent: "#1B3A5C" },
  { bg: "#E6F4EC", ink: "#1F5C40", accent: "#F5C542" },
  { bg: "#FDECEA", ink: "#8C3B34", accent: "#1B3A5C" },
  { bg: "#F1ECFA", ink: "#4A3B7A", accent: "#F5C542" },
  { bg: "#E8F6F8", ink: "#1B5C66", accent: "#F5C542" },
];

/** Tiny per-category glyphs drawn with plain shapes (no icon library). */
const GLYPHS = {
  "gel-pen": (a) => `
    <g transform="rotate(-35 100 100)">
      <rect x="86" y="38" width="28" height="112" rx="10" fill="${a.ink}"/>
      <rect x="86" y="38" width="28" height="34" rx="10" fill="${a.accent}"/>
      <polygon points="86,150 114,150 100,186" fill="${a.ink}"/>
      <polygon points="94,168 106,168 100,186" fill="#F7F3EA"/>
    </g>`,
  "fountain-pen": (a) => `
    <g transform="rotate(-35 100 100)">
      <rect x="84" y="30" width="32" height="90" rx="12" fill="${a.ink}"/>
      <rect x="90" y="120" width="20" height="20" fill="${a.accent}"/>
      <path d="M86 140 L114 140 L100 188 Z" fill="${a.ink}"/>
      <line x1="100" y1="150" x2="100" y2="180" stroke="${a.accent}" stroke-width="3"/>
    </g>`,
  "pencil: HB": (a) => `
    <g transform="rotate(-35 100 100)">
      <rect x="88" y="36" width="24" height="20" fill="#E58B7B"/>
      <rect x="88" y="56" width="24" height="8" fill="#C9C4B8"/>
      <rect x="88" y="64" width="24" height="86" fill="${a.accent}"/>
      <polygon points="88,150 112,150 100,186" fill="#E9D5A8"/>
      <polygon points="94,168 106,168 100,186" fill="#3B3B3B"/>
    </g>`,
  "pencil: 2B": (a) => `
    <g transform="rotate(-35 100 100)">
      <rect x="88" y="36" width="24" height="20" fill="#E58B7B"/>
      <rect x="88" y="56" width="24" height="8" fill="#C9C4B8"/>
      <rect x="88" y="64" width="24" height="86" fill="#2F6F4E"/>
      <polygon points="88,150 112,150 100,186" fill="#E9D5A8"/>
      <polygon points="94,168 106,168 100,186" fill="#3B3B3B"/>
    </g>`,
  notebook: (a) => `
    <rect x="46" y="42" width="108" height="126" rx="8" fill="#FFFFFF" stroke="${a.ink}" stroke-width="4"/>
    <rect x="46" y="42" width="22" height="126" rx="8" fill="${a.ink}"/>
    <line x1="82" y1="72" x2="138" y2="72" stroke="#C9D6E4" stroke-width="4" stroke-linecap="round"/>
    <line x1="82" y1="92" x2="138" y2="92" stroke="#C9D6E4" stroke-width="4" stroke-linecap="round"/>
    <line x1="82" y1="112" x2="120" y2="112" stroke="#C9D6E4" stroke-width="4" stroke-linecap="round"/>
    <circle cx="57" cy="70" r="5" fill="${a.accent}"/>
    <circle cx="57" cy="100" r="5" fill="${a.accent}"/>
    <circle cx="57" cy="130" r="5" fill="${a.accent}"/>`,
  notepad: (a) => `
    <rect x="54" y="40" width="92" height="130" rx="6" fill="#FFF9E8" stroke="${a.ink}" stroke-width="4"/>
    <line x1="70" y1="66" x2="130" y2="66" stroke="#D9CFB2" stroke-width="3"/>
    <line x1="70" y1="86" x2="130" y2="86" stroke="#D9CFB2" stroke-width="3"/>
    <line x1="70" y1="106" x2="130" y2="106" stroke="#D9CFB2" stroke-width="3"/>
    <line x1="70" y1="126" x2="112" y2="126" stroke="#D9CFB2" stroke-width="3"/>
    <rect x="74" y="26" width="14" height="22" rx="4" fill="${a.accent}"/>
    <rect x="112" y="26" width="14" height="22" rx="4" fill="${a.accent}"/>`,
  paper: (a) => `
    <rect x="52" y="36" width="104" height="132" rx="4" fill="#FFFFFF" stroke="${a.ink}" stroke-width="4"/>
    <rect x="60" y="46" width="104" height="132" rx="4" fill="#F4F7FB" stroke="${a.ink}" stroke-width="3" opacity="0.7"/>
    <rect x="68" y="56" width="104" height="132" rx="4" fill="#EAF0F7" stroke="${a.ink}" stroke-width="3" opacity="0.5"/>`,
  books: (a) => `
    <rect x="48" y="118" width="110" height="26" rx="4" fill="${a.ink}"/>
    <rect x="56" y="90" width="102" height="26" rx="4" fill="${a.accent}"/>
    <rect x="66" y="62" width="92" height="26" rx="4" fill="#E58B7B"/>
    <line x1="60" y1="131" x2="146" y2="131" stroke="#FFFFFF" stroke-width="3" opacity="0.6"/>`,
  palette: (a) => `
    <path d="M100 34c-36 0-62 24-62 56 0 22 16 34 32 34 8 0 12-4 12-10 0-8 6-12 14-12 20 0 36-16 36-40 0-16-12-28-32-28z" fill="#FFFFFF" stroke="${a.ink}" stroke-width="4"/>
    <circle cx="72" cy="78" r="9" fill="#F5C542"/>
    <circle cx="92" cy="60" r="9" fill="#E58B7B"/>
    <circle cx="118" cy="62" r="9" fill="#4A7399"/>
    <circle cx="132" cy="86" r="9" fill="#3E9C6E"/>`,
  marker: (a) => `
    <g transform="rotate(-20 100 100)">
      <rect x="88" y="34" width="24" height="30" rx="6" fill="${a.accent}"/>
      <rect x="84" y="64" width="32" height="80" rx="10" fill="${a.ink}"/>
      <rect x="84" y="128" width="32" height="20" rx="6" fill="${a.accent}"/>
      <rect x="90" y="148" width="20" height="26" rx="4" fill="#3B3B3B"/>
    </g>`,
  file: (a) => `
    <path d="M44 60h44l10 12h58a6 6 0 016 6v76a6 6 0 01-6 6H44a6 6 0 01-6-6V66a6 6 0 016-6z" fill="${a.accent}" stroke="${a.ink}" stroke-width="4"/>
    <path d="M38 86h124v64a6 6 0 01-6 6H44a6 6 0 01-6-6z" fill="#FFFFFF" stroke="${a.ink}" stroke-width="4"/>
    <line x1="56" y1="108" x2="144" y2="108" stroke="#C9D6E4" stroke-width="4" stroke-linecap="round"/>
    <line x1="56" y1="126" x2="126" y2="126" stroke="#C9D6E4" stroke-width="4" stroke-linecap="round"/>`,
  clipboard: (a) => `
    <rect x="54" y="46" width="92" height="124" rx="8" fill="#FFFFFF" stroke="${a.ink}" stroke-width="4"/>
    <rect x="78" y="30" width="44" height="24" rx="8" fill="${a.ink}"/>
    <line x1="70" y1="84" x2="130" y2="84" stroke="#C9D6E4" stroke-width="4" stroke-linecap="round"/>
    <line x1="70" y1="104" x2="130" y2="104" stroke="#C9D6E4" stroke-width="4" stroke-linecap="round"/>
    <line x1="70" y1="124" x2="112" y2="124" stroke="#C9D6E4" stroke-width="4" stroke-linecap="round"/>`,
  ruler: (a) => `
    <rect x="30" y="80" width="140" height="40" rx="6" fill="${a.accent}" stroke="${a.ink}" stroke-width="4"/>
    <line x1="50" y1="80" x2="50" y2="98" stroke="${a.ink}" stroke-width="3"/>
    <line x1="70" y1="80" x2="70" y2="104" stroke="${a.ink}" stroke-width="3"/>
    <line x1="90" y1="80" x2="90" y2="98" stroke="${a.ink}" stroke-width="3"/>
    <line x1="110" y1="80" x2="110" y2="104" stroke="${a.ink}" stroke-width="3"/>
    <line x1="130" y1="80" x2="130" y2="98" stroke="${a.ink}" stroke-width="3"/>
    <line x1="150" y1="80" x2="150" y2="104" stroke="${a.ink}" stroke-width="3"/>`,
  scissors: (a) => `
    <circle cx="70" cy="140" r="16" fill="none" stroke="${a.ink}" stroke-width="6"/>
    <circle cx="118" cy="140" r="16" fill="none" stroke="${a.ink}" stroke-width="6"/>
    <line x1="80" y1="128" x2="128" y2="44" stroke="${a.ink}" stroke-width="6" stroke-linecap="round"/>
    <line x1="108" y1="128" x2="64" y2="44" stroke="${a.accent}" stroke-width="6" stroke-linecap="round"/>
    <circle cx="96" cy="104" r="6" fill="${a.accent}"/>`,
  glue: (a) => `
    <rect x="80" y="64" width="40" height="96" rx="10" fill="#FFFFFF" stroke="${a.ink}" stroke-width="4"/>
    <rect x="88" y="40" width="24" height="28" rx="6" fill="${a.accent}" stroke="${a.ink}" stroke-width="4"/>
    <rect x="80" y="100" width="40" height="36" fill="${a.ink}" opacity="0.15"/>`,
  binder: (a) => `
    <rect x="52" y="40" width="96" height="128" rx="6" fill="${a.ink}"/>
    <rect x="66" y="52" width="82" height="104" rx="4" fill="#FFFFFF"/>
    <circle cx="86" cy="76" r="7" fill="none" stroke="${a.ink}" stroke-width="4"/>
    <circle cx="86" cy="104" r="7" fill="none" stroke="${a.ink}" stroke-width="4"/>
    <circle cx="86" cy="132" r="7" fill="none" stroke="${a.ink}" stroke-width="4"/>`,
  "sticky-notes": (a) => `
    <rect x="52" y="52" width="96" height="96" rx="4" fill="${a.accent}" stroke="${a.ink}" stroke-width="4"/>
    <rect x="64" y="40" width="96" height="96" rx="4" fill="#FFF3C4" stroke="${a.ink}" stroke-width="4"/>
    <line x1="80" y1="66" x2="140" y2="66" stroke="#D9C98A" stroke-width="4" stroke-linecap="round"/>
    <line x1="80" y1="86" x2="132" y2="86" stroke="#D9C98A" stroke-width="4" stroke-linecap="round"/>
    <line x1="80" y1="106" x2="118" y2="106" stroke="#D9C98A" stroke-width="4" stroke-linecap="round"/>`,
};

const products = [
  ["gel-pen", "Classic Gel Pen 0.7mm — Blue Ink", 0],
  ["gel-pen", "Classic Gel Pen 0.7mm — Black Ink", 1],
  ["gel-pen", "Retractable Ballpoint Pen 1.0mm — Red", 2],
  ["fountain-pen", "Student Fountain Pen — Fine Nib", 3],
  ["fountain-pen", "Inkwell Desk Luxury Fountain Pen", 4],
  ["pencil: HB", "HB Graphite Pencils — Pack of 12", 5],
  ["pencil: 2B", "2B Sketching Pencils — Pack of 6", 0],
  ["pencil: HB", "Mechanical Pencil 0.5mm — Navy", 1],
  ["notebook", "Hardcover Notebook A5 — Ruled, 200 pages", 2],
  ["notebook", "Softcover Notebook A6 — Dotted, 120 pages", 3],
  ["notebook", "Spiral Notebook B5 — Grid, 150 pages", 4],
  ["notepad", "Memo Pad — Brick Pattern, 100 sheets", 5],
  ["notepad", "To-Do Notepad — Daily Planner", 0],
  ["paper", "Printer Paper A4 — 80gsm, 500 sheets", 1],
  ["paper", "Colored Craft Paper — 50 sheets Assorted", 2],
  ["paper", "Sketch Paper Pad A4 — 120gsm, 40 sheets", 3],
  ["books", "Composition Book — Marble Cover, 100 pages", 4],
  ["books", "Reading Journal — Hardcover, 180 pages", 5],
  ["books", "Address Book — Softcover, 144 pages", 0],
  ["palette", "Watercolor Pan Set — 24 Colors", 1],
  ["palette", "Colored Pencils Set — 36 Colors", 2],
  ["palette", "Acrylic Paint Tubes — 12 × 22ml", 3],
  ["palette", "Brush Pen Set — 8 Dual Tip", 4],
  ["marker", "Permanent Marker Set — Chisel Tip, 4 Colors", 5],
  ["marker", "Highlighter Set — Assorted Pastels, 5 Pack", 0],
  ["marker", "Whiteboard Markers — Low Odor, 4 Pack", 1],
  ["file", "Document File Folder — Blue, Pack of 5", 2],
  ["file", "Sheet Protectors A4 — 100 Pack", 3],
  ["clipboard", "Clipboard with Storage — A4", 4],
  ["ruler", "12-inch Ruler — Transparent Flexi", 5],
  ["ruler", "Geometry Set — Ruler, Compass, Protractor", 0],
  ["scissors", "Craft Scissors — 8-inch Soft Grip", 1],
  ["glue", "Glue Stick — 20g, Pack of 3", 2],
  ["glue", "Liquid Glue — 100ml Fine Tip", 3],
  ["binder", "Ring Binder A4 — 2-inch, Navy", 4],
  ["sticky-notes", "Sticky Notes — 3×3 inch, Pastel, 12 Pad", 5],
  ["sticky-notes", "Index Tabs — Removable, 100 pieces", 0],
];

function svgFor(kind, name, paletteIndex) {
  const a = PALETTES[paletteIndex % PALETTES.length];
  const glyph = GLYPHS[kind] ?? GLYPHS.paper;
  // Short display label derived from the product name.
  const label = name
    .replace(/—.*$/, "")
    .trim()
    .slice(0, 28);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 200 200" role="img" aria-label="${label}">
  <rect width="200" height="200" rx="18" fill="${a.bg}"/>
  <circle cx="164" cy="38" r="26" fill="${a.accent}" opacity="0.35"/>
  <circle cx="30" cy="170" r="34" fill="${a.ink}" opacity="0.08"/>
  ${glyph(a)}
</svg>`;
}

let n = 0;
for (const [kind, name, pal] of products) {
  n += 1;
  const file = `product-${String(n).padStart(2, "0")}.svg`;
  writeFileSync(join(outDir, file), svgFor(kind, name, pal), "utf8");
}

// Category header art
const catDir = outDir;
const cats = [
  ["cat-pens", "gel-pen", 0],
  ["cat-notebooks", "notebook", 2],
  ["cat-paper", "paper", 1],
  ["cat-books", "books", 4],
  ["cat-art-supplies", "palette", 3],
  ["cat-office", "file", 5],
];
for (const [file, kind, pal] of cats) {
  writeFileSync(join(catDir, `${file}.svg`), svgFor(kind, file, pal), "utf8");
}

console.log(`Generated ${n} product images + ${cats.length} category images in public/products`);
