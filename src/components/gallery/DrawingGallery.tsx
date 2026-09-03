import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, Maximize2 } from "lucide-react";
import {
  DRAWINGS,
  DRAWING_SCALE,
  downloadName,
  drawingId,
  type Drawing,
} from "@/data/drawings";
import { downloadUrl } from "@/lib/storage";
import { useDrawings } from "@/hooks/useDrawings";
import { CategoryTabs, type Filter } from "./CategoryTabs";
import { Lightbox } from "./Lightbox";
import { Stage } from "./Stage";
import { ThumbRail } from "./ThumbRail";

/** `#e-a-04` in the address bar, so a single sheet can be linked directly. */
function fileFromHash(drawings: Drawing[]): string | undefined {
  if (typeof window === "undefined") return undefined;
  const hash = decodeURIComponent(window.location.hash.replace(/^#/, "")).toLowerCase();
  if (!hash) return undefined;
  return drawings.find((drawing, index) => drawingId(drawing, index) === hash)?.file;
}

export function DrawingGallery() {
  const drawings = useDrawings();
  const [filter, setFilter] = useState<Filter>("all");
  const [activeFile, setActiveFile] = useState(() => fileFromHash(DRAWINGS) ?? DRAWINGS[0].file);
  const [viewerOpen, setViewerOpen] = useState(false);

  const visible = useMemo(
    () => (filter === "all" ? drawings : drawings.filter((d) => d.category === filter)),
    [drawings, filter],
  );

  const index = Math.max(
    0,
    visible.findIndex((drawing) => drawing.file === activeFile),
  );
  const current = visible[index];

  const step = useCallback(
    (delta: number) => {
      if (visible.length < 2) return;
      const next = (index + delta + visible.length) % visible.length;
      setActiveFile(visible[next].file);
    },
    [index, visible],
  );

  const changeFilter = (next: Filter) => {
    setFilter(next);
    const pool = next === "all" ? drawings : drawings.filter((d) => d.category === next);
    // Keep the sheet on screen if it survives the filter; otherwise start over.
    if (pool.length && !pool.some((drawing) => drawing.file === activeFile)) {
      setActiveFile(pool[0].file);
    }
  };

  // Reflect the active sheet in the URL without pushing history entries, so
  // Back still leaves the page rather than walking the carousel backwards.
  useEffect(() => {
    if (!current) return;
    const id = drawingId(current, drawings.indexOf(current));
    if (window.location.hash === `#${id}`) return;
    window.history.replaceState(null, "", `#${id}`);
  }, [current, drawings]);

  useEffect(() => {
    const onHashChange = () => {
      const file = fileFromHash(drawings);
      if (file) setActiveFile(file);
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [drawings]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key === "ArrowLeft") step(-1);
      else if (event.key === "ArrowRight") step(1);
      else if (event.key === "Enter" && !viewerOpen && document.activeElement === document.body) {
        setViewerOpen(true);
      } else return;
      event.preventDefault();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [step, viewerOpen]);

  const neighbours = useMemo(() => {
    if (visible.length < 2) return [];
    const around = [visible[(index + 1) % visible.length], visible[(index - 1 + visible.length) % visible.length]];
    return around.filter((drawing, i, list) => drawing !== current && list.indexOf(drawing) === i);
  }, [current, index, visible]);

  if (!current) {
    return (
      <p className="border border-border bg-card px-6 py-16 text-center text-sm text-muted-foreground">
        Ebben a csoportban nincs tervlap.
      </p>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <CategoryTabs drawings={drawings} value={filter} onChange={changeFilter} />

      <div className="space-y-4">
        <Stage
          drawing={current}
          neighbours={neighbours}
          canNavigate={visible.length > 1}
          onOpen={() => setViewerOpen(true)}
          onPrev={() => step(-1)}
          onNext={() => step(1)}
        />

        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <div className="min-w-0">
            <h2 className="font-display text-xl text-foreground sm:text-2xl">{current.title}</h2>
            <p className="label-caps mt-1.5 text-muted-foreground">
              <span className="text-primary">{current.sheet}</span>
              <span className="mx-2 text-border">/</span>
              {DRAWING_SCALE}
              {current.note && (
                <>
                  <span className="mx-2 text-border">/</span>
                  {current.note}
                </>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <span className="label-caps hidden tabular-nums text-muted-foreground sm:inline">
              {index + 1} / {visible.length}
            </span>
            <button
              type="button"
              onClick={() => setViewerOpen(true)}
              className="label-caps flex items-center gap-2 border border-border bg-card px-3.5 py-2.5 text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              Teljes méret
            </button>
            <a
              href={downloadUrl(current.file, downloadName(current))}
              rel="noopener"
              className="label-caps flex items-center gap-2 border border-primary bg-primary px-3.5 py-2.5 text-primary-foreground transition-colors hover:bg-primary/85"
            >
              <Download className="h-3.5 w-3.5" />
              Letöltés
            </a>
          </div>
        </div>
      </div>

      <ThumbRail drawings={visible} activeFile={current.file} onSelect={setActiveFile} />

      {viewerOpen && (
        <Lightbox
          drawing={current}
          position={index + 1}
          total={visible.length}
          onClose={() => setViewerOpen(false)}
          onPrev={() => step(-1)}
          onNext={() => step(1)}
        />
      )}
    </div>
  );
}
