import { useState } from "react";
import { ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import type { Drawing } from "@/data/drawings";
import { stageSrcSet, thumbUrl } from "@/lib/storage";
import { cn } from "@/lib/utils";

/**
 * How wide the stage actually renders. The browser resolves `srcset` against
 * this, so it must track the layout in Index.tsx — otherwise it either fetches
 * a sheet too small to read or wastes megabytes on one nobody can see.
 */
const STAGE_SIZES = "(min-width: 1240px) 1176px, (min-width: 640px) calc(100vw - 4rem), 100vw";

/**
 * The stage image is the page's LCP. React 18 does not know the camelCase
 * `fetchPriority` prop, so pass the DOM attribute through as-is.
 */
const HIGH_PRIORITY = { fetchpriority: "high" } as React.ImgHTMLAttributes<HTMLImageElement>;

interface StageProps {
  drawing: Drawing;
  /** Rendered off-screen so the very next sheet is already in cache. */
  neighbours: Drawing[];
  onOpen: () => void;
  onPrev: () => void;
  onNext: () => void;
  canNavigate: boolean;
}

export function Stage({ drawing, neighbours, onOpen, onPrev, onNext, canNavigate }: StageProps) {
  return (
    <figure className="relative">
      <div
        className="group relative w-full overflow-hidden border border-border bg-stage shadow-sheet"
        style={{ aspectRatio: drawing.aspect, maxHeight: "min(74vh, 720px)" }}
      >
        <StageImage key={drawing.file} drawing={drawing} onOpen={onOpen} />

        {canNavigate && (
          <>
            <StageArrow side="left" label="Előző tervlap" onClick={onPrev} />
            <StageArrow side="right" label="Következő tervlap" onClick={onNext} />
          </>
        )}
      </div>

      {/* Same srcset and sizes as the stage, so the browser caches the exact
          candidate it will need when the visitor steps to the next sheet. */}
      <div aria-hidden className="pointer-events-none absolute h-px w-px overflow-hidden opacity-0">
        {neighbours.map((next) => (
          <img
            key={next.file}
            src={thumbUrl(next.file)}
            srcSet={stageSrcSet(next.file)}
            sizes={STAGE_SIZES}
            alt=""
            decoding="async"
          />
        ))}
      </div>
    </figure>
  );
}

function StageImage({ drawing, onOpen }: { drawing: Drawing; onOpen: () => void }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`${drawing.title} megnyitása teljes méretben`}
      className="absolute inset-0 block h-full w-full cursor-zoom-in"
    >
      {/* The thumbnail is already in cache from the rail, so it paints at once
          and the sheet resolves into focus rather than popping in. */}
      <img
        src={thumbUrl(drawing.file)}
        alt=""
        aria-hidden
        className={cn(
          "absolute inset-0 h-full w-full scale-105 object-contain blur-md transition-opacity duration-500",
          loaded ? "opacity-0" : "opacity-100",
        )}
      />

      <img
        src={thumbUrl(drawing.file)}
        srcSet={stageSrcSet(drawing.file)}
        sizes={STAGE_SIZES}
        alt={`${drawing.title} – ${drawing.sheet}`}
        onLoad={() => setLoaded(true)}
        decoding="async"
        {...HIGH_PRIORITY}
        className={cn(
          "absolute inset-0 h-full w-full object-contain transition-opacity duration-500",
          loaded ? "opacity-100" : "opacity-0",
        )}
      />

      {/* Always visible where there is no hover to reveal it — on a phone the
          sheet is small, so the way out of it has to be obvious. */}
      <span className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-2 border border-border bg-stage/90 px-3 py-1.5 text-[0.7rem] font-medium tracking-wide text-foreground shadow-sheet backdrop-blur-sm transition-opacity duration-200 sm:bottom-4 sm:right-4 sm:opacity-0 sm:group-hover:opacity-100">
        <Maximize2 className="h-3.5 w-3.5 text-primary" />
        Teljes méret
      </span>
    </button>
  );
}

function StageArrow({
  side,
  label,
  onClick,
}: {
  side: "left" | "right";
  label: string;
  onClick: () => void;
}) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "absolute top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center border border-border bg-stage/85 text-foreground shadow-sheet backdrop-blur-sm transition-all duration-200 hover:border-primary hover:bg-stage hover:text-primary sm:h-11 sm:w-11",
        side === "left" ? "left-2 sm:left-3" : "right-2 sm:right-3",
      )}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}
