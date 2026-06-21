// ============================================================
// Session & Analytics Types
// ============================================================

export type AppMode = "home" | "learning" | "quiz" | "logs";
export type LearningType = "article" | "video";

export interface StudySession {
  id: string;
  startTime: number;
  endTime: number | null;
  totalTime: number; // ms
  activePresenceTime: number; // ms when face detected
  inactiveTime: number; // ms when no face detected
}

export interface QuizSession {
  id: string;
  name: string;
  startTime: number;
  endTime: number | null;
  totalTime: number; // ms
  gazeInTime: number; // ms looking at screen
  gazeOutTime: number; // ms looking away
  timeLimit?: number; // ms, optional
  focusPercentage: number;
  status: "good" | "almost_cheating";
}

export interface SessionLogs {
  sessionId: string; // unique per tab
  studySessions: StudySession[];
  quizSessions: QuizSession[];
  createdAt: number;
}

export interface GlobalState {
  appMode: AppMode;
  sessionId: string;
  cameraVisible: boolean;
  sessionLogs: SessionLogs;
  currentStudySession: StudySession | null;
  currentQuizSession: QuizSession | null;
}

export interface GlobalAction {
  type:
    | "SET_MODE"
    | "TOGGLE_CAMERA"
    | "START_STUDY"
    | "END_STUDY"
    | "UPDATE_STUDY_PRESENCE"
    | "START_QUIZ"
    | "END_QUIZ"
    | "UPDATE_QUIZ_GAZE"
    | "LOAD_LOGS"
    | "CLEAR_LOGS";
  payload?: any;
}
