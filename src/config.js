// Single source of truth shared with scripts/extract_frames.py.
// Keep FRAME_COUNT and the angle convention identical to the extractor.

export const FRAME_COUNT = 64; // frame_00.webp .. frame_63.webp
export const ANGLE_STEP = 360 / FRAME_COUNT; // 5.625 deg per frame

// Exact background color of the source video (RGB 223,25,19 => #DF1913).
export const BG_COLOR = "#DF1913";

// Deadzone: when the cursor is within this fraction of the min(viewport)
// dimension from the face center, we show the neutral "eye contact" frame.
export const DEADZONE_RADIUS_FRACTION = 0.12;

// Angular lerp response factor. Higher = snappier. ~0.26 tracks in ~35ms.
export const LERP_FACTOR = 0.26;

// Where the character's face sits on screen, as a fraction of viewport.
// The video frames center the head horizontally; vertically the face is in
// the upper portion. object-fit: cover crops, so we anchor to sensible values.
export const FACE_CENTER = { x: 0.5, y: 0.42 };

// Vite injects import.meta.env.BASE_URL (e.g. "/portfolio-cursor-tracker/" in
// production, "/" in dev). Prefix runtime asset URLs with it so frames resolve
// correctly on GitHub Pages. BASE_URL always ends with a slash.
const BASE = import.meta.env.BASE_URL;

// Build the list of frame URLs (served from public/).
export const FRAME_URLS = Array.from(
  { length: FRAME_COUNT },
  (_, i) => `${BASE}frames/frame_${String(i).padStart(2, "0")}.webp`
);

export const CENTER_URL = `${BASE}frames/center.webp`;
