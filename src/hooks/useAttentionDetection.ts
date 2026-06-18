// ============================================================
// Task 2.1 — Presence Verification   (face in frame)
// Task 2.2 — Focus Duration Timer    (3-second countdown)
// Task 2.3 — Video State Automation  (onPause / onResume)
// Task 2.4 — Log Aggregator          (focus loss JSON log)
// ============================================================
import { useEffect, useRef, useState, useCallback } from "react";
import type { FocusLogEntry, UseAttentionOptions } from "../types";

export interface UseAttentionDetectionReturn {
  isAttentive: boolean;
  secondsUntilPause: number | null; // countdown shown to user, null when attentive
  focusLog: FocusLogEntry[];
  clearLog: () => void;
}

interface AttentionInput {
  isLookingAway: boolean;
  faceCount: number;
  isTabSwitched: boolean;
}

export function useAttentionDetection(
  { isLookingAway, faceCount, isTabSwitched }: AttentionInput,
  options: UseAttentionOptions = {}
): UseAttentionDetectionReturn {
  const { pauseAfterSeconds = 3, onPause, onResume } = options;

  const [isAttentive, setIsAttentive] = useState(true);
  const [secondsUntilPause, setSecondsUntilPause] = useState<number | null>(null);
  const [focusLog, setFocusLog] = useState<FocusLogEntry[]>([]);

  // Refs for timers so they don't get stale in closures
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const focusLostAtRef = useRef<number | null>(null);
  const isAttentiveRef = useRef(true);

  const appendLog = useCallback((type: FocusLogEntry["type"], durationMs?: number) => {
    const entry: FocusLogEntry = {
      type,
      timestamp: new Date().toISOString(),
      ...(durationMs !== undefined && { durationMs }),
    };
    setFocusLog((prev) => [...prev, entry]);
    console.log("[AttentionLog]", entry);
  }, []);

  const startCountdown = useCallback(() => {
    if (countdownRef.current !== null) return; // already running
    focusLostAtRef.current = Date.now();
    let remaining = pauseAfterSeconds;
    setSecondsUntilPause(remaining);

    countdownRef.current = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(countdownRef.current!);
        countdownRef.current = null;
        setSecondsUntilPause(null);

        if (isAttentiveRef.current) {
          isAttentiveRef.current = false;
          setIsAttentive(false);
          onPause?.();
        }
      } else {
        setSecondsUntilPause(remaining);
      }
    }, 1000);
  }, [pauseAfterSeconds, onPause]);

  const stopCountdown = useCallback(() => {
    if (countdownRef.current !== null) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setSecondsUntilPause(null);
  }, []);

  // Determine the dominant reason for distraction
  const getDistractType = (): FocusLogEntry["type"] => {
    if (isTabSwitched) return "tab_switch";
    if (faceCount === 0) return "no_face";
    if (faceCount > 1) return "multi_face";
    return "gaze_away";
  };

  // Master attention logic
  const isDistracted = isLookingAway || isTabSwitched || faceCount === 0;

  useEffect(() => {
    if (isDistracted) {
      startCountdown();
    } else {
      // Student is back — recover
      stopCountdown();

      if (!isAttentiveRef.current) {
        const durationMs = focusLostAtRef.current
          ? Date.now() - focusLostAtRef.current
          : undefined;

        appendLog(getDistractType(), durationMs);

        isAttentiveRef.current = true;
        setIsAttentive(true);
        focusLostAtRef.current = null;
        onResume?.();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDistracted]);

  // Log when a new distraction starts (after pause fires)
  useEffect(() => {
    if (!isAttentive && isDistracted) {
      appendLog(getDistractType());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAttentive]);

  const clearLog = useCallback(() => setFocusLog([]), []);

  return { isAttentive, secondsUntilPause, focusLog, clearLog };
}