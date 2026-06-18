import { useEffect, useState } from "react";
import {
  useAttentionDetection,
  useBrowserMonitor,
  useCamera,
  useFaceMesh,
  useIdentityVerification,
  type FocusLogEntry,
  type ProctoringState,
} from "./index";

function App() {
  const {
    videoRef,
    canvasRef,
    cameraReady,
    error: cameraError,
    stopCamera,
    restartCamera,
  } = useCamera({
    width: 640,
    height: 480,
  });

  const { isLookingAway, faceCount, modelReady } = useFaceMesh(
    videoRef,
    cameraReady,
  );

  const { isTabSwitched, tabSwitchCount, blurCount } = useBrowserMonitor();

  const { isAttentive, secondsUntilPause, focusLog, clearLog } =
    useAttentionDetection(
      { isLookingAway, faceCount, isTabSwitched },
      {
        pauseAfterSeconds: 5,
        onPause: () => console.log("Video paused"),
        onResume: () => console.log("Video resumed"),
      },
    );

  const { identityVerified } = useIdentityVerification(
    videoRef,
    null,
    cameraReady,
    { threshold: 0.55 },
  );

  const [proctoringState, setProctoringState] = useState<ProctoringState>({
    isLookingAway,
    faceCount,
    identityVerified: identityVerified ?? false,
    isTabSwitched,
    isAttentive,
    lastFocusLostAt:
      focusLog.length > 0 ? focusLog[focusLog.length - 1].timestamp : null,
    focusLog,
    cameraReady,
    warnings: [],
  });

  useEffect(() => {
    const warnings: string[] = [];
    if (!cameraReady) warnings.push("Camera not ready");
    if (faceCount === 0) warnings.push("No face detected");
    if (faceCount > 1)
      warnings.push(`${faceCount} faces detected (multiple people)`);
    if (isLookingAway) warnings.push("Gaze away from screen");
    if (isTabSwitched) warnings.push("Tab switched or window unfocused");
    if (!isAttentive) warnings.push("Student not attentive");

    setProctoringState({
      isLookingAway,
      faceCount,
      identityVerified: identityVerified ?? false,
      isTabSwitched,
      isAttentive,
      lastFocusLostAt:
        focusLog.length > 0 ? focusLog[focusLog.length - 1].timestamp : null,
      focusLog,
      cameraReady,
      warnings,
    });
  }, [
    isLookingAway,
    faceCount,
    identityVerified,
    isTabSwitched,
    isAttentive,
    focusLog,
    cameraReady,
  ]);

  const getLogTypeColor = (type: FocusLogEntry["type"]) => {
    const typeMap: Record<FocusLogEntry["type"], string> = {
      gaze_away: "👀",
      tab_switch: "🔄",
      multi_face: "👥",
      no_face: "❌",
      identity_fail: "🚫",
    };
    return typeMap[type] || "⚠️";
  };

  return (
    <div className="container">
      <h1>🎓 NexaLearn Proctoring Module 3</h1>
      <p className="subtitle">
        Real-time attention detection and proctoring system
      </p>

      {cameraError && (
        <div className="error">❌ Camera Error: {cameraError}</div>
      )}

      {/* Video Stream */}
      {/* <div className="video-container">
        {cameraReady ? (
          <video
            ref={videoRef}
            crossOrigin="anonymous"
            autoPlay
            muted
            playsInline
            className="active"
            style={{ objectFit: "cover", width: "100%", height: "100%" }}
          />
        ) : (
          <div className="video-placeholder">
            {!cameraError && (
              <p>
                Initializing camera...{" "}
                {!cameraReady && <span className="loading" />}
              </p>
            )}
          </div>
        )}
        <canvas ref={canvasRef} style={{ display: "none" }} />
      </div> */}
      {/* Video Stream */}
      <div className="video-container">
        {/* ALWAYS render the video element so useCamera can access it */}
        <video
          ref={videoRef}
          crossOrigin="anonymous"
          autoPlay
          muted
          playsInline
          className={cameraReady ? "active" : ""}
          style={{ objectFit: "cover", width: "100%", height: "100%" }}
        />

        {/* Show placeholder only while camera is initializing */}
        {!cameraReady && !cameraError && (
          <div className="video-placeholder" style={{ position: "absolute" }}>
            <p>
              Initializing camera... <span className="loading" />
            </p>
          </div>
        )}

        <canvas ref={canvasRef} style={{ display: "none" }} />
      </div>
      {/* System Status */}
      <div className="status-grid">
        <div className={`status-card ${cameraReady ? "success" : ""}`}>
          <h3>Camera Status</h3>
          <div className="value bool">{cameraReady ? "✅" : "⏳"}</div>
        </div>

        <div className={`status-card ${modelReady ? "success" : ""}`}>
          <h3>AI Model</h3>
          <div className="value bool">{modelReady ? "✅" : "⏳"}</div>
        </div>

        <div className={`status-card ${isAttentive ? "success" : "warning"}`}>
          <h3>Attentiveness</h3>
          <div className="value bool">
            {isAttentive ? "✅ Attentive" : "⚠️ Distracted"}
          </div>
        </div>

        <div
          className={`status-card ${secondsUntilPause !== null ? "warning" : "success"}`}
        >
          <h3>Pause Countdown</h3>
          <div className="value">
            {secondsUntilPause !== null ? `${secondsUntilPause}s` : "None"}
          </div>
        </div>

        <div
          className={`status-card ${faceCount === 1 ? "success" : "warning"}`}
        >
          <h3>Faces Detected</h3>
          <div className="value">{faceCount}</div>
        </div>

        <div className={`status-card ${isLookingAway ? "warning" : "success"}`}>
          <h3>Gaze Direction</h3>
          <div className="value bool">
            {isLookingAway ? "👀 Away" : "👁️ Forward"}
          </div>
        </div>

        <div className={`status-card ${isTabSwitched ? "warning" : "success"}`}>
          <h3>Tab Focus</h3>
          <div className="value bool">
            {isTabSwitched ? "🔄 Switched" : "✅ Focused"}
          </div>
        </div>

        <div
          className={`status-card ${tabSwitchCount > 0 ? "warning" : "success"}`}
        >
          <h3>Tab Switches</h3>
          <div className="value">{tabSwitchCount}</div>
        </div>

        <div className={`status-card ${blurCount > 0 ? "warning" : "success"}`}>
          <h3>Window Blurs</h3>
          <div className="value">{blurCount}</div>
        </div>
      </div>

      {/* Warnings */}
      {proctoringState.warnings.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          {proctoringState.warnings.map((warning, i) => (
            <div key={i} className="error">
              ⚠️ {warning}
            </div>
          ))}
        </div>
      )}

      {/* Focus Log */}
      {focusLog.length > 0 && (
        <div className="log-container">
          <h3>📋 Focus Loss Log</h3>
          <div>
            {focusLog.map((entry, idx) => (
              <div key={idx} className={`log-entry ${entry.type}`}>
                <strong>
                  {getLogTypeColor(entry.type)} {entry.type.replace(/_/g, " ")}
                </strong>
                <br />
                <small>{new Date(entry.timestamp).toLocaleTimeString()}</small>
                {entry.durationMs && (
                  <small> • {(entry.durationMs / 1000).toFixed(1)}s</small>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="button-group">
        <button className="primary" onClick={restartCamera}>
          🔄 Restart Camera
        </button>
        <button className="secondary" onClick={stopCamera}>
          ⏹️ Stop Camera
        </button>
        {focusLog.length > 0 && (
          <button className="secondary" onClick={clearLog}>
            🗑️ Clear Log
          </button>
        )}
      </div>

      {/* Info */}
      <div
        style={{
          marginTop: "30px",
          padding: "20px",
          backgroundColor: "#f5f5f5",
          borderRadius: "8px",
        }}
      >
        <h3 style={{ marginBottom: "10px" }}>ℹ️ How it works</h3>
        <ul style={{ lineHeight: "1.8", color: "#666", fontSize: "14px" }}>
          <li>
            ✅ <strong>Camera & Face Mesh:</strong> Uses MediaPipe for real-time
            face detection and landmark tracking
          </li>
          <li>
            ✅ <strong>Gaze Tracking:</strong> Detects when the student looks
            away from the screen
          </li>
          <li>
            ✅ <strong>Multi-face Detection:</strong> Warns if multiple people
            are detected
          </li>
          <li>
            ✅ <strong>Browser Monitoring:</strong> Tracks tab switches and
            window focus loss
          </li>
          <li>
            ✅ <strong>Attention Detection:</strong> 5-second countdown before
            pausing when student is distracted
          </li>
          <li>
            ✅ <strong>Focus Logging:</strong> Records all distractions with
            timestamps and durations
          </li>
        </ul>
      </div>
    </div>
  );
}

export default App;
