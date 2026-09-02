import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Download, X, ZoomIn, ZoomOut, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ImageItem {
  thumbnailUrl: string;
  previewUrl: string;
  fullUrl: string;
  title: string;
  filename: string;
}

function naturalSort(a: string, b: string) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

function titleFromIndex(index: number): string {
  if (index <= 1) return "Földszint";
  if (index === 2) return "1. emelet";
  if (index === 3) return "2. emelet";
  if (index === 4) return "3. emelet";
  if (index === 5) return "4. emelet";
  return "Metszet";
}

export default function ImageGallery() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const thumbRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);

  // Fetch images from Supabase Storage
  useEffect(() => {
    async function fetchImages() {
      const { data, error } = await supabase.storage.from("floorplans").list("", {
        limit: 200,
        sortBy: { column: "name", order: "asc" },
      });
      if (error || !data) {
        setLoading(false);
        return;
      }
      const files = data
        .filter((f) => f.name.match(/\.(jpg|jpeg|png|webp)$/i))
        .sort((a, b) => naturalSort(a.name, b.name))
        .map((f, index) => {
          const fullUrl = supabase.storage.from("floorplans").getPublicUrl(f.name).data.publicUrl;
          const previewUrl = supabase.storage.from("floorplans").getPublicUrl(f.name, {
            transform: { width: 800, resize: "contain" },
          }).data.publicUrl;
          const thumbnailUrl = supabase.storage.from("floorplans").getPublicUrl(f.name, {
            transform: { width: 200, resize: "contain" },
          }).data.publicUrl;
          return {
            fullUrl,
            previewUrl,
            thumbnailUrl,
            title: titleFromIndex(index),
            filename: f.name,
          };
        });
      setImages(files);
      setLoading(false);
    }
    fetchImages();
  }, []);

  const current = images[activeIndex];

  const goTo = useCallback((i: number) => {
    setActiveIndex(i);
  }, []);

  const setZoomSafe = useCallback((updater: number | ((z: number) => number)) => {
    setZoom((z) => {
      const next = typeof updater === "function" ? updater(z) : updater;
      const clamped = Math.max(0.5, Math.min(5, next));
      if (clamped <= 1) setPan({ x: 0, y: 0 });
      return clamped;
    });
  }, []);

  const goPrev = useCallback(() => {
    setActiveIndex((i) => (i > 0 ? i - 1 : images.length - 1));
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [images.length]);

  const goNext = useCallback(() => {
    setActiveIndex((i) => (i < images.length - 1 ? i + 1 : 0));
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [images.length]);

  // Keyboard nav
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "Escape" && lightboxOpen) setLightboxOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goPrev, goNext, lightboxOpen]);

  // Scroll thumbnail into view
  useEffect(() => {
    if (thumbRef.current) {
      const thumb = thumbRef.current.children[activeIndex] as HTMLElement;
      thumb?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [activeIndex]);

  // Touch swipe on main image
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      diff > 0 ? goNext() : goPrev();
    }
  };

  const openLightbox = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setLightboxOpen(true);
  };

  const handleDownload = async () => {
    const response = await fetch(current.fullUrl);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = current.fullUrl.split("/").pop() || "image.jpg";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Lightbox zoom & pan
  const handleLightboxWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoomSafe((z) => z - e.deltaY * 0.002);
  };

  const handleLightboxPointerDown = (e: React.PointerEvent) => {
    if (zoom > 1) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleLightboxPointerMove = (e: React.PointerEvent) => {
    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    }
  };

  const handleLightboxPointerUp = () => {
    setIsPanning(false);
  };

  // Pinch-to-zoom state
  const lastPinchDist = useRef(0);
  const handleLightboxTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastPinchDist.current = Math.sqrt(dx * dx + dy * dy);
    }
  };
  const handleLightboxTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (lastPinchDist.current > 0) {
        const scale = dist / lastPinchDist.current;
        setZoomSafe((z) => z * scale);
      }
      lastPinchDist.current = dist;
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-5xl mx-auto px-4 flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!images.length || !current) {
    return (
      <div className="w-full max-w-5xl mx-auto px-4 text-center py-20 text-muted-foreground">
        Nincsenek képek a galériában.
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4">
      {/* Main Image */}
      <div
        className="relative w-full aspect-[4/3] bg-card rounded-lg overflow-hidden cursor-pointer group"
        onClick={openLightbox}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <img
          src={current.previewUrl}
          alt={current.title}
          className="w-full h-full object-contain transition-transform duration-300"
        />
        {/* Overlay hint */}
        <div className="absolute inset-0 bg-background/0 group-hover:bg-background/20 transition-colors flex items-center justify-center">
          <ZoomIn className="w-10 h-10 text-primary opacity-0 group-hover:opacity-80 transition-opacity" />
        </div>
        {/* Nav arrows */}
        <button
          onClick={(e) => { e.stopPropagation(); goPrev(); }}
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/70 hover:bg-background/90 text-primary rounded-full p-2 transition-colors"
          aria-label="Előző kép"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); goNext(); }}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/70 hover:bg-background/90 text-primary rounded-full p-2 transition-colors"
          aria-label="Következő kép"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Title + Download */}
      <div className="flex items-center justify-between mt-3 mb-4">
        <p className="text-foreground font-display text-lg">{current.title}</p>
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Letöltés</span>
        </button>
      </div>

      {/* Counter */}
      <p className="text-muted-foreground text-sm text-center mb-3">
        {activeIndex + 1} / {images.length}
      </p>

      {/* Thumbnails */}
      <div
        ref={thumbRef}
        className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin"
        style={{ scrollbarColor: "hsl(var(--primary)) transparent" }}
      >
        {images.map((img, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`flex-shrink-0 w-20 h-16 sm:w-28 sm:h-20 rounded overflow-hidden border-2 transition-all ${
              i === activeIndex
                ? "border-primary shadow-lg shadow-primary/20"
                : "border-border opacity-60 hover:opacity-100"
            }`}
          >
            <img src={img.thumbnailUrl} alt={img.title} className="w-full h-full object-cover" />
          </button>
        ))}
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-background/95 flex flex-col items-center justify-center"
          onWheel={handleLightboxWheel}
          onPointerDown={handleLightboxPointerDown}
          onPointerMove={handleLightboxPointerMove}
          onPointerUp={handleLightboxPointerUp}
          onTouchStart={handleLightboxTouchStart}
          onTouchMove={handleLightboxTouchMove}
        >
          {/* Top bar */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 z-10">
            <span className="text-foreground font-display text-sm sm:text-base">
              {current.title} ({activeIndex + 1}/{images.length})
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setZoomSafe((z) => z + 0.5)}
                className="text-primary hover:text-primary/80 transition-colors"
                aria-label="Nagyítás"
              >
                <ZoomIn className="w-5 h-5" />
              </button>
              <button
                onClick={() => setZoomSafe((z) => z - 0.5)}
                className="text-primary hover:text-primary/80 transition-colors"
                aria-label="Kicsinyítés"
              >
                <ZoomOut className="w-5 h-5" />
              </button>
              <button
                onClick={handleDownload}
                className="text-primary hover:text-primary/80 transition-colors"
                aria-label="Letöltés"
              >
                <Download className="w-5 h-5" />
              </button>
              <button
                onClick={() => setLightboxOpen(false)}
                className="text-foreground hover:text-primary transition-colors"
                aria-label="Bezárás"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Image */}
          <img
            src={current.fullUrl}
            alt={current.title}
            className="max-w-[95vw] max-h-[85vh] object-contain select-none"
            style={{
              transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
              cursor: zoom > 1 ? "grab" : "default",
              transition: isPanning ? "none" : "transform 0.2s",
            }}
            draggable={false}
          />

          {/* Nav arrows */}
          <button
            onClick={goPrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-card/80 hover:bg-card text-primary rounded-full p-2 transition-colors"
            aria-label="Előző kép"
          >
            <ChevronLeft className="w-7 h-7" />
          </button>
          <button
            onClick={goNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-card/80 hover:bg-card text-primary rounded-full p-2 transition-colors"
            aria-label="Következő kép"
          >
            <ChevronRight className="w-7 h-7" />
          </button>
        </div>
      )}
    </div>
  );
}
