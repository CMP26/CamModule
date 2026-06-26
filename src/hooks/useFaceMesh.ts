import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import type { UseGazeOptions } from "../types";
import { isGazingAway } from "../utils/gazeUtils";
import { getFaceMesh, type Results } from "../utils/mediapipeLoader";

export interface UseFaceMeshReturn {
  isLookingAway: boolean;
  faceCount: number;
  modelReady: boolean;
}

export function useFaceMesh(
  videoRef: RefObject<HTMLVideoElement>,
  cameraReady: boolean,
  options: UseGazeOptions = {},
): UseFaceMeshReturn {
  const { gracePeriodMs = 500 } = options;

  const [isLookingAway, setIsLookingAway] = useState(false);
  const [faceCount, setFaceCount] = useState(0);
  const [modelReady, setModelReady] = useState(false);

  const rafRef = useRef<number | null>(null);
  const awayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isCurrentlyAwayRef = useRef(false);

  const clearAwayTimer = () => {
    if (awayTimerRef.current !== null) {
      clearTimeout(awayTimerRef.current);
      awayTimerRef.current = null;
    }
  };

  const runLoop = useCallback(
    async (faceMesh: Awaited<ReturnType<typeof getFaceMesh>>) => {
      const currentVideo = videoRef.current;
      if (currentVideo && currentVideo.readyState >= 2) {
        await faceMesh.send({ image: currentVideo });
        rafRef.current = requestAnimationFrame(() => runLoop(faceMesh));
      } else {
        rafRef.current = requestAnimationFrame(() => runLoop(faceMesh));
      }
    },
    [videoRef],
  );

  useEffect(() => {
    if (!cameraReady) return;

    let cancelled = false;

    const initiateDistractionTimer = () => {
      if (!isCurrentlyAwayRef.current && awayTimerRef.current === null) {
        awayTimerRef.current = setTimeout(() => {
          isCurrentlyAwayRef.current = true;
          setIsLookingAway(true);
          awayTimerRef.current = null;
        }, gracePeriodMs);
      }
    };

    const setup = async () => {
      const faceMesh = await getFaceMesh();
      if (cancelled) return;

      faceMesh.onResults((results: Results) => {
        if (cancelled) return;

        const faces = results.multiFaceLandmarks ?? [];
        const absoluteFaceCount = faces.length;
        setFaceCount(absoluteFaceCount);

        if (absoluteFaceCount > 0) {
          const primaryLandmarks = faces[0];
          const leftEye = primaryLandmarks[226];
          const rightEye = primaryLandmarks[446];
          const faceWidth = Math.abs(rightEye.x - leftEye.x);

          let scale = 0.2 / faceWidth;
          if (scale < 0.6) scale = 0.6;
          if (scale > 1.8) scale = 1.8;

          const baseGazeThreshold = 0.15;
          const baseYawThreshold = 10;
          const basePitchThreshold = 10;

          const gazeThreshold = baseGazeThreshold * scale;
          const yawThreshold = baseYawThreshold * scale;
          const pitchThreshold = basePitchThreshold * scale;

          const gazingAway = isGazingAway(
            primaryLandmarks,
            gazeThreshold,
            yawThreshold,
            pitchThreshold,
          );

          console.log(
            `Face width: ${faceWidth.toFixed(3)}, Scale: ${scale.toFixed(2)}`,
          );

          if (!gazingAway) {
            clearAwayTimer();
            if (isCurrentlyAwayRef.current) {
              isCurrentlyAwayRef.current = false;
              setIsLookingAway(false);
            }
          } else {
            initiateDistractionTimer();
          }
        } else {
          initiateDistractionTimer();
        }
      });

      setModelReady(true);
      rafRef.current = requestAnimationFrame(() => runLoop(faceMesh));
    };

    setup();

    return () => {
      cancelled = true;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      clearAwayTimer();
    };
  }, [cameraReady, gracePeriodMs, runLoop]);

  const compiledStateReturn: UseFaceMeshReturn = {
    faceCount,
    modelReady,
    isLookingAway,
  };

  return compiledStateReturn;
}