// handles study, quiz, and log state
import type {
  GlobalAction,
  GlobalState,
  QuizSession,
  SessionLogs,
  StudySession,
} from "../types/sessionTypes";

export function reducer(state: GlobalState, action: GlobalAction): GlobalState {
  switch (action.type) {

    case "TOGGLE_CAMERA":
      return { ...state, cameraVisible: !state.cameraVisible };

    case "SET_MODE": {
      const targetPayload = action.payload;
      const mode = targetPayload && typeof targetPayload === "object" && "appMode" in targetPayload
        ? targetPayload.appMode
        : targetPayload;
      return { ...state, appMode: mode };
    }

    case "START_QUIZ": {
      const { name, timeLimit } = action.payload;
      const freshQuiz: QuizSession = {
        id: "quiz_" + Date.now(),
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
      return { ...state, currentQuizSession: freshQuiz };
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

    case "END_QUIZ": {
      const activeQuizRecord = state.currentQuizSession;
      if (!activeQuizRecord) return state;
      
      const now = Date.now();
      const totalGazeTime = activeQuizRecord.gazeInTime + activeQuizRecord.gazeOutTime;

      let rawFocusScore = 0;
      let flaggedBehaviorStatus: QuizSession["status"] = "good";

      if (totalGazeTime > 0) {
        rawFocusScore = (activeQuizRecord.gazeInTime / totalGazeTime) * 100;
        if (activeQuizRecord.gazeOutTime / totalGazeTime > 0.1) {
          flaggedBehaviorStatus = "almost_cheating";
        }
      }

      const completed: QuizSession = {
        ...activeQuizRecord,
        endTime: now,
        totalTime: totalGazeTime,
        focusPercentage: rawFocusScore,
        status: flaggedBehaviorStatus,
      };
      
      return {
        ...state,
        currentQuizSession: null,
        sessionLogs: {
          ...state.sessionLogs,
          quizSessions: [...state.sessionLogs.quizSessions, completed],
        },
      };
    }

    case "START_STUDY": {
      const newSession: StudySession = {
        id: "study_" + Date.now(),
        startTime: Date.now(),
        endTime: null,
        totalTime: 0,
        activePresenceTime: 0,
        inactiveTime: 0,
      };
      return { ...state, currentStudySession: newSession };
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

    case "END_STUDY": {
      const activeStudyRecord = state.currentStudySession;
      if (!activeStudyRecord) return state;
      
      const now = Date.now();
      const ended: StudySession = {
        ...activeStudyRecord,
        endTime: now,
        totalTime: activeStudyRecord.activePresenceTime + activeStudyRecord.inactiveTime,
      };
      return {
        ...state,
        currentStudySession: null,
        sessionLogs: {
          ...state.sessionLogs,
          studySessions: [...state.sessionLogs.studySessions, ended],
        },
      };
    }

    case "LOAD_LOGS": {
      const incoming: SessionLogs = action.payload;
      const currentStudyMap = new Map(state.sessionLogs.studySessions.map(item => [item.id, item]));
      incoming.studySessions.forEach(item => {
        if (!currentStudyMap.has(item.id)) currentStudyMap.set(item.id, item);
      });
      const mergedStudy = Array.from(currentStudyMap.values());
      const currentQuizMap = new Map(state.sessionLogs.quizSessions.map(item => [item.id, item]));
      incoming.quizSessions.forEach(item => {
        if (!currentQuizMap.has(item.id)) currentQuizMap.set(item.id, item);
      });
      const mergedQuiz = Array.from(currentQuizMap.values());
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
