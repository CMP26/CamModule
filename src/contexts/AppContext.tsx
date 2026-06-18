import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { FocusLogEntry } from '../types';

// ─── Types ───────────────────────────────────────────────
export type Mode = 'home' | 'learning' | 'quiz' | 'logs';

export interface QuizLog {
  quizName: string;
  startTime: number;
  endTime: number;
  gazeInTime: number;   // seconds
  gazeOutTime: number;  // seconds
  totalTime: number;    // seconds
  status: 'good' | 'warning' | 'danger';
}

interface AppState {
  mode: Mode;
  // Learning
  learningStartTime: number | null;
  totalStudyTime: number;   // seconds (from start to now, or until exit)
  activeTime: number;       // seconds with face detected
  // Quiz logs
  quizLogs: QuizLog[];
  currentQuiz?: QuizLog;    // for ongoing quiz
  // Camera
  showCamera: boolean;
  // General focus logs (for debugging)
  focusLogs: FocusLogEntry[];
  sessionId: string;
}

type Action =
  | { type: 'SET_MODE'; payload: Mode }
  | { type: 'TOGGLE_CAMERA' }
  | { type: 'SET_LEARNING_START'; payload: number }
  | { type: 'UPDATE_LEARNING_STATS'; payload: { totalStudyTime: number; activeTime: number } }
  | { type: 'RESET_LEARNING' }
  | { type: 'START_QUIZ'; payload: { quizName: string } }
  | { type: 'UPDATE_QUIZ'; payload: { gazeInTime: number; gazeOutTime: number } }
  | { type: 'END_QUIZ' }
  | { type: 'ADD_FOCUS_LOG'; payload: FocusLogEntry }
  | { type: 'CLEAR_FOCUS_LOGS' }
  | { type: 'RESTORE_STATE'; payload: Partial<AppState> };

const initialState: AppState = {
  mode: 'home',
  learningStartTime: null,
  totalStudyTime: 0,
  activeTime: 0,
  quizLogs: [],
  showCamera: false,
  focusLogs: [],
  sessionId: `session_${Date.now()}`,
};

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_MODE':
      return { ...state, mode: action.payload };
    case 'TOGGLE_CAMERA':
      return { ...state, showCamera: !state.showCamera };
    case 'SET_LEARNING_START':
      return { ...state, learningStartTime: action.payload };
    case 'UPDATE_LEARNING_STATS':
      return { ...state, totalStudyTime: action.payload.totalStudyTime, activeTime: action.payload.activeTime };
    case 'RESET_LEARNING':
      return { ...state, learningStartTime: null, totalStudyTime: 0, activeTime: 0 };
    case 'START_QUIZ': {
      const now = Date.now();
      return {
        ...state,
        currentQuiz: {
          quizName: action.payload.quizName,
          startTime: now,
          endTime: 0,
          gazeInTime: 0,
          gazeOutTime: 0,
          totalTime: 0,
          status: 'good',
        },
      };
    }
    case 'UPDATE_QUIZ': {
      if (!state.currentQuiz) return state;
      return {
        ...state,
        currentQuiz: {
          ...state.currentQuiz,
          gazeInTime: action.payload.gazeInTime,
          gazeOutTime: action.payload.gazeOutTime,
        },
      };
    }
    case 'END_QUIZ': {
      if (!state.currentQuiz) return state;
      const ended = { ...state.currentQuiz, endTime: Date.now(), totalTime: (Date.now() - state.currentQuiz.startTime) / 1000 };
      // compute status
      const ratio = ended.gazeOutTime / ended.totalTime;
      ended.status = ratio < 0.05 ? 'good' : ratio < 0.10 ? 'warning' : 'danger';
      return {
        ...state,
        quizLogs: [...state.quizLogs, ended],
        currentQuiz: undefined,
      };
    }
    case 'ADD_FOCUS_LOG':
      return { ...state, focusLogs: [...state.focusLogs, action.payload] };
    case 'CLEAR_FOCUS_LOGS':
      return { ...state, focusLogs: [] };
    case 'RESTORE_STATE':
      return { ...state, ...action.payload };
    default:
      return state;
  }
}

// ─── Context ─────────────────────────────────────────────
const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
} | null>(null);

const STORAGE_KEY = 'nexalearn_session';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState, () => {
    // load from localStorage
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // keep sessionId from saved, but we might want a new one per tab? we'll keep same to persist across refreshes
        return { ...initialState, ...parsed };
      } catch {
        return initialState;
      }
    }
    return initialState;
  });

  // persist on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
};