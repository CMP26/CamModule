import type {
  GlobalAction,
  GlobalState,
  QuizSession,
  SessionLogs,
  StudySession,
} from "../types/sessionTypes";


// it handles the state pipeline for exam (quiz) and lesson proctoring logs
 
export function globalReducer(
  state: GlobalState,
  action: GlobalAction,
): GlobalState {
  switch (action.type) {
    case "SET_MODE": {
      const mode =
        action.payload &&
        typeof action.payload === "object" &&
        "appMode" in action.payload
          ? action.payload.appMode
          : action.payload;
      return { ...state, appMode: mode };
    }

    case "TOGGLE_CAMERA":
      return { ...state, cameraVisible: !state.cameraVisible };

    case "START_STUDY": {
      const newSession: StudySession = {
        id: `study_${Date.now()}`,
        startTime: Date.now(),
        endTime: null,
        totalTime: 0,
        activePresenceTime: 0,
        inactiveTime: 0,
      };
      return { ...state, currentStudySession: newSession };
    }

    case "END_STUDY": {
      if (!state.currentStudySession) return state;
      const now = Date.now();
      const endedSession: StudySession = {
        ...state.currentStudySession,
        endTime: now,
        totalTime:
          state.currentStudySession.activePresenceTime +
          state.currentStudySession.inactiveTime,
      };
      return {
        ...state,
        currentStudySession: null,
        sessionLogs: {
          ...state.sessionLogs,
          studySessions: [...state.sessionLogs.studySessions, endedSession],
        },
      };
    }

    case "UPDATE_STUDY_PRESENCE": {
      if (!state.currentStudySession) return state;
      const { activeTime, inactiveTime } = action.payload;
      return {
        ...state,
        currentStudySession: {
          ...state.currentStudySession,
          activePresenceTime: activeTime,
          inactiveTime: inactiveTime,
        },
      };
    }

    case "START_QUIZ": {
      const { name, timeLimit } = action.payload;
      const newQuiz: QuizSession = {
        id: `quiz_${Date.now()}`,
        name: name ?? "Quiz Session",
        startTime: Date.now(),
        endTime: null,
        totalTime: 0,
        gazeInTime: 0,
        gazeOutTime: 0,
        timeLimit,
        focusPercentage: 0,
        status: "good",
      };
      return { ...state, currentQuizSession: newQuiz };
    }

    case "END_QUIZ": {
      if (!state.currentQuizSession) return state;
      const now = Date.now();
      const totalTime = now - state.currentQuizSession.startTime;
      const endedQuiz: QuizSession = {
        ...state.currentQuizSession,
        endTime: now,
        totalTime,
        focusPercentage:
          totalTime > 0
            ? (state.currentQuizSession.gazeInTime / totalTime) * 100
            : 0,
        status:
          totalTime > 0 &&
          state.currentQuizSession.gazeOutTime / totalTime > 0.1
            ? "almost_cheating"
            : "good",
      };
      return {
        ...state,
        currentQuizSession: null,
        sessionLogs: {
          ...state.sessionLogs,
          quizSessions: [...state.sessionLogs.quizSessions, endedQuiz],
        },
      };
    }

    case "UPDATE_QUIZ_GAZE": {
      if (!state.currentQuizSession) return state;
      const { gazeInTime, gazeOutTime } = action.payload;
      return {
        ...state,
        currentQuizSession: {
          ...state.currentQuizSession,
          gazeInTime,
          gazeOutTime,
        },
      };
    }

    case "LOAD_LOGS": {
      const incoming: SessionLogs = action.payload;
      const mergedStudy = [
        ...state.sessionLogs.studySessions,
        ...incoming.studySessions.filter(
          (s) => !state.sessionLogs.studySessions.some((e) => e.id === s.id),
        ),
      ];
      const mergedQuiz = [
        ...state.sessionLogs.quizSessions,
        ...incoming.quizSessions.filter(
          (q) => !state.sessionLogs.quizSessions.some((e) => e.id === q.id),
        ),
      ];
      return {
        ...state,
        sessionLogs: {
          ...state.sessionLogs,
          studySessions: mergedStudy,
          quizSessions: mergedQuiz,
        },
      };
    }

    case "CLEAR_LOGS":
      return {
        ...state,
        sessionLogs: {
          sessionId: state.sessionId,
          studySessions: [],
          quizSessions: [],
          createdAt: Date.now(),
        },
      };

    default:
      return state;
  }
}
