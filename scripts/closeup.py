"""
Dump a close-up strip of specific frame indices (face-cropped, larger) so we can
precisely read gaze direction for compass mapping.
Usage: python scripts/closeup.py 0 26 50 77 104 141 168 200 239
"""
import os, sys
import cv2
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VIDEO = os.path.join(ROOT, "public", "character.mp4")

def main():
    idxs = [int(x) for x in sys.argv[1:]] or [0, 26, 50, 77, 104, 141, 168, 200, 239]
    cap = cv2.VideoCapture(VIDEO)
    tiles = []
    tw, th = 300, 300
    for idx in idxs:
        cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
        ok, frame = cap.read()
        if not ok:
            continue
        # crop upper-center (head region) : top 55% height, center 55% width
        h, w = frame.shape[:2]
        crop = frame[0:int(h*0.6), int(w*0.25):int(w*0.75)]
        tile = cv2.resize(crop, (tw, th))
        cv2.putText(tile, f"{idx}", (8, 30), cv2.FONT_HERSHEY_SIMPLEX,
                    0.9, (0, 255, 0), 2, cv2.LINE_AA)
        tiles.append(tile)
    if tiles:
        strip = np.concatenate(tiles, axis=1)
        out = os.path.join(ROOT, "scripts", "closeup.png")
        cv2.imwrite(out, strip)
        print("wrote", out)
    cap.release()

if __name__ == "__main__":
    main()
