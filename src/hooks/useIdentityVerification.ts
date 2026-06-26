import { useEffect, useRef, useState, type RefObject } from "react";
import type { UseIdentityOptions } from "../types";

type FaceApi = any;

let faceApiPromise: Promise<FaceApi> | null = null;

async function loadFaceApi(): Promise<FaceApi> {
  return (faceApiPromise =
    faceApiPromise ||
    (import("@vladmandic/face-api" as any) as Promise<any>).then(
      async (faceapi) => {
        const MODEL_URL =
          "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1/model";

        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        return faceapi as unknown as FaceApi;
      },
    ));
}

export interface UseIdentityVerificationReturn {
  identityVerified: boolean | null;
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

  useEffect(() => {
    loadFaceApi()
      .then((fa) => {
        faceApiRef.current = fa;
        setModelsReady(true);
      })
      .catch((e) => setError(String(e)));
  }, []);

  useEffect(() => {
    if (!modelsReady || !referenceImageUrl) return;
    const faceapi = faceApiRef.current!;

    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onerror = () => setError("Could not load reference image.");

    img.onload = async () => {
      try {
        const detection = await faceapi
          .detectSingleFace(img)
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (detection) {
          referenceDescriptorRef.current = detection.descriptor;
        } else {
          setError("No face found in reference image.");
        }
      } catch (e) {
        setError("Failed to process reference image: " + String(e));
      }
    };

    img.src = referenceImageUrl;
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

      if (liveDetection) {
        const distance = faceapi.euclideanDistance(
          referenceDescriptorRef.current,
          liveDetection.descriptor,
        );
        setIdentityVerified(distance < threshold);
      } else {
        setIdentityVerified(false);
        setError("No face detected in webcam.");
      }
    } catch (e) {
      setError("Verification error: " + String(e));
      setIdentityVerified(false);
    } finally {
      setVerifying(false);
    }
  };

  return {
    verifyNow,
    modelsReady,
    error,
    identityVerified,
    verifying,
  };
}
