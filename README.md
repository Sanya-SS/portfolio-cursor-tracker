# Luxury Portfolio Hero — Cursor-Tracking Character

An award-winning hero section where a character's **head** turns to follow your
cursor with zero lag and zero ghosting. The page and the character's body stay
100% motionless — only pre-rendered head frames are swapped on a canvas.

## How it works

1. **Frame pre-extraction (Python + OpenCV).** The source `public/character.mp4`
   is a single continuous head sweep (240 frames, 24fps, 1280×720, solid red
   `#EC0C08` background). `scripts/extract_frames.py` samples that motion path
   into **64 WebP frames** evenly spaced 5.625° apart around a full 360° circle,
   plus `center.webp` (neutral, direct eye contact). No MP4 is played or seeked
   in the browser.
2. **Canvas renderer (React).** Frames are preloaded and decoded up front. A
   `requestAnimationFrame` loop computes the cursor angle relative to the face
   center via `atan2(dy, dx)`, applies a **shortest-path circular angular lerp**
   (factor `0.26`, ~35ms response), maps the smoothed angle to the nearest frame
   index, and draws **exactly one crisp frame at 100% opacity** — never blends
   two frames, so there is no double-face ghosting.
3. **Eye-contact deadzone.** When the cursor is within ~12% of the viewport of
   the face center, the renderer switches to `center.webp`.
4. **No 3D transforms.** No `perspective` / `rotateX` / `rotateY` anywhere.
5. **Seamless background.** Page and canvas are the exact video background color.

## Regenerate frames

```bash
pip install opencv-python numpy
python scripts/inspect_video.py     # frame count, fps, bg color, contact sheet
python scripts/extract_frames.py    # writes public/frames/*.webp
python scripts/verify_frames.py     # optional: contact sheet of extracted frames
```

The angle convention and frame count in `scripts/extract_frames.py` mirror
`src/config.js` exactly — change both together.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production bundle in dist/
```

## Structure

- `src/config.js` — frame count, angle mapping, background color, deadzone, lerp.
- `src/useFrameLoader.js` — preload + decode all frames.
- `src/CharacterCanvas.jsx` — rAF renderer (angular lerp, deadzone, single draw).
- `src/CustomCursor.jsx` — glowing dot + trailing magnetic aura ring.
- `src/Hero.jsx` — frosted nav pill, typography, buttons.
- `scripts/` — OpenCV extraction/inspection tools.
