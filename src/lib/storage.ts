/**
 * Thin wrapper over Supabase Storage's public HTTP endpoints.
 *
 * The generated `@/integrations/supabase/client` pulls in auth, realtime and
 * postgrest for what is, here, three URL shapes and one list call — and its
 * `persistSession` option writes to localStorage on a page we hand to
 * prospects. Plain fetch keeps the bundle small and the page storage-free.
 */

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ?? "https://fdenrfcugyevyfvznevo.supabase.co";

/** Publishable anon key — the bucket is public, this grants read only. */
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkZW5yZmN1Z3lldnlmdnpuZXZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyNDI1NjQsImV4cCI6MjA4ODgxODU2NH0.rvSjos965bHvuzdh9zoHEmuJJ9DUbdrHk5mB-_CUz_g";

const BUCKET = "floorplans";
const STORAGE = `${SUPABASE_URL}/storage/v1`;

/** Supabase refuses to render above this width — asking for more silently caps. */
export const MAX_RENDER_WIDTH = 3000;

/** The originals are 8503 × 5051 (2–11 MB). Only the download link should touch them. */
export function originalUrl(file: string): string {
  return `${STORAGE}/object/public/${BUCKET}/${encodeURIComponent(file)}`;
}

/**
 * Original file served with `Content-Disposition: attachment`, so a plain
 * anchor saves it — no need to pull 10 MB through JS and build a blob URL.
 */
export function downloadUrl(file: string, saveAs: string): string {
  return `${originalUrl(file)}?download=${encodeURIComponent(saveAs)}`;
}

/** Server-side resize. Cheap, cached for an hour, and CORS-open. */
export function renderUrl(file: string, width: number, quality = 78): string {
  const w = Math.min(Math.round(width), MAX_RENDER_WIDTH);
  return `${STORAGE}/render/image/public/${BUCKET}/${encodeURIComponent(
    file,
  )}?width=${w}&resize=contain&quality=${quality}`;
}

/** Candidate widths for the main stage; the browser picks by viewport × DPR. */
export const STAGE_WIDTHS = [640, 960, 1280, 1600, 2000, 2500] as const;

export const THUMB_WIDTH = 240;
export const LIGHTBOX_WIDTH = 2500;

export function stageSrcSet(file: string): string {
  return STAGE_WIDTHS.map((w) => `${renderUrl(file, w, w >= 1600 ? 80 : 74)} ${w}w`).join(", ");
}

export function thumbUrl(file: string): string {
  return renderUrl(file, THUMB_WIDTH, 70);
}

export function lightboxUrl(file: string): string {
  return renderUrl(file, LIGHTBOX_WIDTH, 82);
}

/**
 * Names of every image in the bucket, so drawings uploaded after this build
 * still show up. Rejects rather than returning a partial list — callers fall
 * back to the static manifest.
 */
export async function listBucket(signal?: AbortSignal): Promise<string[]> {
  const res = await fetch(`${STORAGE}/object/list/${BUCKET}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      prefix: "",
      limit: 200,
      sortBy: { column: "name", order: "asc" },
    }),
    signal,
  });
  if (!res.ok) throw new Error(`Storage list failed: ${res.status}`);
  const json: unknown = await res.json();
  if (!Array.isArray(json)) throw new Error("Storage list returned an unexpected shape");
  return json
    .map((entry) => (entry as { name?: unknown }).name)
    .filter((name): name is string => typeof name === "string" && /\.(jpe?g|png|webp)$/i.test(name));
}
