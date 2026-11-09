"use client";

let loadPromise: Promise<any> | undefined;
const RUNTIME_TIMEOUT_MS = 12_000;

function waitForRuntime(): Promise<any> {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const check = () => {
      const cv = (window as any).cv;
      if (cv?.Mat) { resolve(cv); return; }
      if (Date.now() - started >= RUNTIME_TIMEOUT_MS) { reject(new Error("OpenCV startup timed out.")); return; }
      window.setTimeout(check, 50);
    };
    check();
  });
}

/** Loads the bundled OpenCV.js runtime once, only after a user starts processing. */
export function loadOpenCV(): Promise<any> {
  if (typeof window === "undefined") return Promise.reject(new Error("OpenCV is only available in the browser."));
  if ((window as any).cv?.Mat) return Promise.resolve((window as any).cv);
  if (!loadPromise) {
    loadPromise = new Promise<void>((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>("script[data-opencv-runtime]");
      if (existing) { resolve(); return; }
      const script = document.createElement("script"); script.async = true; script.dataset.opencvRuntime = "true";
      script.src = "https://docs.opencv.org/4.10.0/opencv.js"; script.onload = () => resolve(); script.onerror = () => reject(new Error("OpenCV could not be loaded. Check your internet connection and retry.")); document.head.appendChild(script);
    })
      .then(waitForRuntime)
      .catch(() => { loadPromise = undefined; throw new Error("OpenCV could not be loaded. You can still set corners manually and retry."); });
  }
  return loadPromise;
}
