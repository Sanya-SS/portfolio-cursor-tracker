"""Build a contact sheet of the 64 extracted WebP frames to verify the circular
trajectory is smooth and each compass direction reads correctly."""
import os, glob
import cv2
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FR = os.path.join(ROOT, "public", "frames")

files = sorted(glob.glob(os.path.join(FR, "frame_*.webp")))
cols, rows = 8, 8
tw = th = 150
sheet = np.zeros((rows * th, cols * tw, 3), dtype=np.uint8)
for i, f in enumerate(files):
    img = cv2.imread(f)
    h, w = img.shape[:2]
    crop = img[0:int(h*0.6), int(w*0.25):int(w*0.75)]
    tile = cv2.resize(crop, (tw, th))
    ang = -180 + i * (360/64)
    cv2.putText(tile, f"{i}:{int(ang)}", (4, 20), cv2.FONT_HERSHEY_SIMPLEX,
                0.5, (0, 255, 0), 1, cv2.LINE_AA)
    r, c = divmod(i, cols)
    sheet[r*th:(r+1)*th, c*tw:(c+1)*tw] = tile
out = os.path.join(ROOT, "scripts", "verify_sheet.png")
cv2.imwrite(out, sheet)
print("wrote", out, "count", len(files))
