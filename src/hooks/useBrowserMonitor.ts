// tracks tab visibility and window focus
import { useCallback, useEffect, useState } from "react";

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
    if (hidden) setTabSwitchCount((prev) => prev + 1);
  }, []);
  
  const handleBlur = useCallback(() => {
    setIsTabSwitched(true);
    setBlurCount((prev) => prev + 1);
  }, []);

  const handleFocus = useCallback(() => {
    if (!document.hidden) {
      setIsTabSwitched(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [handleVisibility]);

  useEffect(() => {
    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
    };
  }, [handleBlur, handleFocus]);

  return { isTabSwitched, tabSwitchCount, blurCount };
}