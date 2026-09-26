"""
Extract a smooth 64-frame circular head-rotation trajectory + a center frame
from public/character.mp4, saving high-quality WebP frames to public/frames/.

Approach
--------
The source video is a single continuous artistic head sweep (240 frames). We
identify source frames that best represent each of the 8 compass directions by
eyeballing the contact sheet / closeups, then build a closed 360 loop of 64
output frames by interpolating *source frame indices* between the compass
anchors (shortest path around the circle). Sampling along the video's real
motion path keeps every transition smooth and artifact-free.

Compass angle convention (screen / canvas atan2(dy, dx)):
    RIGHT      =   0
    DOWN-RIGHT =  45
    DOWN       =  90
    DOWN-LEFT  = 135
    LEFT       = 180 / -180
    UP-LEFT    = -135
    UP         = -90
    UP-RIGHT   = -45

We store frames indexed 0..63 where index i corresponds to angle:
    angle_i = -180 + i * (360/64)
so frame 0 = -180 (LEFT), increasing clockwise on screen.
The React renderer uses the identical mapping.
"""
import os
import cv2
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VIDEO = os.path.join(ROOT, "public", "character.mp4")
OUT_DIR = os.path.join(ROOT, "public", "frames")

N = 64                 # number of directional frames
WEBP_QUALITY = 92      # high quality

# Source frame that best represents each compass direction, read from the
# closeup/contact sheet analysis of this specific video.
#   angle (deg, screen) -> source video frame index
# angles use atan2(dy,dx): right=0, down=90, left=+/-180, up=-90
COMPASS_ANCHORS = {
    -180: 160,   # LEFT       (frame 160: left profile)
    -135: 45,    # UP-LEFT    (frame 45 : looking up-left)
     -90: 20,    # UP         (frame 20 : looking up)
     -45: 0,     # UP-RIGHT   (frame 0  : looking up-right)
       0: 85,    # RIGHT      (frame 85 : right profile)
      45: 100,   # DOWN-RIGHT (frame 100: down-right)
      90: 120,   # DOWN       (frame 120: looking down)
     135: 150,   # DOWN-LEFT  (frame 150: down-left)
     180: 160,   # LEFT (wrap, same as -180)
}

CENTER_SRC = 239       # neutral, looking straight at camera


def read_frame(cap, idx):
    cap.set(cv2.CAP_PROP_POS_FRAMES, int(idx))
    ok, frame = cap.read()
    if not ok:
        raise RuntimeError(f"could not read source frame {idx}")
    return frame


def interp_src_index(angle):
    """Given a target screen angle in [-180,180], interpolate the source frame
    index between the two surrounding compass anchors."""
    keys = sorted(COMPASS_ANCHORS.keys())
    for i in range(len(keys) - 1):
        a0, a1 = keys[i], keys[i + 1]
        if a0 <= angle <= a1:
            f0, f1 = COMPASS_ANCHORS[a0], COMPASS_ANCHORS[a1]
            t = (angle - a0) / (a1 - a0) if a1 != a0 else 0.0
            return f0 + (f1 - f0) * t
    return COMPASS_ANCHORS[keys[-1]]


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    cap = cv2.VideoCapture(VIDEO)

    written = 0
    for i in range(N):
        angle = -180.0 + i * (360.0 / N)
        src = interp_src_index(angle)
        # nearest source frame (avoids blending two faces -> no ghosting)
        frame = read_frame(cap, round(src))
        out = os.path.join(OUT_DIR, f"frame_{i:02d}.webp")
        cv2.imwrite(out, frame, [cv2.IMWRITE_WEBP_QUALITY, WEBP_QUALITY])
        written += 1

    # center / neutral eye-contact frame
    center = read_frame(cap, CENTER_SRC)
    cv2.imwrite(os.path.join(OUT_DIR, "center.webp"), center,
                [cv2.IMWRITE_WEBP_QUALITY, WEBP_QUALITY])

    cap.release()
    print(f"wrote {written} directional frames + center.webp to {OUT_DIR}")
    print(f"angle step = {360.0 / N:.2f} deg per frame")


if __name__ == "__main__":
    main()
