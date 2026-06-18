// ============================================================
// Task 1.1 — useCamera
// Initializes and manages the user's webcam stream safely.
// ============================================================
import { useEffect, useRef, useState, useCallback } from "react";
import type { UseCameraOptions } from "../types";

export interface UseCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  stream: MediaStream | null;
  cameraReady: boolean;
  error: string | null;
  stopCamera: () => void;
  restartCamera: () => void;
}

export function useCamera(options: UseCameraOptions = {}): UseCameraReturn {
  const { width = 640, height = 480, facingMode = "user" } = options;

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraReady, setCameraReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraReady(false);
  }, []);

  const startCamera = useCallback(async () => {
    setError(null);
    setCameraReady(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width, height, facingMode },
        audio: false,
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraReady(true);
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Camera access denied";
      setError(msg);
      console.error("[useCamera]", msg);
    }
  }, [width, height, facingMode]);

  // Start on mount, clean up on unmount
  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  return {
    videoRef,
    canvasRef,
    stream: streamRef.current,
    cameraReady,
    error,
    stopCamera,
    restartCamera: startCamera,
  };
}