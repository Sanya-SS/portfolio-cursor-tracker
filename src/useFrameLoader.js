import { useEffect, useRef, useState } from "react";
import { FRAME_URLS, CENTER_URL } from "./config";

/**
 * Preloads all directional frames + the center frame into decoded HTMLImageElements.
 * Returns { frames, center, ready, progress }.
 *
 * We use img.decode() so the bitmap is fully decoded before the rAF loop draws
 * it — this prevents first-draw jank / partial frames.
 */
export function useFrameLoader() {
  const framesRef = useRef([]);
  const centerRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const urls = [...FRAME_URLS, CENTER_URL];
    let loaded = 0;

    const loadOne = (url) =>
      new Promise((resolve) => {
        const img = new Image();
        img.decoding = "async";
        img.src = url;
        const done = () => {
          loaded += 1;
          if (!cancelled) setProgress(loaded / urls.length);
          resolve(img);
        };
        // decode() resolves once the image is fully decoded and paintable.
        img
          .decode()
          .then(done)
          .catch(() => {
            // Fallback for browsers that reject decode() on some formats.
            if (img.complete) return done();
            img.onload = done;
            img.onerror = done;
          });
      });

    Promise.all(urls.map(loadOne)).then((imgs) => {
      if (cancelled) return;
      framesRef.current = imgs.slice(0, FRAME_URLS.length);
      centerRef.current = imgs[imgs.length - 1];
      setReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return { framesRef, centerRef, ready, progress };
}
