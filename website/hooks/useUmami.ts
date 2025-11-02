import * as React from "react";
import { trackEvent, type EventData } from "../utils/analytics";
import { analyticsConfig } from "../utils/analyticsConfig";

/**
 * useUmami Hook
 *
 * React hook for tracking events with Umami analytics.
 * Respects the VITE_DISABLE_ANALYTICS environment variable.
 *
 * @returns {Object} Object with trackEvent function and analytics state
 */
export function useUmami() {
  const track = React.useCallback((eventName: string, eventData?: EventData) => {
    trackEvent(eventName, eventData);
  }, []);

  return {
    trackEvent: track,
    isDisabled: analyticsConfig.isDisabled,
    isDebugMode: analyticsConfig.debugMode,
  };
}
