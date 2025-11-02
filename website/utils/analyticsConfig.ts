/**
 * Analytics Configuration
 *
 * Centralized configuration for Umami analytics.
 * Controls analytics behavior across the entire application.
 */

export const analyticsConfig = {
  /**
   * Whether analytics is disabled via environment variable
   */
  isDisabled: import.meta.env.VITE_DISABLE_ANALYTICS === "true",

  /**
   * Umami website ID
   */
  websiteId: "e41ae7d9-a536-426d-b40e-f2488b11bf95",

  /**
   * Umami script URL
   */
  scriptUrl: "https://cloud.umami.is/script.js",

  /**
   * Whether running in development mode
   */
  isDev: import.meta.env.DEV,

  /**
   * Whether to show debug logs in development
   */
  debugMode: import.meta.env.DEV,
} as const;
