/**
 * The tervlapok, transcribed from each sheet's own title block
 * (Társasház "A" épület építési engedélyezési terve — 8638 Balatonlelle,
 * Hullám utca hrsz.: 5143/6 — 2022.02.).
 *
 * Ordering here is the order visitors see. Titles are read off the drawings
 * rather than guessed from the file name, which is why a plain
 * `HUllamTeljes_oldal_11.jpg` can be presented as "Északi homlokzat".
 */

export type Category = "alaprajz" | "metszet" | "homlokzat" | "egyeb";

export interface Drawing {
  /** Object name in the `floorplans` bucket. */
  file: string;
  /** Sheet number from the title block, e.g. "É.A.01". */
  sheet: string;
  title: string;
  /** Qualifier shown under the title when two sheets share a number. */
  note?: string;
  category: Category;
  /** width / height of the source file — reserves the right box before it loads. */
  aspect: number;
}

/** Source files come in three page formats. */
const PLAN = 2500 / 1485; // 1.683 — the 8503 × 5051 plan sheets
const WIDE = 2500 / 742; // 3.369 — long sections and side elevations
const HALF = 2500 / 1250; // 2.0 — the remaining sections and elevations

export const CATEGORY_LABEL: Record<Category, string> = {
  alaprajz: "Alaprajzok",
  metszet: "Metszetek",
  homlokzat: "Homlokzatok",
  egyeb: "Egyéb",
};

export const CATEGORY_ORDER: Category[] = ["alaprajz", "metszet", "homlokzat", "egyeb"];

export const DRAWINGS: Drawing[] = [
  {
    file: "BlelleHullamFsz_oldal_1.jpg",
    sheet: "É.A.01",
    title: "Földszinti alaprajz",
    note: "Parkolóbeosztással, jelölt lakásokkal",
    category: "alaprajz",
    aspect: PLAN,
  },
  {
    file: "HUllamTeljes_oldal_1.jpg",
    sheet: "É.A.01",
    title: "Földszinti alaprajz",
    note: "Méretezett tervlap",
    category: "alaprajz",
    aspect: PLAN,
  },
  { file: "HUllamTeljes_oldal_2.jpg", sheet: "É.A.02", title: "1. emeleti alaprajz", category: "alaprajz", aspect: PLAN },
  { file: "HUllamTeljes_oldal_3.jpg", sheet: "É.A.03", title: "2. emeleti alaprajz", category: "alaprajz", aspect: PLAN },
  { file: "HUllamTeljes_oldal_4.jpg", sheet: "É.A.04", title: "3. emeleti alaprajz", category: "alaprajz", aspect: PLAN },
  { file: "HUllamTeljes_oldal_5.jpg", sheet: "É.A.05", title: "4. emeleti alaprajz", category: "alaprajz", aspect: PLAN },

  { file: "HUllamTeljes_oldal_6.jpg", sheet: "É.A.06", title: "A–A metszet", category: "metszet", aspect: WIDE },
  { file: "HUllamTeljes_oldal_7.jpg", sheet: "É.A.07", title: "B–B metszet", category: "metszet", aspect: WIDE },
  { file: "HUllamTeljes_oldal_8.jpg", sheet: "É.A.08", title: "C–C metszet", category: "metszet", aspect: HALF },
  { file: "HUllamTeljes_oldal_9.jpg", sheet: "É.A.09", title: "D–D metszet", category: "metszet", aspect: HALF },

  { file: "HUllamTeljes_oldal_10.jpg", sheet: "É.A.10", title: "Déli homlokzat", category: "homlokzat", aspect: WIDE },
  { file: "HUllamTeljes_oldal_11.jpg", sheet: "É.A.11", title: "Északi homlokzat", category: "homlokzat", aspect: WIDE },
  { file: "HUllamTeljes_oldal_12.jpg", sheet: "É.A.12", title: "Keleti homlokzat", category: "homlokzat", aspect: HALF },
  { file: "HUllamTeljes_oldal_13.jpg", sheet: "É.A.13", title: "Nyugati homlokzat", category: "homlokzat", aspect: HALF },
  {
    file: "HUllamTeljes_oldal_14.jpg",
    sheet: "É.A.14",
    title: "„A” épületrész nyugati homlokzat",
    category: "homlokzat",
    aspect: HALF,
  },
  {
    file: "HUllamTeljes_oldal_15.jpg",
    sheet: "É.A.15",
    title: "„B” épületrész keleti homlokzat",
    category: "homlokzat",
    aspect: HALF,
  },
];

/** Every sheet is drawn to the same scale, so it lives here rather than per row. */
export const DRAWING_SCALE = "M 1:100";

export const PROJECT = {
  name: "Lelle Wave Residence",
  documentTitle: "Építési engedélyezési tervdokumentáció",
  address: "8638 Balatonlelle, Hullám utca — hrsz. 5143/6",
  date: "2022. február",
  siteUrl: "https://lellewave.hu",
} as const;

const DIACRITICS: Record<string, string> = {
  á: "a", é: "e", í: "i", ó: "o", ö: "o", ő: "o", ú: "u", ü: "u", ű: "u",
  Á: "A", É: "E", Í: "I", Ó: "O", Ö: "O", Ő: "O", Ú: "U", Ü: "U", Ű: "U",
};

/** ASCII, hyphenated file name — some browsers and mail clients mangle the rest. */
export function downloadName(drawing: Drawing): string {
  const slug = `${drawing.sheet} ${drawing.title}`
    .replace(/[áéíóöőúüűÁÉÍÓÖŐÚÜŰ]/g, (c) => DIACRITICS[c] ?? c)
    .replace(/[„”"']/g, "")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `LelleWave_${slug}.jpg`;
}

export function naturalCompare(a: string, b: string): number {
  return a.localeCompare(b, "hu", { numeric: true, sensitivity: "base" });
}

/** Fallback for a file uploaded after this build — readable, if not curated. */
export function deriveDrawing(file: string): Drawing {
  const base = file.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
  return {
    file,
    sheet: "—",
    title: base.charAt(0).toUpperCase() + base.slice(1),
    category: "egyeb",
    aspect: PLAN,
  };
}

/** Stable, URL-safe id used for deep links (`#e-a-02`). */
export function drawingId(drawing: Drawing, index: number): string {
  if (drawing.sheet === "—") return `lap-${index + 1}`;
  const base = drawing.sheet.replace(/[^A-Za-zÁÉÍÓÖŐÚÜŰ0-9]+/g, "-")
    .replace(/[áéíóöőúüűÁÉÍÓÖŐÚÜŰ]/g, (c) => DIACRITICS[c] ?? c)
    .toLowerCase()
    .replace(/^-+|-+$/g, "");
  return drawing.note ? `${base}-${index + 1}` : base;
}
