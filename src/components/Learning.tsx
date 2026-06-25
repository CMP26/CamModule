import { useEffect, useRef, useState } from "react";
import { useCameraContext } from "../context/CameraContext";
import { useSession } from "../context/SessionContext";
import { useAttentionDetection } from "../hooks/useAttentionDetection";
import { useBrowserMonitor } from "../hooks/useBrowserMonitor";
import { useFaceMesh } from "../hooks/useFaceMesh";

type LearningStep = "select" | "article" | "video";

export function Learning() {
  const { dispatch, setAppMode } = useSession();
  const { videoRef, cameraReady } = useCameraContext();
  const [step, setStep] = useState<LearningStep>("select");
  const sessionActiveRef = useRef(false);
  const { isLookingAway, faceCount } = useFaceMesh(videoRef, cameraReady, {
    gracePeriodMs: 500,
  });
  const { isTabSwitched } = useBrowserMonitor();
  const { isAttentive, secondsUntilPause } = useAttentionDetection(
    {
      isLookingAway,
      faceCount,
      isTabSwitched,
    },
    {
      pauseAfterSeconds: 3,
      onPause: () => console.log("[Learning] Pausing video..."),
      onResume: () => console.log("[Learning] Resuming video..."),
    },
  );

  const activeTimeRef = useRef(0);
  const inactiveTimeRef = useRef(0);
  const isAttentiveRef = useRef(true);
  useEffect(() => {
    isAttentiveRef.current = isAttentive;
  }, [isAttentive]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!sessionActiveRef.current) return;

      if (isAttentiveRef.current) {
        activeTimeRef.current += 1000;
      } else {
        inactiveTimeRef.current += 1000;
      }

      dispatch({
        type: "UPDATE_STUDY_PRESENCE",
        payload: {
          activeTime: activeTimeRef.current,
          inactiveTime: inactiveTimeRef.current,
        },
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [dispatch]);

  useEffect(() => {
    if (step !== "select") {
      if (!sessionActiveRef.current) {
        activeTimeRef.current = 0;
        inactiveTimeRef.current = 0;
        dispatch({ type: "START_STUDY" });
        sessionActiveRef.current = true;
        console.log("[Learning] Session started automatically");
      }
    } else {
      if (sessionActiveRef.current) {
        dispatch({ type: "END_STUDY" });
        sessionActiveRef.current = false;
        console.log("[Learning] Session ended");
      }
    }
  }, [step, dispatch]);

  useEffect(() => {
    return () => {
      if (sessionActiveRef.current) {
        dispatch({ type: "END_STUDY" });
        sessionActiveRef.current = false;
        console.log("[Learning] Session ended (unmount)");
      }
    };
  }, [dispatch]);

  useEffect(() => {
    const iframe = document.getElementById("yt-player") as HTMLIFrameElement;
    if (!iframe) return;
    const command = isAttentive ? "playVideo" : "pauseVideo";
    iframe.contentWindow?.postMessage(
      JSON.stringify({ event: "command", func: command, args: [] }),
      "*",
    );
  }, [isAttentive]);

  const handleBackToHome = () => {
    setAppMode("home");
  };


  if (step === "select") {
    return (
      <div className="container">
        <h1>📚 Learning Mode</h1>
        <p className="subtitle">Choose what you want to learn</p>

        <div style={{ marginTop: 40, marginBottom: 40 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 20,
              maxWidth: 600,
            }}
          >
            <div
              onClick={() => {
                if (!cameraReady) {
                  alert("⚠️ Camera not ready. Please wait...");
                  return;
                }
                setStep("article");
              }}
              style={{
                padding: 30,
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                borderRadius: 12,
                cursor: cameraReady ? "pointer" : "not-allowed",
                color: "white",
                textAlign: "center",
                transition: "all 0.3s ease",
                opacity: cameraReady ? 1 : 0.6,
                transform: cameraReady ? "scale(1)" : "scale(0.95)",
              }}
              onMouseEnter={(e) => {
                if (cameraReady)
                  (e.currentTarget as HTMLDivElement).style.transform =
                    "scale(1.05)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform =
                  "scale(1)";
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 15 }}>📄</div>
              <h2 style={{ margin: 0, marginBottom: 10, fontSize: 24 }}>
                Article
              </h2>
              <p style={{ margin: 0, opacity: 0.9, fontSize: 14 }}>
                Read an article and stay focused
              </p>
            </div>

            <div
              onClick={() => {
                if (!cameraReady) {
                  alert("⚠️ Camera not ready. Please wait...");
                  return;
                }
                setStep("video");
              }}
              style={{
                padding: 30,
                background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                borderRadius: 12,
                cursor: cameraReady ? "pointer" : "not-allowed",
                color: "white",
                textAlign: "center",
                transition: "all 0.3s ease",
                opacity: cameraReady ? 1 : 0.6,
                transform: cameraReady ? "scale(1)" : "scale(0.95)",
              }}
              onMouseEnter={(e) => {
                if (cameraReady)
                  (e.currentTarget as HTMLDivElement).style.transform =
                    "scale(1.05)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform =
                  "scale(1)";
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 15 }}>🎬</div>
              <h2 style={{ margin: 0, marginBottom: 10, fontSize: 24 }}>
                Video
              </h2>
              <p style={{ margin: 0, opacity: 0.9, fontSize: 14 }}>
                Watch a video and pay attention
              </p>
            </div>
          </div>
        </div>

        {!cameraReady && (
          <div
            style={{
              padding: 15,
              background: "#fff3cd",
              borderRadius: 8,
              color: "#666",
              textAlign: "center",
            }}
          >
            ⏳ Waiting for camera to initialize...
          </div>
        )}

        <button
          className="secondary"
          onClick={handleBackToHome}
          style={{ marginTop: 20 }}
        >
          ← Back to Home
        </button>
      </div>
    );
  }

  if (step === "article") {
    return (
      <div className="container">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h1>📖 Reading Article</h1>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 10,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              padding: 10,
              background: faceCount > 0 ? "#d4edda" : "#f8d7da",
              borderRadius: 6,
              fontSize: 12,
              textAlign: "center",
            }}
          >
            <div style={{ fontWeight: "bold" }}>
              {faceCount > 0 ? "✓ Face" : "✗ No Face"}
            </div>
          </div>

          <div
            style={{
              padding: 10,
              background: !isLookingAway ? "#d4edda" : "#fff3cd",
              borderRadius: 6,
              fontSize: 12,
              textAlign: "center",
            }}
          >
            <div style={{ fontWeight: "bold" }}>
              {isLookingAway ? "⚠ Looking Away" : "✓ Focused"}
            </div>
          </div>

          <div
            style={{
              padding: 10,
              background: isAttentive ? "#d4edda" : "#f8d7da",
              borderRadius: 6,
              fontSize: 12,
              textAlign: "center",
            }}
          >
            <div style={{ fontWeight: "bold" }}>
              {isAttentive ? "✓ Attentive" : "✗ Distracted"}
            </div>
          </div>

          <div
            style={{
              padding: 10,
              background: !isTabSwitched ? "#d4edda" : "#f8d7da",
              borderRadius: 6,
              fontSize: 12,
              textAlign: "center",
            }}
          >
            <div style={{ fontWeight: "bold" }}>
              {isTabSwitched ? "✗ Tab Away" : "✓ Tab Focus"}
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 30 }}>
          <div
            style={{
              background: "#f9f9f9",
              padding: 25,
              borderRadius: 8,
              lineHeight: 1.8,
              color: "#555",
              borderLeft: "4px solid #667eea",
            }}
          >
            <h2 style={{ marginTop: 0, color: "#333" }}>
              Introduction to Machine Learning
            </h2>
            <p>
              Machine learning is a subset of artificial intelligence that
              focuses on the development of computer systems that can learn and
              improve from experience without being explicitly programmed.
              Instead of relying on step-by-step programming instructions,
              machine learning algorithms use data and feedback to recognize
              patterns and make decisions with minimal human intervention.
            </p>
            <h3 style={{ color: "#333", marginTop: 25 }}>Key Concepts</h3>
            <p>
              There are three main types of machine learning: supervised
              learning, unsupervised learning, and reinforcement learning.
              Supervised learning involves training a model on labeled data,
              where each example is paired with its correct answer. Unsupervised
              learning discovers hidden patterns in unlabeled data, while
              reinforcement learning trains models to make decisions through
              trial and error.
            </p>
            <p>
              Applications of machine learning are everywhere in modern life.
              From recommendation systems on streaming platforms to autonomous
              vehicles, from medical diagnosis to natural language processing,
              machine learning has become an essential technology that powers
              many of the applications we use daily.
            </p>
          </div>
        </div>

        {(isLookingAway || faceCount === 0 || isTabSwitched) && (
          <div
            style={{
              padding: 15,
              background: "#fff3cd",
              borderRadius: 8,
              color: "#856404",
              marginBottom: 20,
            }}
          >
            ⚠️ Alert: {isLookingAway && "Eyes looking away. "}
            {faceCount === 0 && "Face not detected. "}
            {isTabSwitched && "You switched to another tab. "}
          </div>
        )}

        {secondsUntilPause !== null && (
          <div
            style={{
              padding: 15,
              background: "#f8d7da",
              borderRadius: 8,
              color: "#721c24",
              marginBottom: 20,
              fontWeight: "bold",
            }}
          >
            ⏱️ Continuing distraction for {secondsUntilPause} more seconds will
            end the session.
          </div>
        )}

        <button className="secondary" onClick={() => setStep("select")}>
          ← Back to Learning Selection
        </button>
      </div>
    );
  }

  if (step === "video") {
    return (
      <div className="container">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h1>🎬 Watching Video</h1>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 10,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              padding: 10,
              background: faceCount > 0 ? "#d4edda" : "#f8d7da",
              borderRadius: 6,
              fontSize: 12,
              textAlign: "center",
            }}
          >
            <div style={{ fontWeight: "bold" }}>
              {faceCount > 0 ? "✓ Face" : "✗ No Face"}
            </div>
          </div>

          <div
            style={{
              padding: 10,
              background: !isLookingAway ? "#d4edda" : "#fff3cd",
              borderRadius: 6,
              fontSize: 12,
              textAlign: "center",
            }}
          >
            <div style={{ fontWeight: "bold" }}>
              {isLookingAway ? "⚠ Looking Away" : "✓ Focused"}
            </div>
          </div>

          <div
            style={{
              padding: 10,
              background: isAttentive ? "#d4edda" : "#f8d7da",
              borderRadius: 6,
              fontSize: 12,
              textAlign: "center",
            }}
          >
            <div style={{ fontWeight: "bold" }}>
              {isAttentive ? "▶ Playing" : "⏸ Paused"}
            </div>
          </div>

          <div
            style={{
              padding: 10,
              background: !isTabSwitched ? "#d4edda" : "#f8d7da",
              borderRadius: 6,
              fontSize: 12,
              textAlign: "center",
            }}
          >
            <div style={{ fontWeight: "bold" }}>
              {isTabSwitched ? "✗ Tab Away" : "✓ Tab Focus"}
            </div>
          </div>
        </div>

        <div className="video-player-wrapper" style={{ marginBottom: 30 }}>
          
          <iframe
            id="yt-player"
            width="100%"
            height="450"
            src="https://www.youtube.com/embed/GUv-nBm8-ds?enablejsapi=1&autoplay=1"
            title="Learning Video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ display: "block", borderRadius: 8 }}
          />
          
        </div>

        {(isLookingAway || faceCount === 0 || isTabSwitched) && (
          <div
            style={{
              padding: 15,
              background: "#fff3cd",
              borderRadius: 8,
              color: "#856404",
              marginBottom: 20,
            }}
          >
            ⚠️ Alert: {isLookingAway && "Eyes looking away. "}
            {faceCount === 0 && "Face not detected. "}
            {isTabSwitched && "You switched to another tab. "}
          </div>
        )}

        {secondsUntilPause !== null && (
          <div
            style={{
              padding: 15,
              background: "#f8d7da",
              borderRadius: 8,
              color: "#721c24",
              marginBottom: 20,
              fontWeight: "bold",
            }}
          >
            ⏱️ Video will pause in {secondsUntilPause} seconds if you don't
            refocus.
          </div>
        )}

        <button className="secondary" onClick={() => setStep("select")}>
          ← Back to Learning Selection
        </button>
      </div>
    );
  }

  return null;
}
