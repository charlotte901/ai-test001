import { useEffect, useRef } from "react";

const REFERENCE = "/assets/test-wordmark-reference.png";
const CROP = [546, 306, 822, 244];

/** Preserve the supplied bespoke letterforms; remove only their dark matte. */
export function TestWordmark({ reference = REFERENCE, crop = CROP }) {
  const canvas = useRef(null);
  useEffect(() => {
    const source = new Image();
    source.onload = () => {
      const context = canvas.current?.getContext("2d", {
        willReadFrequently: true,
      });
      if (!context) return;
      const [x, y, width, height] = crop;
      context.clearRect(0, 0, width, height);
      context.drawImage(source, x, y, width, height, 0, 0, width, height);
      const pixels = context.getImageData(0, 0, width, height);
      for (let i = 0; i < pixels.data.length; i += 4) {
        const luminance =
          pixels.data[i] * 0.2126 +
          pixels.data[i + 1] * 0.7152 +
          pixels.data[i + 2] * 0.0722;
        // Remove background noise while retaining antialiased contours.
        const alpha = Math.max(0, Math.min(1, (luminance - 35) / 215));
        pixels.data[i] = 255;
        pixels.data[i + 1] = 255;
        pixels.data[i + 2] = 255;
        pixels.data[i + 3] = Math.round(alpha * 255);
      }
      context.putImageData(pixels, 0, 0);
      canvas.current.dataset.ready = "true";
    };
    source.src = reference;
    return () => {
      source.onload = null;
    };
  }, [reference, crop]);
  return <canvas ref={canvas} width={crop[2]} height={crop[3]} aria-hidden="true" />;
}
