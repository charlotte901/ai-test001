// Embedded showcases render at up to 30 fps. Standalone originals are untouched.
if (new URLSearchParams(location.search).has("showcase")) {
  const request = window.requestAnimationFrame.bind(window);
  let active = !new URLSearchParams(location.search).has("preload");
  let renderedFrames = 0;
  let captureRequest = null;
  window.addEventListener("message", (event) => {
    if (event.source !== parent) return;
    if (event.data?.type === "aiquos:visibility")
      active = event.data.active === true;
    if (event.data?.type === "aiquos:capture")
      captureRequest = { id: event.data.requestId, origin: event.origin };
  });
  window.requestAnimationFrame = (callback) =>
    request((time) => {
      const last = window.__showcaseFrameTime || 0;
      if (time - last < 32 || document.hidden || (!active && !captureRequest && renderedFrames >= 2))
        window.requestAnimationFrame(callback);
      else {
        window.__showcaseFrameTime = time;
        callback(time);
        if (renderedFrames < 2 && document.querySelector("canvas")) {
          renderedFrames++;
          if (renderedFrames === 2) parent.postMessage({ type: "aiquos:ready" }, "*");
        }
        if (captureRequest) {
          try {
            const image = document
              .querySelector("canvas")
              ?.toDataURL("image/png");
            parent.postMessage(
              { type: "aiquos:frame", requestId: captureRequest.id, image },
              captureRequest.origin,
            );
          } catch {
            /* parent has a bounded timeout for unavailable GPU frames */
          }
          captureRequest = null;
        }
      }
    });
}
