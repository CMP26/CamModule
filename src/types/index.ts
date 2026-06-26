export interface ProctoringState {
  isLookingAway: boolean;
  faceCount: number;
  identityVerified: boolean;
  isTabSwitched: boolean;
  isAttentive: boolean;
  lastFocusLostAt: string | null;
  focusLog: FocusLogEntry[];
  cameraReady: boolean;
  warnings: string[];
}
export interface FocusLogEntry {
  type: "gaze_away" | "tab_switch" | "multi_face" | "no_face" | "identity_fail";
  timestamp: string;
  durationMs?: number;
}
export interface UseGazeOptions {
  gracePeriodMs?: number;
}

export interface UseAttentionOptions {
  pauseAfterSeconds?: number;
  onPause?: () => void;
  onResume?: () => void;
}

export interface UseIdentityOptions {
  threshold?: number;
}