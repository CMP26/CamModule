import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import type {
  GlobalAction,
  GlobalState,
  QuizSession,
  SessionLogs,
  StudySession,
} from "../types/sessionTypes";

const INITIAL_STATE: GlobalState = {
  appMode: "home",
  sessionId: "",
  cameraVisible: false,
  sessionLogs: {
    sessionId: "",
    studySessions: [],
    quizSessions: [],
    createdAt: Date.now(),
  },
  currentStudySession: null,
  currentQuizSession: null,
};

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function globalReducer(state: GlobalState, action: GlobalAction): GlobalState {
  switch (action.type) {
    case "SET_MODE": {
      // BUG FIX: Some components dispatch { appMode: "home" } as payload,
      // others dispatch "home" directly. Normalize both shapes here.
      const mode =
        action.payload && typeof action.payload === "object" && "appMode" in action.payload
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
        totalTime: now - state.currentStudySession.startTime,
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

    case "LOAD_LOGS":
      return { ...state, sessionLogs: action.payload };

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

interface SessionContextType {
  state: GlobalState;
  dispatch: React.Dispatch<GlobalAction>;
  setAppMode: (mode: "home" | "learning" | "quiz" | "logs") => void;
  toggleCamera: () => void;
  startStudySession: () => void;
  endStudySession: () => void;
  updateStudyPresence: (activeTime: number, inactiveTime: number) => void;
  startQuizSession: (name: string, timeLimit?: number) => void;
  endQuizSession: () => void;
  updateQuizGaze: (gazeInTime: number, gazeOutTime: number) => void;
  clearLogs: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const sessionId = useMemo(() => generateSessionId(), []);
  const [state, dispatch] = useReducer(globalReducer, {
    ...INITIAL_STATE,
    sessionId,
    sessionLogs: {
      ...INITIAL_STATE.sessionLogs,
      sessionId,
    },
  });

  // Load logs from localStorage
  const [savedLogs, setSavedLogs] = useLocalStorage<SessionLogs>(
    `logs_${sessionId}`,
    state.sessionLogs,
  );

  React.useEffect(() => {
    // Load saved logs on mount
    if (savedLogs && savedLogs.studySessions.length > 0) {
      dispatch({ type: "LOAD_LOGS", payload: savedLogs });
    }
  }, []);

  // Save logs to localStorage whenever they change
  React.useEffect(() => {
    setSavedLogs(state.sessionLogs);
  }, [state.sessionLogs, setSavedLogs]);

  const setAppMode = useCallback(
    (mode: "home" | "learning" | "quiz" | "logs") => {
      dispatch({ type: "SET_MODE", payload: mode });
    },
    [],
  );

  const toggleCamera = useCallback(() => {
    dispatch({ type: "TOGGLE_CAMERA" });
  }, []);

  const startStudySession = useCallback(() => {
    dispatch({ type: "START_STUDY" });
  }, []);

  const endStudySession = useCallback(() => {
    dispatch({ type: "END_STUDY" });
  }, []);

  const updateStudyPresence = useCallback(
    (activeTime: number, inactiveTime: number) => {
      dispatch({
        type: "UPDATE_STUDY_PRESENCE",
        payload: { activeTime, inactiveTime },
      });
    },
    [],
  );

  const startQuizSession = useCallback((name: string, timeLimit?: number) => {
    dispatch({ type: "START_QUIZ", payload: { name, timeLimit } });
  }, []);

  const endQuizSession = useCallback(() => {
    dispatch({ type: "END_QUIZ" });
  }, []);

  const updateQuizGaze = useCallback(
    (gazeInTime: number, gazeOutTime: number) => {
      dispatch({
        type: "UPDATE_QUIZ_GAZE",
        payload: { gazeInTime, gazeOutTime },
      });
    },
    [],
  );

  const clearLogs = useCallback(() => {
    dispatch({ type: "CLEAR_LOGS" });
  }, []);

  const value: SessionContextType = {
    state,
    dispatch,
    setAppMode,
    toggleCamera,
    startStudySession,
    endStudySession,
    updateStudyPresence,
    startQuizSession,
    endQuizSession,
    updateQuizGaze,
    clearLogs,
  };

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionContextType {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within SessionProvider");
  }
  return context;
}