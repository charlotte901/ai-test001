// Embedded showcases render at up to 30 fps. Standalone originals are untouched.
if (new URLSearchParams(location.search).has("showcase")) {
  const request = window.requestAnimationFrame.bind(window);
  let active = !new URLSearchParams(location.search).has("preload");
  let renderedFrames = 0;
  let captureRequest = null;
  let readyAcknowledged = false;
  let readyRetry = null;
  const announceReady = () => {
    parent.postMessage({ type: "aiquos:ready" }, "*");
    if (!readyAcknowledged) readyRetry = setTimeout(announceReady, 350);
  };
  window.addEventListener("message", (event) => {
    if (event.source !== parent) return;
    if (event.data?.type === "aiquos:visibility") {
      active = event.data.active === true;
      if (active) {
        // Coming on-screen must always paint afresh: a scene warmed while
        // hidden may hold stale (possibly black) warm-up frames.
        window.__showcaseFrameTime = 0;
      }
    }
    if (event.data?.type === "aiquos:ready-ack") {
      readyAcknowledged = true;
      clearTimeout(readyRetry);
    }
    if (event.data?.type === "aiquos:capture")
      captureRequest = { id: event.data.requestId, origin: event.origin };
  });
  // A lost WebGL context leaves the canvas permanently black and no activation
  // nudge can heal it. Allow the browser to restore it; if it does not come
  // back promptly, reload — the parent keeps the outgoing frame until the
  // fresh scene announces itself, and the periodic nudge re-activates it.
  let contextLost = false;
  document.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    contextLost = true;
    setTimeout(() => {
      if (contextLost) location.reload();
    }, 1500);
  }, true);
  document.addEventListener("webglcontextrestored", () => {
    contextLost = false;
  }, true);
  window.requestAnimationFrame = (callback) =>
    request((time) => {
      const last = window.__showcaseFrameTime || 0;
      if (time - last < 32 || document.hidden || (!active && !captureRequest && renderedFrames >= 2))
        window.requestAnimationFrame(callback);
      else {
        window.__showcaseFrameTime = time;
        // One scene exception must never kill the rAF chain: a dead loop is a
        // frozen (often black) screen that no activation message can revive.
        try {
          callback(time);
        } catch (error) {
          console.error("showcase frame failed:", error);
        }
        if (renderedFrames < 2 && document.querySelector("canvas")) {
          renderedFrames++;
          if (renderedFrames === 2) announceReady();
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
