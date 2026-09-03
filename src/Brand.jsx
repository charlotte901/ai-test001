import { useEffect, useRef } from "react";
const REFERENCE = "/assets/aiquos-reference.png";

/** Source artwork, not an approximate typeset replacement.
 * The design uses bespoke letterforms rather than a distributable font.
 * The source clipping preserves all six outlines, spacing and the arched baseline.
 */
export function Brand({ compact = false }) {
  const canvas = useRef(null);
  useEffect(() => {
    const source = new Image();
    source.src = REFERENCE;
    source.onload = () => {
      const ctx = canvas.current?.getContext("2d", {
        willReadFrequently: true,
      });
      if (!ctx) return;
      const x = compact ? 52 : 100,
        y = compact ? 39 : 100;
      const w = compact ? 130 : 1300,
        h = compact ? 36 : 345;
      ctx.drawImage(source, x, y, w, h, 0, 0, w, h);
      const pixels = ctx.getImageData(0, 0, w, h);
      // Unmix the supplied white lettering from its pink matte. This retains
      // the source contours and antialiasing; no letter shape is hand-drawn.
      for (let i = 0; i < pixels.data.length; i += 4) {
        const px = ((i / 4) % w) + x,
          py = Math.floor(i / 4 / w) + y;
        const g = pixels.data[i + 1];
        const shellBoundary = 282 + Math.abs(px - 808) * 0.314;
        const isShell =
          !compact && px > 491 && px < 1134 && py >= shellBoundary;
        const alpha = isShell ? 0 : Math.max(0, Math.min(1, (g - 143) / 110));
        pixels.data[i] = 255;
        pixels.data[i + 1] = 255;
        pixels.data[i + 2] = 255;
        pixels.data[i + 3] = Math.round(alpha * 255);
      }
      ctx.putImageData(pixels, 0, 0);
    };
    return () => {
      source.onload = null;
    };
  }, [compact]);
  return compact ? (
    <span className="brand-small" role="img" aria-label="AIQUOS">
      <canvas ref={canvas} width="130" height="36" aria-hidden="true" />
    </span>
  ) : (
    <h1 className="brand-display" aria-label="AIQUOS">
      <canvas ref={canvas} width="1300" height="345" aria-hidden="true" />
    </h1>
  );
}
