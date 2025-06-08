import React, { useState, useRef, useEffect } from "react";
import * as styles from "../layouts/styles";

export type ToastType = "success" | "error" | "warning";

export interface ToastProps {
  message: string;
  type: ToastType;
  duration?: number;
  onClose: () => void;
}

/**
 * Toast Component
 *
 * A reusable toast notification component that displays temporary messages
 * with automatic dismissal and different visual styles based on type.
 */
export function Toast({ message, type, duration, onClose }: ToastProps) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const defaultDuration = type === "error" ? 4000 : type === "warning" ? 5000 : 3000;
    const toastDuration = duration ?? defaultDuration;

    timeoutRef.current = setTimeout(() => {
      onClose();
    }, toastDuration);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [duration, type, onClose]);

  const getIcon = () => {
    switch (type) {
      case "success":
        return "✅";
      case "warning":
        return "⚠️";
      case "error":
      default:
        return "❌";
    }
  };

  return (
    <div className={styles.toast.container}>
      <div className={styles.toast.content} data-type={type}>
        <span className={styles.toast.icon}>{getIcon()}</span>
        <span className={styles.toast.message}>{message}</span>
      </div>
    </div>
  );
}

/**
 * Hook for managing toast notifications
 *
 * Provides a simple interface to show toast notifications with automatic cleanup.
 */
export function useToast() {
  const [toast, setToast] = useState<{
    message: string;
    type: ToastType;
    duration?: number;
  } | null>(null);

  const showToast = (message: string, type: ToastType = "error", duration?: number) => {
    setToast({ message, type, duration });
  };

  const hideToast = () => {
    setToast(null);
  };

  const ToastComponent = toast ? (
    <Toast message={toast.message} type={toast.type} duration={toast.duration} onClose={hideToast} />
  ) : null;

  return {
    showToast,
    hideToast,
    ToastComponent,
  };
}
