// ============================================================
// NexaLearn Module 3 — Shared Types
// ============================================================

/** Unified proctoring state consumed by any parent component */
export interface ProctoringState {
  /** True when gaze/head is not directed at screen */
  isLookingAway: boolean;
  /** Number of faces currently detected in the frame */
  faceCount: number;
  /** True once the student's identity has been confirmed */
  identityVerified: boolean;
  /** True when the browser tab is hidden or window is blurred */
  isTabSwitched: boolean;
  /** Attention state for the video controller */
  isAttentive: boolean;
  /** ISO timestamp of when attention was last lost */
  lastFocusLostAt: string | null;
  /** Running log of all focus-loss events */
  focusLog: FocusLogEntry[];
  /** Whether the webcam is ready */
  cameraReady: boolean;
  /** Non-fatal warning messages */
  warnings: string[];
}

export interface FocusLogEntry {
  type: "gaze_away" | "tab_switch" | "multi_face" | "no_face" | "identity_fail";
  timestamp: string;   // ISO string
  durationMs?: number; // how long the event lasted (filled on resume)
}

export interface UseCameraOptions {
  width?: number;
  height?: number;
  facingMode?: "user" | "environment";
}

export interface UseGazeOptions {
  /** ms of looking away before isLookingAway flips true (default 500) */
  gracePeriodMs?: number;
}

export interface UseAttentionOptions {
  /** seconds before video is paused (default 3) */
  pauseAfterSeconds?: number;
  onPause?: () => void;
  onResume?: () => void;
}

export interface UseIdentityOptions {
  /** Minimum confidence to accept a match 0–1 (default 0.55) */
  threshold?: number;
}