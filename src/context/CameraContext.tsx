// manages the camera feed for the proctoring stuff
import React, {
  createContext,
  useContext,
  ReactNode,
  useRef,
  useState,
  useCallback,
  useEffect,
} from "react";

interface CameraContextType {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  cameraReady: boolean;
  stream: MediaStream | null;
  error: string | null;
  stopCamera: () => void;
  restartCamera: () => void;
}

const CameraContext = createContext<CameraContextType | undefined>(undefined);

export const CameraProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRef = useRef<MediaStream | null>(null);

  const [ready, setReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    if (mediaRef.current) {
      mediaRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      mediaRef.current = null;
    }
    setReady(false);
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    setReady(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
        audio: false,
      });

      mediaRef.current = stream;

      const video = videoRef.current;
      if (!video) {
        setCameraError("Video element not found");
        return;
      }

      video.srcObject = stream;

      return new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Video load timed out"));
        }, 8000);

        const onLoadedMetadata = () => {
          clearTimeout(timeout);
          video.removeEventListener("loadedmetadata", onLoadedMetadata);
          video.removeEventListener("error", onError);

          const playPromise = video.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                setReady(true);
                resolve();
              })
              .catch((err) => {
                setCameraError("Could not play camera stream: " + err.message);
                reject(err);
              });
          } else {
            setReady(true);
            resolve();
          }
        };

        const onError = () => {
          clearTimeout(timeout);
          video.removeEventListener("loadedmetadata", onLoadedMetadata);
          video.removeEventListener("error", onError);

          const videoError = (video as HTMLVideoElement & { error?: MediaError | null }).error;
          setCameraError(videoError ? videoError.message : "Video element error");
          reject(new Error(videoError?.message || "Video element error"));
        };

        video.addEventListener("loadedmetadata", onLoadedMetadata);
        video.addEventListener("error", onError);
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Camera access denied";
      setCameraError(msg);
      setReady(false);

      if (mediaRef.current) {
        mediaRef.current.getTracks().forEach((track) => track.stop());
        mediaRef.current = null;
      }
    }
  }, []);

  useEffect(() => {
    startCamera().catch(() => {});
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  return (
    <CameraContext.Provider
      value={{
        videoRef,
        canvasRef,
        cameraReady: ready,
        stream: mediaRef.current,
        error: cameraError,
        stopCamera,
        restartCamera: startCamera,
      }}
    >
      {children}
    </CameraContext.Provider>
  );
};

export const useCameraContext = () => {
  const ctx = useContext(CameraContext);
  if (!ctx) {
    throw new Error("useCameraContext must be used within CameraProvider");
  }
  return ctx;
};