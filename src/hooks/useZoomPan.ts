import { useCallback, useEffect, useRef, useState } from "react";

export const MIN_ZOOM = 1;
export const MAX_ZOOM = 6;
/** Where a double tap lands — close enough to read the 1:100 lettering. */
export const DOUBLE_TAP_ZOOM = 2.75;

const SWIPE_DISTANCE = 60;
const SWIPE_SLOPE = 1.2;

interface Options {
  /** Horizontal flick while the sheet is not zoomed in. */
  onSwipe?: (direction: 1 | -1) => void;
  /** Zoom and offset snap back whenever this changes (e.g. a new drawing). */
  resetKey: unknown;
  /** The sheet is drawn turned 90°, so its on-screen extents are swapped. */
  rotated?: boolean;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/**
 * Pinch / wheel / drag zooming for the full-screen viewer.
 *
 * The offset is kept in screen pixels and applied as `translate() scale()`, so
 * a drag moves the sheet exactly as far as the finger does, and it is clamped
 * to the scaled bounds so the drawing can never be flung out of view.
 */
export function useZoomPan({ onSwipe, resetKey, rotated = false }: Options) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLImageElement | null>(null);

  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);

  // Imperative listeners read these; state alone would go stale inside them.
  const zoomRef = useRef(zoom);
  const offsetRef = useRef(offset);
  zoomRef.current = zoom;
  offsetRef.current = offset;

  const clampOffset = useCallback(
    (next: { x: number; y: number }, scale: number) => {
      const content = contentRef.current;
      const container = containerRef.current;
      if (!content || !container) return { x: 0, y: 0 };
      // A rotated element keeps its layout box, so read the extents crosswise.
      const shownWidth = rotated ? content.offsetHeight : content.offsetWidth;
      const shownHeight = rotated ? content.offsetWidth : content.offsetHeight;
      const maxX = Math.max(0, (shownWidth * scale - container.clientWidth) / 2);
      const maxY = Math.max(0, (shownHeight * scale - container.clientHeight) / 2);
      return { x: clamp(next.x, -maxX, maxX), y: clamp(next.y, -maxY, maxY) };
    },
    [rotated],
  );

  /** Scale to `next`, keeping the point under the cursor or fingers in place. */
  const zoomAt = useCallback(
    (next: number, focus?: { x: number; y: number }) => {
      const container = containerRef.current;
      if (!container) return;
      const scale = clamp(next, MIN_ZOOM, MAX_ZOOM);

      if (scale <= MIN_ZOOM) {
        setZoom(MIN_ZOOM);
        setOffset({ x: 0, y: 0 });
        return;
      }

      const box = container.getBoundingClientRect();
      const originX = box.left + box.width / 2;
      const originY = box.top + box.height / 2;
      const focusX = focus ? focus.x : originX;
      const focusY = focus ? focus.y : originY;

      const current = zoomRef.current;
      const { x, y } = offsetRef.current;
      const anchorX = (focusX - originX - x) / current;
      const anchorY = (focusY - originY - y) / current;

      setZoom(scale);
      setOffset(
        clampOffset(
          { x: focusX - originX - anchorX * scale, y: focusY - originY - anchorY * scale },
          scale,
        ),
      );
    },
    [clampOffset],
  );

  const reset = useCallback(() => {
    setZoom(MIN_ZOOM);
    setOffset({ x: 0, y: 0 });
  }, []);

  const toggleZoom = useCallback(
    (focus?: { x: number; y: number }) => {
      zoomAt(zoomRef.current > MIN_ZOOM ? MIN_ZOOM : DOUBLE_TAP_ZOOM, focus);
    },
    [zoomAt],
  );

  useEffect(() => {
    reset();
  }, [resetKey, reset]);

  // Wheel and trackpad pinch. React's onWheel is passive, so preventDefault
  // there is a no-op and the whole page zooms underneath the viewer.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const step = event.ctrlKey ? 0.012 : 0.0035;
      zoomAt(zoomRef.current * Math.exp(-event.deltaY * step), {
        x: event.clientX,
        y: event.clientY,
      });
    };

    container.addEventListener("wheel", onWheel, { passive: false });
    return () => container.removeEventListener("wheel", onWheel);
  }, [zoomAt]);

  // One pointer drags (or, unzoomed, flicks to the next sheet); two pinch.
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const dragStart = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 });
  const pinchStart = useRef({ distance: 0, zoom: 1 });

  const spread = () => {
    const points = [...pointers.current.values()];
    return Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
  };
  const midpoint = () => {
    const points = [...pointers.current.values()];
    return { x: (points[0].x + points[1].x) / 2, y: (points[0].y + points[1].y) / 2 };
  };

  const onPointerDown = (event: React.PointerEvent) => {
    (event.target as Element).setPointerCapture?.(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pointers.current.size === 1) {
      dragStart.current = {
        x: event.clientX,
        y: event.clientY,
        offsetX: offsetRef.current.x,
        offsetY: offsetRef.current.y,
      };
      setDragging(true);
    } else if (pointers.current.size === 2) {
      pinchStart.current = { distance: spread(), zoom: zoomRef.current };
    }
  };

  const onPointerMove = (event: React.PointerEvent) => {
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pointers.current.size >= 2) {
      const distance = spread();
      if (pinchStart.current.distance > 0) {
        zoomAt(pinchStart.current.zoom * (distance / pinchStart.current.distance), midpoint());
      }
      return;
    }

    if (zoomRef.current <= MIN_ZOOM) return; // unzoomed, so the gesture is a swipe
    const { x, y, offsetX, offsetY } = dragStart.current;
    setOffset(
      clampOffset(
        { x: offsetX + (event.clientX - x), y: offsetY + (event.clientY - y) },
        zoomRef.current,
      ),
    );
  };

  const endPointer = (event: React.PointerEvent) => {
    const tracked = pointers.current.has(event.pointerId);
    const wasLastOne = pointers.current.size === 1;
    pointers.current.delete(event.pointerId);

    if (pointers.current.size < 2) pinchStart.current = { distance: 0, zoom: zoomRef.current };
    if (pointers.current.size === 0) setDragging(false);

    if (!tracked || !wasLastOne || zoomRef.current > MIN_ZOOM) return;
    const dx = event.clientX - dragStart.current.x;
    const dy = event.clientY - dragStart.current.y;
    if (Math.abs(dx) > SWIPE_DISTANCE && Math.abs(dx) > Math.abs(dy) * SWIPE_SLOPE) {
      onSwipe?.(dx < 0 ? 1 : -1);
    }
  };

  return {
    zoom,
    offset,
    dragging,
    containerRef,
    contentRef,
    zoomAt,
    toggleZoom,
    reset,
    zoomBy: (factor: number) => zoomAt(zoomRef.current * factor),
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endPointer,
      onPointerCancel: endPointer,
    },
  };
}
