//thisis the main app state provider
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import type {
  GlobalAction,
  GlobalState,
  SessionLogs,
} from "../types/sessionTypes";
import { reducer } from "./reducer";

const initialState: GlobalState = {
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

const storageKey = "nexalearn_logs";

function generateSessionId(): string {
  const customEntropy = Math.random().toString(36).substring(2, 11);
  return "session_" + Date.now() + "_" + customEntropy;
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

  const [state, dispatch] = useReducer(reducer, sessionId, (sessionToken) => {
    let resolvedLogs: SessionLogs = {
      ...initialState.sessionLogs,
      sessionId: sessionToken,
    };

    if (typeof window !== "undefined") {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        resolvedLogs = JSON.parse(raw);
      }
    }

    return {
      ...initialState,
      sessionId: sessionToken,
      sessionLogs: resolvedLogs,
    };
  });

  React.useEffect(() => {
    function handleStorage(e: StorageEvent) {
      if (e.key !== storageKey) return;

      const newRawPayload = e.newValue;
      if (newRawPayload === null) {
        dispatch({ type: "CLEAR_LOGS" });
      } else {
        dispatch({ type: "LOAD_LOGS", payload: JSON.parse(newRawPayload) });
      }
    }
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  React.useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(state.sessionLogs));
  }, [state.sessionLogs]);

  const toggleCamera = useCallback(() => {
    dispatch({ type: "TOGGLE_CAMERA" });
  }, []);

  const setAppMode = useCallback(
    (mode: "home" | "learning" | "quiz" | "logs") => {
      dispatch({ type: "SET_MODE", payload: mode });
    },
    [],
  );

  const endStudySession = useCallback(() => {
    dispatch({ type: "END_STUDY" });
  }, []);

  const startStudySession = useCallback(() => {
    dispatch({ type: "START_STUDY" });
  }, []);

  const startQuizSession = useCallback((name: string, timeLimit?: number) => {
    dispatch({ type: "START_QUIZ", payload: { name, timeLimit } });
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

  const updateQuizGaze = useCallback(
    (gazeInTime: number, gazeOutTime: number) => {
      dispatch({
        type: "UPDATE_QUIZ_GAZE",
        payload: { gazeInTime, gazeOutTime },
      });
    },
    [],
  );

  const endQuizSession = useCallback(() => {
    dispatch({ type: "END_QUIZ" });
  }, []);

  const clearLogs = useCallback(() => {
    dispatch({ type: "CLEAR_LOGS" });
    localStorage.removeItem(storageKey);
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