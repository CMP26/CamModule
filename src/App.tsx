// ============================================================
// App.tsx — FINAL FIXED VERSION
// - Video element HIDDEN (only for MediaPipe processing)
// - FloatingCamera is the ONLY visible camera display
// ============================================================

import "./App.css";
import { Home } from "./components/Home";
import { Learning } from "./components/Learning";
import { Logs } from "./components/Logs";
import { Quiz } from "./components/Quiz";
import { SessionProvider, useSession } from "./context/SessionContext";
import { CameraProvider, useCameraContext } from "./context/CameraContext";

function AppContent() {
  const { state } = useSession();
  const { videoRef, canvasRef, cameraReady, error } = useCameraContext();

  return (
    <div className="app-wrapper">
      {/* ========== HIDDEN VIDEO ELEMENT ========== */}
      {/* This video is HIDDEN - only used for MediaPipe processing */}
      {/* The FloatingCamera window is the ONLY visible camera display */}
      <video
        ref={videoRef}
        crossOrigin="anonymous"
        autoPlay
        muted
        playsInline
        style={{
          display: 'none', // ← HIDDEN (was 'block' before)
        }}
        data-testid="shared-video-element"
      />
      <canvas
        ref={canvasRef}
        style={{ display: 'none' }}
        data-testid="shared-canvas-element"
      />

      {/* ========== DEBUG INFO (TOP-LEFT) ========== */}
      {error && (
        <div
          style={{
            position: 'fixed',
            top: 10,
            right: 10,
            background: '#ff6b6b',
            color: 'white',
            padding: '10px 15px',
            borderRadius: 4,
            fontSize: 12,
            zIndex: 10000,
          }}
        >
          ❌ Camera Error: {error}
        </div>
      )}
      {!cameraReady && (
        <div
          style={{
            position: 'fixed',
            top: 10,
            left: 10,
            background: '#ffd93d',
            color: '#333',
            padding: '10px 15px',
            borderRadius: 4,
            fontSize: 12,
            zIndex: 10000,
          }}
        >
          🎥 Initializing camera...
        </div>
      )}
      {cameraReady && (
        <div
          style={{
            position: 'fixed',
            top: 10,
            left: 10,
            background: '#51cf66',
            color: 'white',
            padding: '10px 15px',
            borderRadius: 4,
            fontSize: 12,
            zIndex: 10000,
          }}
        >
          ✓ Camera ready
        </div>
      )}

      {/* ========== MAIN CONTENT ========== */}
      {state.appMode === "home" && <Home />}
      {state.appMode === "learning" && <Learning />}
      {state.appMode === "quiz" && <Quiz />}
      {state.appMode === "logs" && <Logs />}

    </div>
  );
}

function App() {
  return (
    <CameraProvider>
      <SessionProvider>
        <AppContent />
      </SessionProvider>
    </CameraProvider>
  );
}

export default App;