"use client";

let loadPromise: Promise<any> | undefined;

/** Loads the bundled OpenCV.js runtime once, only after a user starts processing. */
export function loadOpenCV(): Promise<any> {
  if (typeof window === "undefined") return Promise.reject(new Error("OpenCV is only available in the browser."));
  if ((window as any).cv?.Mat) return Promise.resolve((window as any).cv);
  if (!loadPromise) {
    loadPromise = new Promise<any>((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>("script[data-opencv-runtime]");
      const ready = () => {
        const cv = (window as any).cv;
        if (cv?.Mat) resolve(cv); else if (cv) cv.onRuntimeInitialized = () => resolve(cv);
        else reject(new Error("OpenCV did not initialise."));
      };
      if (existing) { existing.addEventListener("load", ready, { once: true }); existing.addEventListener("error", () => reject(new Error("OpenCV could not be loaded.")), { once: true }); return; }
      const script = document.createElement("script"); script.async = true; script.dataset.opencvRuntime = "true";
      script.src = "https://docs.opencv.org/4.10.0/opencv.js"; script.onload = ready; script.onerror = () => reject(new Error("OpenCV could not be loaded. Check your internet connection and retry.")); document.head.appendChild(script);
    })
      .catch(() => { loadPromise = undefined; throw new Error("OpenCV could not be loaded. You can still set corners manually and retry."); });
  }
  return loadPromise;
}
