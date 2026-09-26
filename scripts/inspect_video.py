"""
Inspect public/character.mp4:
  - frame count, fps, duration, dimensions
  - dominant background color (sampled from the 4 corners across several frames)
  - dumps a contact sheet (grid of evenly-sampled frames) to scripts/contact_sheet.png
    so we can eyeball which frame indices hold each of the 8 compass directions
    and the center/neutral pose.
Run:  python scripts/inspect_video.py
"""
import os
import cv2
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VIDEO = os.path.join(ROOT, "public", "character.mp4")


def corner_color(frame, pad=6, box=18):
    """Average color of the 4 corners (BGR)."""
    h, w = frame.shape[:2]
    regions = [
        frame[pad:pad + box, pad:pad + box],
        frame[pad:pad + box, w - pad - box:w - pad],
        frame[h - pad - box:h - pad, pad:pad + box],
        frame[h - pad - box:h - pad, w - pad - box:w - pad],
    ]
    stacked = np.concatenate([r.reshape(-1, 3) for r in regions], axis=0)
    return stacked.mean(axis=0)


def main():
    if not os.path.exists(VIDEO):
        raise SystemExit(f"Video not found: {VIDEO}")

    cap = cv2.VideoCapture(VIDEO)
    fps = cap.get(cv2.CAP_PROP_FPS)
    count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    dur = count / fps if fps else 0

    print(f"file:        {VIDEO}")
    print(f"frame_count: {count}")
    print(f"fps:         {fps:.3f}")
    print(f"duration_s:  {dur:.3f}")
    print(f"dimensions:  {w} x {h}")

    # --- Sample background color across several frames ---
    bg_samples = []
    sample_idxs = np.linspace(0, max(count - 1, 0), num=min(12, count)).astype(int)
    frames_cache = {}
    for idx in sample_idxs:
        cap.set(cv2.CAP_PROP_POS_FRAMES, int(idx))
        ok, frame = cap.read()
        if not ok:
            continue
        frames_cache[int(idx)] = frame
        bg_samples.append(corner_color(frame))

    if bg_samples:
        bg_bgr = np.median(np.stack(bg_samples), axis=0)
        b, g, r = [int(round(x)) for x in bg_bgr]
        print(f"bg_rgb:      ({r}, {g}, {b})")
        print(f"bg_hex:      #{r:02X}{g:02X}{b:02X}")

    # --- Build a contact sheet of evenly sampled frames ---
    n_cols = 8
    n_rows = 9
    total_tiles = n_cols * n_rows
    tile_w, tile_h = 160, 160
    grid_idxs = np.linspace(0, max(count - 1, 0), num=total_tiles).astype(int)

    sheet = np.zeros((n_rows * tile_h, n_cols * tile_w, 3), dtype=np.uint8)
    for i, idx in enumerate(grid_idxs):
        idx = int(idx)
        if idx in frames_cache:
            frame = frames_cache[idx]
        else:
            cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
            ok, frame = cap.read()
            if not ok:
                continue
        tile = cv2.resize(frame, (tile_w, tile_h))
        cv2.putText(tile, f"{idx}", (6, 22), cv2.FONT_HERSHEY_SIMPLEX,
                    0.6, (0, 255, 0), 2, cv2.LINE_AA)
        r_i, c_i = divmod(i, n_cols)
        sheet[r_i * tile_h:(r_i + 1) * tile_h, c_i * tile_w:(c_i + 1) * tile_w] = tile

    out = os.path.join(ROOT, "scripts", "contact_sheet.png")
    cv2.imwrite(out, sheet)
    print(f"contact_sheet: {out}")

    cap.release()


if __name__ == "__main__":
    main()
