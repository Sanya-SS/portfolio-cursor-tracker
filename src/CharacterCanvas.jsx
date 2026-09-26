import { useEffect, useRef } from "react";
import { useFrameLoader } from "./useFrameLoader";
import {
  FRAME_COUNT,
  ANGLE_STEP,
  BG_COLOR,
  DEADZONE_RADIUS_FRACTION,
  LERP_FACTOR,
  FACE_CENTER,
} from "./config";

// Frame source dimensions (video is 1280x720).
const SRC_W = 1280;
const SRC_H = 720;

// --- angle helpers (degrees) ---------------------------------------------
const TAU = 360;

// Shortest signed difference b - a wrapped to (-180, 180].
function angleDelta(a, b) {
  let d = (b - a) % TAU;
  if (d > 180) d -= TAU;
  if (d < -180) d += TAU;
  return d;
}

// Circular lerp along the shortest path.
function lerpAngle(a, b, t) {
  return a + angleDelta(a, b) * t;
}

// Map a screen angle in [-180,180] to nearest frame index [0,FRAME_COUNT-1].
// Frame 0 corresponds to -180deg, stepping by ANGLE_STEP clockwise.
function angleToFrame(angle) {
  let idx = Math.round((angle + 180) / ANGLE_STEP);
  idx = ((idx % FRAME_COUNT) + FRAME_COUNT) % FRAME_COUNT;
  return idx;
}

export default function CharacterCanvas({ onCursorState }) {
  const canvasRef = useRef(null);
  const { framesRef, centerRef, ready, progress } = useFrameLoader();

  // Live pointer position (viewport px). Default to a point up-and-right so the
  // character has a pleasant initial pose before the mouse moves.
  const pointer = useRef({ x: null, y: null });
  // Smoothed angle carried across frames for the circular lerp.
  const smoothAngle = useRef(-45);
  // Whether we are inside the deadzone (eye contact) — smoothed for hysteresis.
  const inDeadzone = useRef(false);

  useEffect(() => {
    const onMove = (e) => {
      pointer.current.x = e.clientX;
      pointer.current.y = e.clientY;
    };
    const onLeave = () => {
      pointer.current.x = null;
      pointer.current.y = null;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { alpha: false });
    let raf = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Cover-fit draw geometry, recomputed on resize.
    let draw = { w: 0, h: 0, dx: 0, dy: 0, dw: 0, dh: 0, faceX: 0, faceY: 0 };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // object-fit: cover math for SRC_W x SRC_H into w x h.
      const scale = Math.max(w / SRC_W, h / SRC_H);
      const dw = SRC_W * scale;
      const dh = SRC_H * scale;
      const dx = (w - dw) / 2;
      const dy = (h - dh) / 2;
      draw = {
        w,
        h,
        dx,
        dy,
        dw,
        dh,
        faceX: w * FACE_CENTER.x,
        faceY: h * FACE_CENTER.y,
      };
    };
    resize();
    window.addEventListener("resize", resize);

    let lastFrameIdx = -1;
    let lastWasCenter = null;

    const render = () => {
      const { w, h, dx, dy, dw, dh, faceX, faceY } = draw;

      const px = pointer.current.x;
      const py = pointer.current.y;

      let targetAngle = smoothAngle.current;
      let dist = Infinity;

      if (px != null && py != null) {
        const ddx = px - faceX;
        const ddy = py - faceY;
        dist = Math.hypot(ddx, ddy);
        // atan2 returns radians; convert to degrees. Screen convention:
        // right=0, down=+90, left=+/-180, up=-90.
        targetAngle = (Math.atan2(ddy, ddx) * 180) / Math.PI;
      }

      // Deadzone with a little hysteresis to avoid flicker at the boundary.
      const radius = Math.min(w, h) * DEADZONE_RADIUS_FRACTION;
      const enter = radius;
      const exit = radius * 1.18;
      if (inDeadzone.current) {
        if (dist > exit) inDeadzone.current = false;
      } else {
        if (dist < enter) inDeadzone.current = true;
      }

      // Advance the smoothed angle even in the deadzone so re-exit is seamless.
      smoothAngle.current = lerpAngle(
        smoothAngle.current,
        targetAngle,
        LERP_FACTOR
      );

      const useCenter = inDeadzone.current && px != null;
      const frameIdx = angleToFrame(smoothAngle.current);

      // Skip redraw if nothing changed (saves GPU, still 60fps responsive).
      if (useCenter === lastWasCenter && frameIdx === lastFrameIdx) {
        raf = requestAnimationFrame(render);
        return;
      }
      lastWasCenter = useCenter;
      lastFrameIdx = frameIdx;

      // Paint seamless background first (also fills cover letterbox edges).
      ctx.fillStyle = BG_COLOR;
      ctx.fillRect(0, 0, w, h);

      // Draw EXACTLY ONE crisp frame at full opacity. No alpha blending.
      const img = useCenter ? centerRef.current : framesRef.current[frameIdx];
      if (img) {
        ctx.globalAlpha = 1;
        ctx.drawImage(img, dx, dy, dw, dh);
      }

      // Report cursor / interaction state to parent (custom cursor lives in DOM).
      if (onCursorState) {
        onCursorState({ x: px, y: py, inDeadzone: inDeadzone.current });
      }

      raf = requestAnimationFrame(render);
    };

    raf = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [ready, onCursorState, framesRef, centerRef]);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="character-canvas"
        aria-label="Interactive portrait that follows your cursor"
        role="img"
      />
      {!ready && (
        <div className="preloader" style={{ background: BG_COLOR }}>
          <div className="preloader-bar">
            <span style={{ width: `${Math.round(progress * 100)}%` }} />
          </div>
        </div>
      )}
    </>
  );
}
