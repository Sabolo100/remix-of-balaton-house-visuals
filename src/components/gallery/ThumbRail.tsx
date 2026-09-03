import { useEffect, useRef } from "react";
import type { Drawing } from "@/data/drawings";
import { thumbUrl } from "@/lib/storage";
import { cn } from "@/lib/utils";

interface ThumbRailProps {
  drawings: Drawing[];
  activeFile: string;
  onSelect: (file: string) => void;
}

export function ThumbRail({ drawings, activeFile, onSelect }: ThumbRailProps) {
  const railRef = useRef<HTMLDivElement>(null);
  const activeIndex = drawings.findIndex((drawing) => drawing.file === activeFile);

  // Centre the active thumbnail. scrollIntoView would drag the whole page
  // along with it, so nudge the rail's own scroll offset instead.
  useEffect(() => {
    const rail = railRef.current;
    const thumb = rail?.children[activeIndex] as HTMLElement | undefined;
    if (!rail || !thumb) return;

    const target = thumb.offsetLeft - (rail.clientWidth - thumb.clientWidth) / 2;
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    rail.scrollTo({ left: Math.max(0, target), behavior: smooth ? "smooth" : "auto" });
  }, [activeIndex]);

  return (
    <div className="relative">
      <div
        ref={railRef}
        role="tablist"
        aria-label="Tervlapok"
        className="rail relative flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 sm:gap-3"
      >
        {drawings.map((drawing) => {
          const active = drawing.file === activeFile;
          return (
            <button
              key={drawing.file}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onSelect(drawing.file)}
              title={`${drawing.sheet} — ${drawing.title}`}
              className={cn(
                "group flex shrink-0 snap-center flex-col gap-1.5 focus-visible:outline-none",
                "w-[5.5rem] sm:w-[7.25rem]",
              )}
            >
              <span
                className={cn(
                  "relative block aspect-[4/3] w-full overflow-hidden border bg-stage transition-all duration-200",
                  active
                    ? "border-primary shadow-lift"
                    : "border-border opacity-70 group-hover:opacity-100 group-focus-visible:opacity-100 group-hover:border-primary/50",
                )}
              >
                {/* contain, not cover: these sheets differ at their edges, and
                    a cropped centre makes all sixteen look identical. */}
                <img
                  src={thumbUrl(drawing.file)}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-contain p-1"
                />
              </span>
              <span
                className={cn(
                  "label-caps truncate text-[0.58rem] transition-colors sm:text-[0.62rem]",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                {drawing.sheet}
              </span>
            </button>
          );
        })}
      </div>

      {/* Soften the cut-off so the rail reads as scrollable. */}
      <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-background to-transparent" />
    </div>
  );
}
