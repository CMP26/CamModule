// ============================================================
// Task 1.2 — useIdentityVerification
// Compares a reference photo to live webcam frames using
// face-api.js 128-D face descriptors.
// ============================================================
import { useEffect, useRef, useState, type RefObject } from "react";
import type { UseIdentityOptions } from "../types";

// face-api.js is loaded from CDN to keep bundle light.
// We cast to any for the dynamic import shape.
type FaceApi = any;

let faceApiPromise: Promise<FaceApi> | null = null;

async function loadFaceApi(): Promise<FaceApi> {
  if (!faceApiPromise) {
    faceApiPromise = (
      import("@vladmandic/face-api" as any) as Promise<any>
    ).then(async (faceapi) => {
      const MODEL_URL =
        "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1/model";
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
      return faceapi as unknown as FaceApi;
    });
  }
  return faceApiPromise;
}

export interface UseIdentityVerificationReturn {
  identityVerified: boolean | null; // null = not checked yet
  verifying: boolean;
  verifyNow: () => Promise<void>;
  modelsReady: boolean;
  error: string | null;
}

export function useIdentityVerification(
  videoRef: RefObject<HTMLVideoElement>,
  referenceImageUrl: string | null,
  cameraReady: boolean,
  options: UseIdentityOptions = {},
): UseIdentityVerificationReturn {
  const { threshold = 0.55 } = options;

  const [identityVerified, setIdentityVerified] = useState<boolean | null>(
    null,
  );
  const [verifying, setVerifying] = useState(false);
  const [modelsReady, setModelsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const faceApiRef = useRef<FaceApi | null>(null);
  const referenceDescriptorRef = useRef<Float32Array | null>(null);

  // Load models on mount
  useEffect(() => {
    loadFaceApi()
      .then((fa) => {
        faceApiRef.current = fa;
        setModelsReady(true);
      })
      .catch((e) => setError(String(e)));
  }, []);

  // Pre-compute reference descriptor whenever referenceImageUrl changes
  useEffect(() => {
    if (!modelsReady || !referenceImageUrl) return;
    const faceapi = faceApiRef.current!;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = referenceImageUrl;
    img.onload = async () => {
      try {
        const detection = await faceapi
          .detectSingleFace(img)
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (!detection) {
          setError("No face found in reference image.");
          return;
        }
        referenceDescriptorRef.current = detection.descriptor;
      } catch (e) {
        setError("Failed to process reference image: " + String(e));
      }
    };
    img.onerror = () => setError("Could not load reference image.");
  }, [modelsReady, referenceImageUrl]);

  const verifyNow = async () => {
    if (!cameraReady || !faceApiRef.current || !videoRef.current) return;
    if (!referenceDescriptorRef.current) {
      setError("Reference image not processed yet.");
      return;
    }

    setVerifying(true);
    setError(null);

    try {
      const faceapi = faceApiRef.current;
      const liveDetection = await faceapi
        .detectSingleFace(videoRef.current)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!liveDetection) {
        setIdentityVerified(false);
        setError("No face detected in webcam.");
        setVerifying(false);
        return;
      }

      const distance = faceapi.euclideanDistance(
        referenceDescriptorRef.current,
        liveDetection.descriptor,
      );

      // distance < threshold means faces are similar enough
      setIdentityVerified(distance < threshold);
    } catch (e) {
      setError("Verification error: " + String(e));
      setIdentityVerified(false);
    } finally {
      setVerifying(false);
    }
  };

  return { identityVerified, verifying, verifyNow, modelsReady, error };
}
