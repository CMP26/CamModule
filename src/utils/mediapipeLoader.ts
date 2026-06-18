// ============================================================
// Utility — MediaPipe FaceMesh Loader
// Lazily loads @mediapipe/face_mesh from CDN so the bundle
// stays small and the model is cached after first load.
// ============================================================

import type { FaceMesh, Results } from "@mediapipe/face_mesh";

export type { Results };

let faceMeshInstance: FaceMesh | null = null;
let loadPromise: Promise<FaceMesh> | null = null;

export async function getFaceMesh(): Promise<FaceMesh> {
  if (faceMeshInstance) return faceMeshInstance;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    // Dynamic import — @mediapipe/face_mesh must be in package.json
    const { FaceMesh: FM } = await import("@mediapipe/face_mesh");

    const fm = new FM({
      locateFile: (file: string) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    });

    fm.setOptions({
      maxNumFaces: 4,           // detect up to 4 faces for multi-person check
      refineLandmarks: true,    // enables iris landmarks (468–477)
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    await fm.initialize();
    faceMeshInstance = fm;
    return fm;
  })();

  return loadPromise;
}