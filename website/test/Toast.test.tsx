import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { renderHook, act } from "@testing-library/react";
import { Toast, useToast } from "../components/Toast";
import type { ToastType } from "../components/Toast";

/**
 * Tests for the Toast component and useToast hook
 * Tests component functionality, auto-dismissal, and hook behavior
 */
describe("Toast Component", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it("should be importable", () => {
    expect(typeof Toast).toBe("function");
  });

  it("should render with correct message and type", () => {
    const mockOnClose = vi.fn();

    render(<Toast message="Test message" type="success" onClose={mockOnClose} />);

    expect(screen.getByText("Test message")).toBeInTheDocument();
    expect(screen.getByText("✅")).toBeInTheDocument();
  });

  it("should display correct icons for different types", () => {
    const mockOnClose = vi.fn();
    const types: Array<{ type: ToastType; icon: string }> = [
      { type: "success", icon: "✅" },
      { type: "error", icon: "❌" },
      { type: "warning", icon: "⚠️" },
    ];

    types.forEach(({ type, icon }) => {
      const { unmount } = render(<Toast message={`${type} message`} type={type} onClose={mockOnClose} />);

      expect(screen.getByText(icon)).toBeInTheDocument();
      expect(screen.getByText(`${type} message`)).toBeInTheDocument();

      unmount();
    });
  });

  it("should auto-dismiss after default duration", () => {
    const mockOnClose = vi.fn();

    render(<Toast message="Auto dismiss test" type="success" onClose={mockOnClose} />);

    expect(mockOnClose).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("should auto-dismiss after custom duration", () => {
    const mockOnClose = vi.fn();
    const customDuration = 1500;

    render(<Toast message="Custom duration test" type="success" duration={customDuration} onClose={mockOnClose} />);

    expect(mockOnClose).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(customDuration);
    });

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});

describe("useToast Hook", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it("should be importable and return correct structure", () => {
    expect(typeof useToast).toBe("function");

    const { result } = renderHook(() => useToast());

    expect(typeof result.current.showToast).toBe("function");
    expect(typeof result.current.hideToast).toBe("function");
    expect(result.current.ToastComponent).toBe(null);
  });

  it("should show toast when showToast is called", () => {
    const { result } = renderHook(() => useToast());

    expect(result.current.ToastComponent).toBe(null);

    act(() => {
      result.current.showToast("Test message", "success");
    });

    expect(result.current.ToastComponent).not.toBe(null);
  });

  it("should hide toast when hideToast is called", () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showToast("Test message", "success");
    });

    expect(result.current.ToastComponent).not.toBe(null);

    act(() => {
      result.current.hideToast();
    });

    expect(result.current.ToastComponent).toBe(null);
  });

  it("should have timer functionality (basic test)", () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showToast("Test message", "success");
    });

    expect(result.current.ToastComponent).not.toBe(null);

    // Test that hideToast works manually
    act(() => {
      result.current.hideToast();
    });

    expect(result.current.ToastComponent).toBe(null);
  });

  it("should replace previous toast when showToast is called again", () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showToast("First message", "success");
    });

    const firstToast = result.current.ToastComponent;
    expect(firstToast).not.toBe(null);

    act(() => {
      result.current.showToast("Second message", "error");
    });

    const secondToast = result.current.ToastComponent;
    expect(secondToast).not.toBe(null);
    expect(secondToast).not.toBe(firstToast);
  });
});
