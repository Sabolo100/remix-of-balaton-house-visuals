import { useEffect, useState } from "react";
import { DRAWINGS, deriveDrawing, naturalCompare, type Drawing } from "@/data/drawings";
import { listBucket } from "@/lib/storage";

/**
 * The curated manifest, rendered immediately — no spinner, and no request in
 * front of the first drawing — then reconciled against the bucket in the
 * background so sheets uploaded after this build still appear.
 *
 * A failed or empty listing leaves the manifest untouched: a network hiccup
 * must never blank the page.
 */
export function useDrawings(): Drawing[] {
  const [drawings, setDrawings] = useState<Drawing[]>(DRAWINGS);

  useEffect(() => {
    const controller = new AbortController();

    listBucket(controller.signal)
      .then((names) => {
        const present = new Set(names);
        const curated = new Set(DRAWINGS.map((d) => d.file));

        const kept = DRAWINGS.filter((d) => present.has(d.file));
        const extra = names
          .filter((name) => !curated.has(name))
          .sort(naturalCompare)
          .map(deriveDrawing);

        if (kept.length === 0 && extra.length === 0) return;
        const next = [...kept, ...extra];
        setDrawings((prev) => (sameFiles(prev, next) ? prev : next));
      })
      .catch(() => {
        // Offline, or listing blocked — the manifest is a good enough answer.
      });

    return () => controller.abort();
  }, []);

  return drawings;
}

function sameFiles(a: Drawing[], b: Drawing[]): boolean {
  return a.length === b.length && a.every((drawing, i) => drawing.file === b[i].file);
}
