/**
 * Analytics Utility
 *
 * Centralized tracking for Umami analytics with error handling and TypeScript support.
 */

import { analyticsConfig } from "./analyticsConfig";

// Type for event data
export type EventData = Record<string, string | number | boolean | null | undefined>;

// Extend Window interface for Umami
declare global {
  interface Window {
    umami?: {
      track: (eventName: string, eventData?: EventData) => void;
    };
  }
}

/**
 * Track an event with Umami analytics
 * @param eventName - Name of the event to track
 * @param eventData - Optional metadata for the event
 */
export function trackEvent(eventName: string, eventData?: EventData): void {
  // Early return if analytics is disabled
  if (analyticsConfig.isDisabled) {
    if (analyticsConfig.debugMode) {
      console.log("[Analytics] DISABLED - Would track:", eventName, eventData);
    }
    return;
  }

  try {
    if (typeof window !== "undefined" && window.umami) {
      window.umami.track(eventName, eventData);

      // Debug logging in development
      if (analyticsConfig.debugMode) {
        console.log("[Analytics] Tracked:", eventName, eventData);
      }
    } else {
      if (analyticsConfig.debugMode) {
        console.warn("[Analytics] Umami not loaded yet");
      }
    }
  } catch (error) {
    console.error("[Analytics] Failed to track event:", error);
  }
}

/**
 * Wallet connection event types
 */
export const WalletEvents = {
  DROPDOWN_OPEN: "wallet-dropdown-open",
  CONNECT_ATTEMPT: "wallet-connect-attempt",
  CONNECT_SUCCESS: "wallet-connect-success",
  CONNECT_ERROR: "wallet-connect-error",
  DROPDOWN_CLOSE: "wallet-dropdown-close",
} as const;
