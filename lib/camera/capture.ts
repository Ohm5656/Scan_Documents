export async function captureVideoFrame(video: HTMLVideoElement): Promise<Blob> {
  if (!video.videoWidth || !video.videoHeight) throw new Error("Camera is not ready yet.");
  const stream = video.srcObject instanceof MediaStream ? video.srcObject : null;
  const ImageCaptureApi = (window as any).ImageCapture as (new (track: MediaStreamTrack) => { takePhoto: () => Promise<Blob> }) | undefined;
  const track = stream?.getVideoTracks()[0];
  // When supported, this bypasses the preview stream and preserves the camera's still-photo resolution.
  if (ImageCaptureApi && track) {
    try { return await new ImageCaptureApi(track).takePhoto(); } catch { /* Fall through to the reliable video-frame path. */ }
  }
  const canvas = document.createElement("canvas"); canvas.width = video.videoWidth; canvas.height = video.videoHeight;
  canvas.getContext("2d")!.drawImage(video, 0, 0);
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("Could not capture the camera frame.")), "image/jpeg", 0.97));
}
