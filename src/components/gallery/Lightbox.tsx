import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Minus,
  Plus,
  RotateCcw,
  RotateCw,
  X,
} from "lucide-react";
import { DRAWING_SCALE, downloadName, type Drawing } from "@/data/drawings";
import { downloadUrl, lightboxUrl, thumbUrl } from "@/lib/storage";
import { MIN_ZOOM, useZoomPan } from "@/hooks/useZoomPan";
import { cn } from "@/lib/utils";

interface LightboxProps {
  drawing: Drawing;
  position: number;
  total: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

export function Lightbox({ drawing, position, total, onClose, onPrev, onNext }: LightboxProps) {
  const [loaded, setLoaded] = useState(false);
  const [rotated, setRotated] = useState(false);
  const [box, setBox] = useState({ width: 0, height: 0 });
  const surfaceRef = useRef<HTMLDivElement>(null);
  const { zoom, offset, dragging, containerRef, contentRef, toggleZoom, zoomBy, reset, handlers } =
    useZoomPan({
      resetKey: `${drawing.file}|${rotated}`,
      rotated,
      onSwipe: (direction) => (direction === 1 ? onNext() : onPrev()),
    });

  useEffect(() => {
    setLoaded(false);
    setRotated(false);
  }, [drawing.file]);

  // The rotated sheet has to be sized against the box it sits in, so measure it.
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) =>
      setBox({ width: entry.contentRect.width, height: entry.contentRect.height }),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [containerRef]);

  // Keep the page behind from scrolling while the viewer owns the screen.
  useEffect(() => {
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      else if (event.key === "+" || event.key === "=") zoomBy(1.4);
      else if (event.key === "-" || event.key === "_") zoomBy(1 / 1.4);
      else if (event.key === "0") reset();
      else return;
      event.preventDefault();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, zoomBy, reset]);

  // Take focus for the duration, then hand it back to whatever opened us.
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    surfaceRef.current?.focus({ preventScroll: true });
    return () => opener?.focus?.({ preventScroll: true });
  }, []);

  const zoomed = zoom > MIN_ZOOM;

  // These sheets are wide; a phone held upright renders them a third of the
  // size they could be. Offer the turn only where it actually wins something.
  const fitted = Math.min(box.width, box.height * drawing.aspect);
  const fittedTurned = Math.min(box.height, box.width * drawing.aspect);
  const rotateHelps = box.width > 0 && fittedTurned > fitted * 1.15;

  // Rendered into <body>: as a child of the gallery it inherited a `space-y`
  // margin, which offset the "inset-0" overlay and left a strip of the page
  // showing through the top.
  return createPortal(
    <div
      ref={surfaceRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label={`${drawing.sheet} – ${drawing.title}`}
      className="fixed inset-0 z-50 flex animate-fade-in flex-col bg-overlay focus:outline-none"
    >
      <header className="relative z-10 flex items-start justify-between gap-3 px-4 pb-3 pt-[max(0.85rem,env(safe-area-inset-top))] sm:px-6 sm:pt-5">
        <div className="min-w-0">
          <p className="truncate font-display text-base text-white/95 sm:text-lg">{drawing.title}</p>
          <p className="label-caps mt-1 truncate text-[0.6rem] text-white/45">
            {drawing.sheet} · {DRAWING_SCALE} · {position} / {total}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {/* Phones pinch and double-tap instead — and the title needs the room. */}
          <div className="hidden items-center gap-2 sm:flex">
            <ViewerButton label="Kicsinyítés" onClick={() => zoomBy(1 / 1.4)} disabled={!zoomed}>
              <Minus className="h-4 w-4" />
            </ViewerButton>
            <ViewerButton label="Nagyítás" onClick={() => zoomBy(1.4)}>
              <Plus className="h-4 w-4" />
            </ViewerButton>
            <ViewerButton label="Nagyítás visszaállítása" onClick={reset} disabled={!zoomed}>
              <RotateCcw className="h-4 w-4" />
            </ViewerButton>
          </div>
          {(rotateHelps || rotated) && (
            <ViewerButton
              label={rotated ? "Tervlap visszaforgatása" : "Tervlap elforgatása – így nagyobb"}
              onClick={() => setRotated((value) => !value)}
              active={rotated}
            >
              <RotateCw className="h-4 w-4" />
            </ViewerButton>
          )}

          <a
            href={downloadUrl(drawing.file, downloadName(drawing))}
            rel="noopener"
            aria-label="Eredeti felbontású kép letöltése"
            className="ml-1 grid h-9 w-9 place-items-center border border-primary/60 bg-primary/90 text-primary-foreground transition-colors hover:bg-primary sm:h-10 sm:w-auto sm:gap-2 sm:px-4"
          >
            <Download className="h-4 w-4" />
            <span className="label-caps hidden sm:inline">Letöltés</span>
          </a>

          <ViewerButton label="Bezárás" onClick={onClose}>
            <X className="h-5 w-5" />
          </ViewerButton>
        </div>
      </header>

      <div
        ref={containerRef}
        {...handlers}
        onDoubleClick={(event) => toggleZoom({ x: event.clientX, y: event.clientY })}
        className={cn(
          "relative flex flex-1 select-none items-center justify-center overflow-hidden px-2 sm:px-14",
          zoomed ? (dragging ? "cursor-grabbing" : "cursor-grab") : "cursor-zoom-in",
        )}
        style={{ touchAction: "none" }}
      >
        {!loaded && (
          <img
            src={thumbUrl(drawing.file)}
            alt=""
            aria-hidden
            className="max-h-full max-w-full object-contain opacity-40 blur-lg"
          />
        )}

        <img
          key={drawing.file}
          ref={contentRef}
          src={lightboxUrl(drawing.file)}
          alt={`${drawing.title} – ${drawing.sheet}`}
          onLoad={() => setLoaded(true)}
          draggable={false}
          decoding="async"
          className={cn("shrink-0 object-contain", loaded ? "opacity-100" : "absolute opacity-0")}
          style={{
            maxWidth: box.width ? (rotated ? box.height : box.width) : undefined,
            maxHeight: box.height ? (rotated ? box.width : box.height) : undefined,
            transform:
              `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${zoom})` +
              (rotated ? " rotate(90deg)" : ""),
            transition: dragging ? "none" : "transform 0.18s cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        />

        {!loaded && (
          <span className="label-caps absolute bottom-6 text-[0.6rem] text-white/50">
            Nagy felbontású tervlap betöltése…
          </span>
        )}

        <ViewerArrow side="left" label="Előző tervlap" onClick={onPrev} />
        <ViewerArrow side="right" label="Következő tervlap" onClick={onNext} />
      </div>

      <footer className="relative z-10 px-4 pb-[max(0.85rem,env(safe-area-inset-bottom))] pt-2 text-center sm:px-6 sm:pb-5">
        <p className="label-caps text-[0.58rem] text-white/35">
          {zoomed
            ? "Húzza a tervlapot a mozgatáshoz"
            : rotateHelps && !rotated
              ? "Forgassa el a tervlapot, így nagyobb — vagy koppintson duplán a nagyításhoz"
              : "Dupla koppintás vagy görgetés a nagyításhoz"}
        </p>
      </footer>
    </div>,
    document.body,
  );
}

function ViewerButton({
  label,
  onClick,
  disabled,
  active,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={cn(
        "grid h-9 w-9 place-items-center border transition-colors disabled:pointer-events-none disabled:opacity-25 sm:h-10 sm:w-10",
        active
          ? "border-primary bg-primary/20 text-primary"
          : "border-white/15 text-white/80 hover:border-white/40 hover:text-white",
      )}
    >
      {children}
    </button>
  );
}

function ViewerArrow({
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
        "absolute top-1/2 hidden h-12 w-12 -translate-y-1/2 place-items-center border border-white/15 text-white/70 transition-colors hover:border-white/40 hover:text-white sm:grid",
        side === "left" ? "left-2" : "right-2",
      )}
    >
      <Icon className="h-6 w-6" />
    </button>
  );
}
