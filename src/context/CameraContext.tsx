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
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraReady, setCameraReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
        console.log("[CameraContext] Stopped track:", track.kind);
      });
      streamRef.current = null;
    }
    setCameraReady(false);
  }, []);

  const startCamera = useCallback(async () => {
    setError(null);
    setCameraReady(false);

    try {
      console.log("[CameraContext] Requesting camera access...");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
        audio: false,
      });

      streamRef.current = stream;
      console.log(
        "[CameraContext] Camera stream acquired, tracks:",
        stream.getTracks().length
      );

      const video = videoRef.current;
      if (!video) {
        setError("Video element not found");
        return;
      }

      video.srcObject = stream;

      return new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Video metadata load timeout"));
        }, 10000); 
        const onLoadedMetadata = () => {
          clearTimeout(timeout);
          console.log(
            "[CameraContext] Video metadata loaded, video ready to play"
          );

          video.removeEventListener("loadedmetadata", onLoadedMetadata);
          video.removeEventListener("error", onError);

          const playPromise = video.play();

          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                console.log("[CameraContext] Video playing successfully");
                setCameraReady(true);
                resolve();
              })
              .catch((err) => {
                console.error("[CameraContext] Play error:", err);
                setError(
                  "Could not play camera stream. Check browser permissions or try a different camera."
                );
                reject(err);
              });
          } else {
            console.log("[CameraContext] Using non-promise play()");
            setCameraReady(true);
            resolve();
          }
        };

        const onError = (event: Event) => {
          clearTimeout(timeout);
          console.error("[CameraContext] Video element error:", event);
          video.removeEventListener("loadedmetadata", onLoadedMetadata);
          video.removeEventListener("error", onError);

          const videoError = (video as HTMLVideoElement & { error?: MediaError | null }).error;
          const errorMsg = videoError
            ? `Video Error: ${videoError.message}`
            : "Video element error";

          setError(errorMsg);
          reject(new Error(errorMsg));
        };

        video.addEventListener("loadedmetadata", onLoadedMetadata);
        video.addEventListener("error", onError);
      });
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Camera access denied or not available";

      console.error("[CameraContext] Camera initialization failed:", msg);
      setError(msg);
      setCameraReady(false);

      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    console.log("[CameraContext] Mounting, starting camera...");
    startCamera().catch((err) => {
      console.error("[CameraContext] Start failed:", err);
    });

    return () => {
      console.log("[CameraContext] Unmounting, stopping camera...");
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  return (
    <CameraContext.Provider
      value={{
        videoRef,
        canvasRef,
        cameraReady,
        stream: streamRef.current,
        error,
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