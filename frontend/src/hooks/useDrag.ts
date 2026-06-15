import { useRef, useCallback, useEffect } from "react";

interface UseSmoothDragOptions {
  onDragEnd?: (dx: number, dy: number) => void;
  friction?: number; // 0–1, default 0.88
}

/**
 * Smooth inertia-based horizontal drag scroll for kanban boards.
 * Attach containerRef to the scrollable element.
 * Uses rAF-based mouse tracking for smooth 60fps cursor response.
 */
export function useSmoothDrag({ friction = 0.88 }: UseSmoothDragOptions = {}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const state = useRef({
    isDragging: false,
    startX: 0,
    startScrollLeft: 0,
    velX: 0,
    lastX: 0,
    lastTime: 0,
    rafId: 0,
    // rAF-based move tracking
    pendingX: 0,
    hasPendingMove: false,
    moveRafId: 0,
  });

  const applyInertia = useCallback(() => {
    const el = containerRef.current;
    const s = state.current;
    if (!el || Math.abs(s.velX) < 0.3) {
      s.velX = 0;
      return;
    }
    el.scrollLeft -= s.velX;
    s.velX *= friction;
    s.rafId = requestAnimationFrame(applyInertia);
  }, [friction]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      const s = state.current;
      s.isDragging = true;
      s.startX = e.clientX;
      s.startScrollLeft = el.scrollLeft;
      s.velX = 0;
      s.lastX = e.clientX;
      s.lastTime = performance.now();
      cancelAnimationFrame(s.rafId);
      cancelAnimationFrame(s.moveRafId);
      el.style.cursor = "grabbing";
      el.style.userSelect = "none";
      e.preventDefault();
    };

    // Use rAF for mousemove to decouple from browser paint cycle → smoother
    const applyMove = () => {
      const s = state.current;
      const elRef = containerRef.current;
      if (!elRef || !s.isDragging || !s.hasPendingMove) return;
      s.hasPendingMove = false;

      const now = performance.now();
      const dx = s.pendingX - s.startX;
      elRef.scrollLeft = s.startScrollLeft - dx;

      const dt = now - s.lastTime;
      if (dt > 0) {
        // Smooth velocity with exponential moving average
        const rawVel = (s.lastX - s.pendingX) / dt * 16;
        s.velX = s.velX * 0.4 + rawVel * 0.6;
      }
      s.lastX = s.pendingX;
      s.lastTime = now;
    };

    const onMouseMove = (e: MouseEvent) => {
      const s = state.current;
      if (!s.isDragging) return;
      s.pendingX = e.clientX;
      if (!s.hasPendingMove) {
        s.hasPendingMove = true;
        s.moveRafId = requestAnimationFrame(applyMove);
      }
    };

    const onMouseUp = () => {
      const s = state.current;
      if (!s.isDragging) return;
      s.isDragging = false;
      s.hasPendingMove = false;
      cancelAnimationFrame(s.moveRafId);
      el.style.cursor = "";
      el.style.userSelect = "";
      s.rafId = requestAnimationFrame(applyInertia);
    };

    const onTouchStart = (e: TouchEvent) => {
      const s = state.current;
      const touch = e.touches[0];
      s.isDragging = true;
      s.startX = touch.clientX;
      s.startScrollLeft = el.scrollLeft;
      s.velX = 0;
      s.lastX = touch.clientX;
      s.lastTime = performance.now();
      cancelAnimationFrame(s.rafId);
    };

    const onTouchMove = (e: TouchEvent) => {
      const s = state.current;
      if (!s.isDragging) return;
      const touch = e.touches[0];
      const now = performance.now();
      const dx = touch.clientX - s.startX;
      el.scrollLeft = s.startScrollLeft - dx;
      const dt = now - s.lastTime;
      if (dt > 0) {
        const rawVel = (s.lastX - touch.clientX) / dt * 16;
        s.velX = s.velX * 0.4 + rawVel * 0.6;
      }
      s.lastX = touch.clientX;
      s.lastTime = now;
    };

    const onTouchEnd = () => {
      state.current.isDragging = false;
      state.current.rafId = requestAnimationFrame(applyInertia);
    };

    // Smooth wheel scroll (horizontal)
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        e.preventDefault();
        el.scrollLeft += e.deltaX;
      } else if (e.shiftKey) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };

    el.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: true });
    el.addEventListener("touchend", onTouchEnd);
    el.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      el.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("wheel", onWheel);
      cancelAnimationFrame(state.current.rafId);
      cancelAnimationFrame(state.current.moveRafId);
    };
  }, [applyInertia]);

  return { containerRef };
}
