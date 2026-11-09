"use client";
/* Local object URLs from the browser cannot use Next's remote image optimiser. */
/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useRef, useState } from "react";
import { captureVideoFrame } from "@/lib/camera/capture";
import { exportPdf } from "@/lib/pdf/exportPdf";
import { detectDocument } from "@/lib/opencv/detectDocument";
import { enhanceImage, type EnhancementOptions } from "@/lib/opencv/enhanceImage";
import { loadOpenCV } from "@/lib/opencv/loader";
import { perspectiveCorrect } from "@/lib/opencv/perspective";
import { defaultCorners, type Point } from "@/lib/utils/geometry";
import { canvasToBlob, downloadBlob, isImageFile, loadImage } from "@/lib/utils/image";
import { useCamera } from "@/hooks/useCamera";
import { CornerEditor } from "./CornerEditor";
import { DocumentOverlay } from "./DocumentOverlay";
import { EnhancementControls } from "./EnhancementControls";

type Phase = "idle" | "camera" | "adjusting" | "processing" | "preview" | "exporting";
const initialEnhancement: EnhancementOptions = { mode: "certificate", brightness: 0, contrast: 8, saturation: 3 };

function sourceCanvas(source: HTMLImageElement) { const canvas = document.createElement("canvas"); canvas.width = source.naturalWidth; canvas.height = source.naturalHeight; canvas.getContext("2d")!.drawImage(source, 0, 0); return canvas; }

export function Scanner() {
  const videoRef = useRef<HTMLVideoElement>(null); const fileRef = useRef<HTMLInputElement>(null); const camera = useCamera(videoRef);
  const [phase, setPhase] = useState<Phase>("idle"); const [message, setMessage] = useState("Your images stay on this device."); const [error, setError] = useState<string | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null); const [sourceSize, setSourceSize] = useState({ width: 0, height: 0 }); const [corners, setCorners] = useState<Point[]>([]);
  const [videoSize, setVideoSize] = useState({ width: 1, height: 1 });
  const [detection, setDetection] = useState<Point[] | null>(null); const [previewUrl, setPreviewUrl] = useState<string | null>(null); const [output, setOutput] = useState<Blob | null>(null); const [enhancement, setEnhancement] = useState(initialEnhancement);

  const clearResult = useCallback(() => { if (previewUrl) URL.revokeObjectURL(previewUrl); setPreviewUrl(null); setOutput(null); }, [previewUrl]);
  const reset = useCallback(() => { camera.stop(); clearResult(); if (sourceUrl) URL.revokeObjectURL(sourceUrl); setSourceUrl(null); setSourceSize({ width: 0, height: 0 }); setCorners([]); setDetection(null); setPhase("idle"); setError(null); setMessage("Ready for a new certificate."); }, [camera, clearResult, sourceUrl]);
  useEffect(() => () => { camera.stop(); }, [camera]);

  const detectSource = useCallback(async (url: string) => {
    try {
      const { image, width, height } = await loadImage(url); setSourceSize({ width, height }); const fallback = defaultCorners(width, height); setCorners(fallback);
      setMessage("Looking for the certificate boundary…"); const cv = await loadOpenCV(); const result = detectDocument(cv, sourceCanvas(image));
      if (result) { setCorners(result.corners); setDetection(result.corners); setMessage(`Document edge detected (${Math.round(result.confidence * 100)}% confidence). Check the four corners.`); }
      else { setMessage("No reliable edge found. Position the four corners manually, then continue."); }
    } catch (caught) { setMessage("Automatic detection was unavailable. Position the four corners manually."); console.warn(caught); }
    finally { setPhase("adjusting"); }
  }, []);

  const acceptBlob = useCallback(async (blob: Blob) => {
    clearResult(); if (sourceUrl) URL.revokeObjectURL(sourceUrl); const url = URL.createObjectURL(blob); setSourceUrl(url); setError(null); setPhase("processing"); camera.stop(); await detectSource(url);
  }, [camera, clearResult, detectSource, sourceUrl]);

  const chooseFile = async (file?: File) => {
    if (!file) return; if (!isImageFile(file)) { setError("Please select a PNG, JPEG, WebP, or another image file."); return; }
    await acceptBlob(file);
  };
  const startCamera = async () => { clearResult(); setError(null); setPhase("camera"); setMessage("Starting camera…"); await camera.start(); };
  const takePhoto = async () => { try { setError(null); setMessage("Capturing high-resolution photo…"); await acceptBlob(await captureVideoFrame(videoRef.current!)); } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not capture image."); } };

  // Low-frequency preview analysis provides a live guide without blocking the capture path.
  useEffect(() => {
    if (phase !== "camera" || camera.status !== "ready") return;
    let cancelled = false; const timer = window.setInterval(async () => {
      const video = videoRef.current; if (!video?.videoWidth || cancelled) return;
      try { const cv = await loadOpenCV(); if (cancelled) return; const canvas = document.createElement("canvas"); canvas.width = video.videoWidth; canvas.height = video.videoHeight; canvas.getContext("2d")!.drawImage(video, 0, 0); const result = detectDocument(cv, canvas); if (!cancelled) setDetection(result?.corners ?? null); } catch { /* The capture and manual editor remain available. */ }
    }, 1200);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [phase, camera.status]);

  const process = async () => {
    if (!sourceUrl || corners.length !== 4) return; setPhase("processing"); setError(null); setMessage("Correcting perspective and enhancing the image…");
    try { const { image } = await loadImage(sourceUrl); const cv = await loadOpenCV(); const straightened = perspectiveCorrect(cv, sourceCanvas(image), corners); const enhanced = enhanceImage(straightened, enhancement); const blob = await canvasToBlob(enhanced); clearResult(); setOutput(blob); setPreviewUrl(URL.createObjectURL(blob)); setPhase("preview"); setMessage("Scan is ready. Compare it with the original or export it."); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "The image could not be processed."); setPhase("adjusting"); }
  };
  const downloadPng = () => output && downloadBlob(output, "certificate-scan.png");
  const downloadPdf = async () => { if (!output) return; setPhase("exporting"); setError(null); setMessage("Creating A4 PDF…"); try { downloadBlob(await exportPdf(output), "certificate-scan.pdf"); setPhase("preview"); setMessage("PDF download has started."); } catch (caught) { setError(caught instanceof Error ? caught.message : "PDF creation failed."); setPhase("preview"); } };

  return <div className="mx-auto min-h-screen max-w-6xl px-4 py-6 sm:px-6 lg:py-10"><header className="mb-6 flex items-center justify-between"><div><p className="text-sm font-semibold tracking-[.18em] text-blue-700">PRIVATE SCAN</p><h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Certificate Scanner</h1></div><span className="hidden rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 sm:block">On-device processing</span></header>
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]"><div className="space-y-5">
      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}
      {phase === "idle" && <section className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-10"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-2xl">▣</div><h2 className="mt-5 text-xl font-semibold">Scan a certificate clearly</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">Open your camera or choose a photo. We straighten the document, preserve its contents, and create a high-quality PDF or PNG without uploading it.</p><div className="mx-auto mt-6 grid max-w-md gap-3 sm:grid-cols-2"><button onClick={startCamera} className="rounded-xl bg-blue-700 px-4 py-3 font-semibold text-white shadow-sm hover:bg-blue-800">Open camera</button><button onClick={() => fileRef.current?.click()} className="rounded-xl border border-slate-300 px-4 py-3 font-semibold hover:bg-slate-50">Choose image</button></div></section>}
      {phase === "camera" && <section className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 shadow-sm"><div className="relative aspect-[4/3] bg-slate-900"><video ref={videoRef} onLoadedMetadata={event => setVideoSize({ width: event.currentTarget.videoWidth || 1, height: event.currentTarget.videoHeight || 1 })} muted playsInline className="h-full w-full object-cover" aria-label="Live camera preview" />{camera.status === "ready" && <DocumentOverlay corners={detection ?? []} width={videoSize.width} height={videoSize.height} />}{camera.status === "loading" && <div className="absolute inset-0 grid place-items-center text-white">Starting camera…</div>}</div><div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4"><span className="text-sm text-slate-600">{camera.error ?? (detection ? "Document detected — keep it inside the outline." : "Center the certificate in view.")}</span><div className="flex gap-2"><button onClick={() => { camera.stop(); setPhase("idle"); }} className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-slate-100">Cancel</button>{camera.status === "ready" && <button onClick={takePhoto} className="rounded-lg bg-blue-700 px-4 py-2 font-semibold text-white hover:bg-blue-800">Capture</button>}</div></div></section>}
      {phase === "processing" && <section className="grid min-h-64 place-items-center rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm"><div><div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"/><p className="mt-4 font-medium">{message}</p><p className="mt-1 text-sm text-slate-500">This happens only in your browser.</p></div></section>}
      {phase === "adjusting" && sourceUrl && <><CornerEditor imageUrl={sourceUrl} imageSize={sourceSize} corners={corners} onChange={setCorners} onReset={() => setCorners(defaultCorners(sourceSize.width, sourceSize.height))} /><EnhancementControls options={enhancement} onChange={setEnhancement} /><div className="flex flex-wrap justify-between gap-3"><button onClick={reset} className="rounded-xl border border-slate-300 px-4 py-3 font-semibold hover:bg-white">Start over</button><button onClick={process} className="rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white shadow-sm hover:bg-blue-800">Straighten & preview</button></div></>}
      {(phase === "preview" || phase === "exporting") && previewUrl && <><section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">Processed scan</h2><span className="text-sm text-emerald-700">Ready to export</span></div><div className="checker overflow-hidden rounded-xl"><img src={previewUrl} alt="Straightened and enhanced certificate" className="mx-auto block max-h-[65vh] max-w-full" /></div></section><div className="flex flex-wrap gap-3"><button onClick={() => { clearResult(); setPhase("adjusting"); }} className="rounded-xl border border-slate-300 px-4 py-3 font-semibold hover:bg-white">Edit corners</button><button onClick={downloadPng} disabled={phase === "exporting"} className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 font-semibold text-blue-800 hover:bg-blue-100 disabled:opacity-50">Download PNG</button><button onClick={downloadPdf} disabled={phase === "exporting"} className="rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-60">{phase === "exporting" ? "Creating PDF…" : "Download PDF"}</button><button onClick={reset} className="px-3 py-3 text-sm font-medium text-slate-600 hover:text-slate-900">New scan</button></div></>}
    </div><aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-semibold">Scan tips</h2><ol className="mt-3 space-y-3 text-sm leading-5 text-slate-600"><li><strong className="text-slate-800">1. Light evenly.</strong> Avoid glare and strong shadows.</li><li><strong className="text-slate-800">2. Include all edges.</strong> Keep the full certificate in frame.</li><li><strong className="text-slate-800">3. Check corners.</strong> Refine the outline before processing.</li></ol><div className="mt-5 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">No account, image upload, or server storage. Closing this page clears the scan.</div></aside></div>
    <p role="status" className="mt-5 text-center text-sm text-slate-500">{message}</p><input ref={fileRef} type="file" accept="image/*" capture="environment" className="sr-only" onChange={event => { void chooseFile(event.target.files?.[0]); event.currentTarget.value = ""; }} />
  </div>;
}
