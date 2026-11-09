"use client";
import { useCallback, useEffect, useRef, useState } from "react";

type CameraStatus = "idle" | "loading" | "ready" | "error";
const constraints: MediaStreamConstraints = { audio: false, video: { facingMode: { ideal: "environment" }, width: { ideal: 3840 }, height: { ideal: 2160 } } };

function friendlyCameraError(error: unknown) {
  const name = error instanceof DOMException ? error.name : "";
  if (name === "NotAllowedError" || name === "SecurityError") return "Camera permission was denied. Choose an image instead or allow camera access in browser settings.";
  if (name === "NotFoundError") return "No camera was found on this device.";
  if (!navigator.mediaDevices?.getUserMedia) return "This browser does not support camera capture. Choose an image instead.";
  return "The camera could not be started. Please try again or choose an image.";
}

export function useCamera(videoRef: React.RefObject<HTMLVideoElement | null>) {
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<CameraStatus>("idle"); const [error, setError] = useState<string | null>(null);
  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach(track => track.stop()); streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null; setStatus("idle");
  }, [videoRef]);
  const start = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) { setError("This browser does not support camera capture. Choose an image instead."); setStatus("error"); return; }
    stop(); setStatus("loading"); setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints); streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
      setStatus("ready");
    } catch (caught) { setError(friendlyCameraError(caught)); setStatus("error"); }
  }, [stop, videoRef]);
  useEffect(() => stop, [stop]);
  return { status, error, start, stop, stream: streamRef };
}
