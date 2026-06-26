// tracks attention state and logs distraction events
import { useEffect, useRef, useState, useCallback } from "react";
import type { FocusLogEntry, UseAttentionOptions } from "../types";

export interface UseAttentionDetectionReturn {
  isAttentive: boolean;
  secondsUntilPause: number | null;
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
  const [countdown, setCountdown] = useState<number | null>(null);
  const [focusLog, setFocusLog] = useState<FocusLogEntry[]>([]);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const distractionStart = useRef<number | null>(null);
  const attentiveRef = useRef(true);

  const getReason = (): FocusLogEntry["type"] => {
    if (isTabSwitched) return "tab_switch";
    if (faceCount === 0) return "no_face";
    return faceCount > 1 ? "multi_face" : "gaze_away";
  };

  const isDistracted = isLookingAway || isTabSwitched || faceCount === 0;

  const addLog = useCallback((type: FocusLogEntry["type"], durationMs?: number) => {
    const entry: FocusLogEntry = {
      type,
      timestamp: new Date().toISOString(),
      ...(durationMs !== undefined && { durationMs }),
    };
    setFocusLog((prev) => [...prev, entry]);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setCountdown(null);
  }, []);

  const startTimer = useCallback(() => {
    if (timerRef.current) return; 

    distractionStart.current = Date.now();
    let remaining = pauseAfterSeconds;
    setCountdown(remaining);

    timerRef.current = setInterval(() => {
      remaining -= 1;
      
      if (remaining > 0) {
        setCountdown(remaining);
      } else {
        clearInterval(timerRef.current!);
        timerRef.current = null;
        setCountdown(null);

        if (attentiveRef.current) {
          attentiveRef.current = false;
          setIsAttentive(false);
          onPause?.();
        }
      }
    }, 1000);
  }, [pauseAfterSeconds, onPause]);

  useEffect(() => {
    if (isDistracted && !isAttentive) {
      addLog(getReason());
    }
  }, [isAttentive, isDistracted]);

  useEffect(() => {
    if (!isDistracted) {
      stopTimer();

      if (!attentiveRef.current) {
        const elapsed = distractionStart.current
          ? Date.now() - distractionStart.current
          : undefined;

        addLog(getReason(), elapsed);

        attentiveRef.current = true;
        setIsAttentive(true);
        distractionStart.current = null;
        onResume?.();
      }
    } else {
      startTimer();
    }
  }, [isDistracted]);

  const clearLog = useCallback(() => setFocusLog([]), []);

  return { isAttentive, secondsUntilPause: countdown, focusLog, clearLog };
}