import { useEffect, useRef } from "react";

/**
 * Glowing white cursor dot + a smooth trailing aura ring.
 * - The dot tracks the pointer 1:1 (instant).
 * - The ring lerps toward the pointer for a magnetic trailing feel.
 * - Scales up when hovering elements marked [data-cursor="hover"] or interactive.
 * Runs entirely on transforms in its own rAF loop; never triggers layout.
 */
export default function CustomCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const pos = useRef({ x: -100, y: -100 });
  const ring = useRef({ x: -100, y: -100 });
  const hovering = useRef(false);
  const down = useRef(false);

  useEffect(() => {
    // Skip on touch / no fine pointer.
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const onMove = (e) => {
      pos.current.x = e.clientX;
      pos.current.y = e.clientY;
      const el = e.target;
      hovering.current =
        !!el &&
        (el.closest('[data-cursor="hover"]') ||
          el.closest("a,button,input,textarea,select")) != null;
    };
    const onDown = () => (down.current = true);
    const onUp = () => (down.current = false);

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);

    let raf = 0;
    const loop = () => {
      // Ring trails with a lerp; dot is instant.
      ring.current.x += (pos.current.x - ring.current.x) * 0.18;
      ring.current.y += (pos.current.y - ring.current.y) * 0.18;

      const dot = dotRef.current;
      const rng = ringRef.current;
      if (dot) {
        dot.style.transform = `translate3d(${pos.current.x}px, ${pos.current.y}px, 0) translate(-50%, -50%) scale(${down.current ? 0.7 : 1})`;
      }
      if (rng) {
        const scale = hovering.current ? 1.9 : down.current ? 0.85 : 1;
        rng.style.transform = `translate3d(${ring.current.x}px, ${ring.current.y}px, 0) translate(-50%, -50%) scale(${scale})`;
        rng.style.opacity = hovering.current ? "1" : "0.6";
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    document.body.classList.add("has-custom-cursor");

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.body.classList.remove("has-custom-cursor");
    };
  }, []);

  return (
    <>
      <div ref={ringRef} className="cursor-ring" aria-hidden="true" />
      <div ref={dotRef} className="cursor-dot" aria-hidden="true" />
    </>
  );
}
