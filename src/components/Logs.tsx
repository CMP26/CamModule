import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { useSession } from "../context/AppContext";
import "./Logs.css";

export function Logs() {
  const { state, setAppMode, clearLogs } = useSession();
  const { studySessions, quizSessions } = state.sessionLogs;

  const totalStudyTime = studySessions.reduce((sum, s) => sum + s.totalTime, 0);
  const totalActiveTime = studySessions.reduce(
    (sum, s) => sum + s.activePresenceTime,
    0,
  );
  const totalInactiveTime = studySessions.reduce(
    (sum, s) => sum + s.inactiveTime,
    0,
  );
  const overallFocusPercentage =
    totalStudyTime > 0
      ? Math.round((totalActiveTime / totalStudyTime) * 100)
      : 0;

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m ${secs}s`;
    }
    return `${mins}m ${secs}s`;
  };

  const getFocusColor = (percentage: number) => {
    if (percentage < 50) return "#e74c3c";
    if (percentage < 65) return "#e67e22";
    if (percentage < 75) return "#f39c12";
    if (percentage < 85) return "#a9d961";
    return "#27ae60";
  };

  const getFocusLabel = (percentage: number) => {
    if (percentage < 50) return "Poor";
    if (percentage < 65) return "Fair";
    if (percentage < 75) return "Good";
    if (percentage < 85) return "Very Good";
    return "Excellent";
  };

  const studyData = [
    { name: "Active Time", value: totalActiveTime, color: "#27ae60" },
    { name: "Inactive Time", value: totalInactiveTime, color: "#e74c3c" },
  ];

  const hasLogs = studySessions.length > 0 || quizSessions.length > 0;

  return (
    <div className="logs-container">
      <div className="logs-header">
        <h1>📊 Analytics Dashboard</h1>
        <div className="header-actions">
          {hasLogs && (
            <button
              className="clear-btn"
              onClick={() => {
                if (
                  window.confirm(
                    "Are you sure you want to clear all logs? This cannot be undone.",
                  )
                ) {
                  clearLogs();
                }
              }}
            >
              🗑️ Clear Logs
            </button>
          )}
          <button className="back-btn" onClick={() => setAppMode("home")}>
            ← Back Home
          </button>
        </div>
      </div>

      {!hasLogs ? (
        <div className="no-data">
          <div className="no-data-content">
            <p className="no-data-icon">📭</p>
            <h2>No Data Yet</h2>
            <p>Start studying or take a quiz to see your analytics here!</p>
            <button
              className="primary-btn"
              onClick={() => setAppMode("learning")}
            >
              Start Learning →
            </button>
          </div>
        </div>
      ) : (
        <div className="logs-content">
          {studySessions.length > 0 && (
            <section className="logs-section">
              <h2>📚 Overall Study Focus</h2>

              <div className="metrics-grid">
                <div className="metric-card">
                  <div className="metric-label">Total Study Time</div>
                  <div className="metric-value">
                    {formatTime(totalStudyTime)}
                  </div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">Active Presence Time</div>
                  <div className="metric-value">
                    {formatTime(totalActiveTime)}
                  </div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">Inactive Time</div>
                  <div className="metric-value">
                    {formatTime(totalInactiveTime)}
                  </div>
                </div>
              </div>

              <div className="focus-display">
                <div className="focus-chart">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={studyData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ value, color }) => (
                          <text
                            x={0}
                            y={0}
                            fill={color}
                            textAnchor="middle"
                            dominantBaseline="middle"
                          >
                            {((value / totalStudyTime) * 100).toFixed(0)}%
                          </text>
                        )}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {studyData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => formatTime(value as number)}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="focus-percentage">
                  <div
                    className="percentage-circle"
                    style={{
                      borderColor: getFocusColor(overallFocusPercentage),
                    }}
                  >
                    <div className="percentage-value">
                      {overallFocusPercentage}%
                    </div>
                    <div className="percentage-label">Focus</div>
                  </div>
                  <div
                    className="focus-status"
                    style={{ color: getFocusColor(overallFocusPercentage) }}
                  >
                    {getFocusLabel(overallFocusPercentage)}
                  </div>
                </div>
              </div>

              <div className="study-sessions">
                <h3>Study Sessions</h3>
                <div className="sessions-list">
                  {studySessions.map((session, idx) => (
                    <div key={session.id} className="session-item">
                      <div className="session-number">Session {idx + 1}</div>
                      <div className="session-time">
                        {formatTime(session.totalTime)} total
                      </div>
                      <div className="session-breakdown">
                        <span className="active">
                          ✅ {formatTime(session.activePresenceTime)}
                        </span>
                        <span className="inactive">
                          ❌ {formatTime(session.inactiveTime)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {quizSessions.length > 0 && (
            <section className="logs-section">
              <h2>✏️ Exam Logs</h2>

              <div className="quiz-sessions">
                {quizSessions.map((quiz) => {
                  const totalQuizTime = quiz.totalTime;
                  const focusPercent =
                    totalQuizTime > 0
                      ? Math.round((quiz.gazeInTime / totalQuizTime) * 100)
                      : 0;
                  const gazeOutPercent =
                    totalQuizTime > 0
                      ? (quiz.gazeOutTime / totalQuizTime) * 100
                      : 0;
                  const isGood = gazeOutPercent < 10;

                  const pieData = [
                    {
                      name: "Looking In",
                      value: quiz.gazeInTime,
                      color: "#3498db",
                    },
                    {
                      name: "Looking Out",
                      value: quiz.gazeOutTime,
                      color: "#e74c3c",
                    },
                  ];

                  return (
                    <div key={quiz.id} className="quiz-card">
                      <div className="quiz-header-info">
                        <h3>{quiz.name}</h3>
                        <div
                          className={`quiz-status ${isGood ? "good" : "warning"}`}
                        >
                          {isGood ? "✅ Good" : "⚠️ Almost Cheating"}
                        </div>
                      </div>

                      <div className="quiz-metrics">
                        <div className="metric">
                          <span className="label">Duration</span>
                          <span className="value">
                            {formatTime(totalQuizTime)}
                          </span>
                        </div>
                        <div className="metric">
                          <span className="label">Gaze In</span>
                          <span className="value">
                            {formatTime(quiz.gazeInTime)}
                          </span>
                        </div>
                        <div className="metric">
                          <span className="label">Gaze Out</span>
                          <span className="value">
                            {formatTime(quiz.gazeOutTime)}
                          </span>
                        </div>
                        <div className="metric">
                          <span className="label">Focus %</span>
                          <span
                            className="value"
                            style={{ color: getFocusColor(focusPercent) }}
                          >
                            {focusPercent}%
                          </span>
                        </div>
                      </div>

                      {gazeOutPercent >= 10 && (
                        <div className="warning-alert">
                          ⚠️ Gaze-out time: {gazeOutPercent.toFixed(1)}% of
                          total time
                        </div>
                      )}

                      <div className="quiz-chart">
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={pieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                              label={({ name, value }) =>
                                `${name}: ${((value / totalQuizTime) * 100).toFixed(0)}%`
                              }
                            >
                              {pieData.map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={entry.color}
                                />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(value) => formatTime(value as number)}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
