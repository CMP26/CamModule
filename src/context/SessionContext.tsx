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
import { globalReducer } from "./sessionReducer";

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
const LOGS_STORAGE_KEY = "nexalearn_logs";

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function initGlobalState(sessionId: string): GlobalState {
  let sessionLogs: SessionLogs = {
    ...INITIAL_STATE.sessionLogs,
    sessionId,
  };

  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(LOGS_STORAGE_KEY);
      if (raw) sessionLogs = JSON.parse(raw);
    } catch (e) {
      console.log(e);
    }
  }

  return { ...INITIAL_STATE, sessionId, sessionLogs };
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
  const [state, dispatch] = useReducer(
    globalReducer,
    sessionId,
    initGlobalState,
  );

  React.useEffect(() => {
    try {
      window.localStorage.setItem(
        LOGS_STORAGE_KEY,
        JSON.stringify(state.sessionLogs),
      );
    } catch (e) {
      console.log(e);
    }
  }, [state.sessionLogs]);

  React.useEffect(() => {
    function handleStorage(e: StorageEvent) {
      if (e.key !== LOGS_STORAGE_KEY) return;
      if (e.newValue === null) {
        dispatch({ type: "CLEAR_LOGS" });
        return;
      }
      try {
        dispatch({ type: "LOAD_LOGS", payload: JSON.parse(e.newValue) });
      } catch (err) {
        console.log(err);
      }
    }
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

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
    try {
      window.localStorage.removeItem(LOGS_STORAGE_KEY);
    } catch (e) {
      console.log(e);
    }
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
