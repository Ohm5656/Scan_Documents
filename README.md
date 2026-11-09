# Certificate Scanner

A mobile-first, privacy-preserving web app for turning a certificate photo into a straightened, enhanced PDF or PNG. Image capture, edge detection, perspective correction, enhancement, and export all happen in the browser. No certificate image is uploaded or stored by this app.

## Features

- Camera capture with an environment-facing camera preference, plus image-library fallback
- Live low-frequency OpenCV.js quadrilateral detection to guide framing
- Automatic edge detection after capture, with a four-handle manual corner editor as the reliable fallback
- OpenCV perspective transform with replicated borders (avoids black transformed edges)
- Original, colour-preserving certificate, and high-contrast document enhancement modes
- A4 portrait or landscape image-based PDF export and high-quality PNG export
- Camera-track and object-URL cleanup on reset/unmount

## Getting started

```bash
npm install --legacy-peer-deps
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Camera access requires HTTPS or localhost and user permission. On a phone, **Choose image** can invoke the native rear camera through the `capture="environment"` input fallback.

## Commands

```bash
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
```

Run `npx playwright install chromium` once before the browser test if Playwright has not installed its browser locally.

## Browser support and limitations

Current Chromium, Firefox, and Safari browsers with Canvas, WebAssembly, and `getUserMedia` support are targeted. Camera capture is best tested on a real phone because device camera settings and permissions vary. The app favours the largest clear quadrilateral: when a photograph contains a decorative frame, glass reflections, or multiple rectangles, use the manual corners to select the actual certificate boundary. The exported PDF is intentionally image-based; it does not alter or recreate certificate text, logos, seals, or signatures.
