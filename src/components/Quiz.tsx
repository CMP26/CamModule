import { useEffect, useRef, useState } from "react";
import { useSession } from "../context/AppContext";
import { useCameraContext } from "../context/CameraContext";
import { useBrowserMonitor } from "../hooks/useBrowserMonitor";
import { useFaceMesh } from "../hooks/useFaceMesh";
import "./Quiz.css";
const QUESTIONS = [
  {
    question: "Question 1: What is the capital of France?",
    options: ["A) London", "B) Paris", "C) Berlin"],
    correct: "b",
    name: "q1",
  },
  {
    question: "Question 2: Which planet is closest to the sun?",
    options: ["A) Venus", "B) Mercury", "C) Mars"],
    correct: "b",
    name: "q2",
  },
];

export function Quiz() {
  const { state, dispatch, setAppMode } = useSession();
  const { cameraReady } = useCameraContext();

  const quizStartedRef = useRef(false);

  const submittedRef = useRef(false);

  const [answers, setAnswers] = useState<Record<string, string>>({});

  const [grade, setGrade] = useState<{ score: number; total: number } | null>(
    null,
  );

  const { isLookingAway, faceCount } = useFaceMesh(
    useCameraContext().videoRef,
    cameraReady,
    { gracePeriodMs: 300 },
  );

  const { isTabSwitched } = useBrowserMonitor();

  const gazeInRef = useRef(0);
  const gazeOutRef = useRef(0);
  const isAttentiveRef = useRef(true);

  const isDistracted = isLookingAway || isTabSwitched || faceCount === 0;
  useEffect(() => {
    isAttentiveRef.current = !isDistracted;
  }, [isDistracted]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!state.currentQuizSession) return;

      if (isAttentiveRef.current) {
        gazeInRef.current += 1000;
      } else {
        gazeOutRef.current += 1000;
      }

      dispatch({
        type: "UPDATE_QUIZ_GAZE",
        payload: {
          gazeInTime: gazeInRef.current,
          gazeOutTime: gazeOutRef.current,
        },
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [dispatch, state.currentQuizSession]);

  useEffect(() => {
    if (!quizStartedRef.current && cameraReady) {
      dispatch({
        type: "START_QUIZ",
        payload: {
          name: "Quiz Session",
        },
      });
      quizStartedRef.current = true;
      console.log("[Quiz] Session started");
    }
  }, [cameraReady, dispatch]);

  useEffect(() => {
    return () => {
      if (quizStartedRef.current && !submittedRef.current) {
        dispatch({ type: "DISCARD_QUIZ" } as any);
        console.log("[Quiz] Session discarded (unmount without submit)");
      }
    };
  }, [dispatch]);

  const handleSubmit = () => {
    let correct = 0;
    QUESTIONS.forEach((q) => {
      if (answers[q.name] === q.correct) correct++;
    });

    submittedRef.current = true;

    dispatch({ type: "END_QUIZ" });

    setGrade({ score: correct, total: QUESTIONS.length });

    console.log(`[Quiz] Submitted — Score: ${correct}/${QUESTIONS.length}`);
  };

  const handleExitWithoutSubmit = () => {
    if (
      confirm(
        "Exit quiz without submitting? Your quiz will NOT be saved to logs.",
      )
    ) {
      submittedRef.current = false;
      dispatch({ type: "DISCARD_QUIZ" } as any);
      quizStartedRef.current = false;
      setAppMode("home");
    }
  };

  if (grade !== null) {
    const percentage = Math.round((grade.score / grade.total) * 100);
    const isPassed = percentage >= 50;

    return (
      <div className="quiz-results">
        <div className="results-card">
          <h1 style={{ margin: "0 0 25px 0" }}>🎉 Quiz Submitted!</h1>

          <div className="score-display">
            <div className="score-circle">
              <span className="score-percentage">{percentage}%</span>
              <span className="score-label">SCORE</span>
            </div>
          </div>

          <div className="results-stats">
            <div className="stat">
              <div style={{ fontSize: 12, color: "#555", marginBottom: 5 }}>
                CORRECT
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#333" }}>
                {grade.score}
              </div>
            </div>
            <div className="stat">
              <div style={{ fontSize: 12, color: "#555", marginBottom: 5 }}>
                TOTAL
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#333" }}>
                {grade.total}
              </div>
            </div>
            <div className="stat">
              <div style={{ fontSize: 12, color: "#555", marginBottom: 5 }}>
                WRONG
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#333" }}>
                {grade.total - grade.score}
              </div>
            </div>
          </div>

          <div className="results-divider" />

          <div
            className={`status-box ${isPassed ? "good" : "warning"}`}
            style={{ textAlign: "center", margin: "20px 0" }}
          >
            {isPassed
              ? "✅ Passed! Great job!"
              : "⚠️ Below passing score. Keep studying!"}
          </div>

          <p
            style={{
              color: "#666",
              fontSize: 12,
              margin: "15px 0 25px 0",
              textAlign: "center",
            }}
          >
            Your attention data has been saved to Analytics.
          </p>

          <div className="results-buttons">
            <button
              className="results-btn-home"
              onClick={() => setAppMode("home")}
            >
              ← Back to Home
            </button>
            <button
              className="results-btn-logs"
              onClick={() => setAppMode("logs")}
            >
              📊 View Analytics
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <h1>🧪 Quiz</h1>
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
            background: faceCount === 1 ? "#d4edda" : "#f8d7da",
            borderRadius: 6,
            fontSize: 12,
            textAlign: "center",
          }}
        >
          <div style={{ fontWeight: "bold" }}>
            {faceCount === 1 ? "✓ Only You" : `✗ ${faceCount} faces`}
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
            {isLookingAway ? "⚠ Away" : "✓ Focused"}
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
            {isTabSwitched ? "✗ Away" : "✓ Tab Focus"}
          </div>
        </div>

        <div
          style={{
            padding: 10,
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            borderRadius: 6,
            fontSize: 12,
            textAlign: "center",
            color: "white",
          }}
        >
          <div style={{ fontWeight: "bold" }}>
            {state.currentQuizSession
              ? `⏱ ${Math.round(
                  (Date.now() - state.currentQuizSession.startTime) / 1000,
                )}s`
              : "0s"}
          </div>
        </div>
      </div>

      {QUESTIONS.map((q) => (
        <div
          key={q.name}
          style={{
            background: "#f9f9f9",
            padding: 25,
            borderRadius: 8,
            marginBottom: 25,
          }}
        >
          <h2 style={{ marginTop: 0 }}>{q.question}</h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {q.options.map((opt) => {
              const val = opt[0].toLowerCase();
              const isSelected = answers[q.name] === val;
              return (
                <label
                  key={val}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: 12,
                    background: isSelected ? "#f0f4ff" : "white",
                    borderRadius: 6,
                    border: isSelected ? "2px solid #667eea" : "1px solid #ddd",
                    cursor: "pointer",
                    fontWeight: isSelected ? 600 : 400,
                    transition: "all 0.2s ease",
                  }}
                >
                  <input
                    type="radio"
                    name={q.name}
                    value={val}
                    checked={isSelected}
                    onChange={() =>
                      setAnswers((prev) => ({ ...prev, [q.name]: val }))
                    }
                  />
                  <span>{opt}</span>
                </label>
              );
            })}
          </div>
        </div>
      ))}

      {faceCount !== 1 && (
        <div
          style={{
            padding: 15,
            background: "#f8d7da",
            borderRadius: 8,
            color: "#721c24",
            marginBottom: 20,
          }}
        >
          ⚠️ {faceCount === 0 ? "Face not detected" : "Multiple faces detected"}
          . You must be alone.
        </div>
      )}

      {isLookingAway && (
        <div
          style={{
            padding: 15,
            background: "#fff3cd",
            borderRadius: 8,
            color: "#856404",
            marginBottom: 20,
          }}
        >
          ⚠️ You are looking away. Stay focused on the quiz.
        </div>
      )}

      {isTabSwitched && (
        <div
          style={{
            padding: 15,
            background: "#f8d7da",
            borderRadius: 8,
            color: "#721c24",
            marginBottom: 20,
          }}
        >
          ⚠️ You switched to another tab. Stay focused on the quiz.
        </div>
      )}

      <div className="button-group">
        <button className="primary" onClick={handleSubmit}>
          ✅ Submit Quiz
        </button>

        <button className="secondary" onClick={handleExitWithoutSubmit}>
          Exit Without Submitting
        </button>
      </div>
    </div>
  );
}
