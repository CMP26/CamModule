import type { FaceMesh, Results } from "@mediapipe/face_mesh";
export type { Results };

let faceMeshInstance: FaceMesh | null = null;
let loadPromise: Promise<FaceMesh> | null = null;

export async function getFaceMesh(): Promise<FaceMesh> {
  if (faceMeshInstance) return faceMeshInstance;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const { FaceMesh: FM } = await import("@mediapipe/face_mesh");

    const fm = new FM({
      locateFile: (file: string) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    });

    fm.setOptions({
      maxNumFaces: 4,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    await fm.initialize();
    faceMeshInstance = fm;
    return fm;
  })();

  return loadPromise;
}