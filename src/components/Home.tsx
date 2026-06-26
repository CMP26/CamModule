import { useSession } from "../context/AppContext";
import "./Home.css";

export function Home() {
  const { setAppMode } = useSession();

  return (
    <div className="home-container">
      <div className="home-content">
        <div className="home-header">
          <h1>📚 NexaLearn Dashboard</h1>
          <p>Interactive learning with intelligent proctoring</p>
        </div>

        <div className="home-grid">
          <button className="home-card" onClick={() => setAppMode("learning")}>
            <div className="card-icon">📖</div>
            <h2>Study Content</h2>
            <p>Watch videos or read articles with presence tracking</p>
            <span className="card-action">Start Learning →</span>
          </button>

          <button className="home-card" onClick={() => setAppMode("quiz")}>
            <div className="card-icon">✏️</div>
            <h2>Take Quiz</h2>
            <p>Test your knowledge with gaze tracking and analytics</p>
            <span className="card-action">Start Quiz →</span>
          </button>

          <button className="home-card" onClick={() => setAppMode("logs")}>
            <div className="card-icon">📊</div>
            <h2>View Analytics</h2>
            <p>See your study focus and exam performance metrics</p>
            <span className="card-action">View Logs →</span>
          </button>

          <div className="home-card info-card">
            <div className="card-icon">💡</div>
            <h2>How It Works</h2>
            <ul>
              <li>📷 Your camera monitors your presence</li>
              <li>👁️ Gaze tracking ensures focus</li>
              <li>⚡ Real-time feedback & reminders</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
