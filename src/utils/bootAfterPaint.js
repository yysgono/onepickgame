import startupCopy from "../seo/startupCopy.json";
// No React/i18n imports here: the server-rendered page can paint first.
export function bootAfterPaint(loadApplication, browser = window) {
  const doc = browser.document;
  let inFlight = null;
  let mounted = false;
  let disposed = false;
  let firstFrame, secondFrame, timer;
  const mark = name => { if (browser.performance?.mark) browser.performance.mark(name); };
  const cancelSchedule = () => {
    browser.clearTimeout(timer);
    if (browser.cancelAnimationFrame) {
      browser.cancelAnimationFrame(firstFrame);
      browser.cancelAnimationFrame(secondFrame);
    }
  };
  const showFailure = () => {
    if (doc.getElementById("app-start-error")) return;
    const lang = doc.documentElement.lang.toLowerCase().split(/[-_]/)[0];
    const copy = startupCopy[lang] || startupCopy.en;
    const box = doc.createElement("div");
    box.id = "app-start-error";
    box.setAttribute("role", "alert");
    box.style.cssText = "padding:16px;text-align:center;background:#fff7ed;color:#202534;border-bottom:1px solid #fed7aa";
    const message = doc.createElement("p");
    message.textContent = copy[0];
    const button = doc.createElement("button");
    button.type = "button";
    button.textContent = copy[1];
    button.style.cssText = "padding:10px 20px;cursor:pointer";
    button.addEventListener("click", start);
    box.append(message, button);
    doc.body.prepend(box);
  };
  function start() {
    if (disposed || mounted) return inFlight || Promise.resolve();
    if (inFlight) return inFlight;
    cancelSchedule();
    doc.getElementById("app-start-error")?.remove();
    mark("onepick-app-load-start");
    inFlight = Promise.resolve().then(loadApplication).then(module => {
      if (disposed) return;
      if (typeof module.mountApplication !== "function") throw new Error("Application entry missing");
      mark("onepick-app-module-ready");
      // createRoot owns the existing container only when the app is ready to render.
      // Never clear, hide or move the server content while waiting for the module.
      module.mountApplication();
      mounted = true;
    }).catch(error => {
      if (!disposed) {
        mark("onepick-app-load-failed");
        console.error("Application startup failed", error);
        showFailure();
      }
    }).finally(() => { inFlight = null; });
    return inFlight;
  }
  if (doc.visibilityState === "hidden" || !browser.requestAnimationFrame) {
    timer = browser.setTimeout(start, 0);
  } else {
    // The first rAF runs before paint; start after the following frame instead.
    firstFrame = browser.requestAnimationFrame(() => {
      secondFrame = browser.requestAnimationFrame(start);
    });
    // Backgrounding the tab must not leave startup waiting indefinitely for rAF.
    timer = browser.setTimeout(start, 1000);
  }
  return {
    start,
    dispose() { disposed = true; cancelSchedule(); doc.getElementById("app-start-error")?.remove(); },
  };
}
