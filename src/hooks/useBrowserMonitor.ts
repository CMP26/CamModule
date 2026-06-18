// ============================================================
// Task 1.5 — useBrowserMonitor
// Tracks tab switching (visibilitychange) and window focus loss.
// ============================================================
import { useEffect, useState, useCallback } from "react";

export interface UseBrowserMonitorReturn {
  isTabSwitched: boolean;
  tabSwitchCount: number;
  blurCount: number;
}

export function useBrowserMonitor(): UseBrowserMonitorReturn {
  const [isTabSwitched, setIsTabSwitched] = useState(false);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [blurCount, setBlurCount] = useState(0);

  const handleVisibility = useCallback(() => {
    const hidden = document.hidden;
    setIsTabSwitched(hidden);
    if (hidden) {
      setTabSwitchCount((c) => c + 1);
      console.warn("[BrowserMonitor] Tab hidden / switched");
    }
  }, []);

  const handleBlur = useCallback(() => {
    setIsTabSwitched(true);
    setBlurCount((c) => c + 1);
    console.warn("[BrowserMonitor] Window lost focus");
  }, []);

  const handleFocus = useCallback(() => {
    // Only reset if the tab is also visible (not just focus returning)
    if (!document.hidden) {
      setIsTabSwitched(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
    };
  }, [handleVisibility, handleBlur, handleFocus]);

  return { isTabSwitched, tabSwitchCount, blurCount };
}