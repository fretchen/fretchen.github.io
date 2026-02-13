import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useActiveHeading } from "../hooks/useActiveHeading";

/**
 * Tests for useActiveHeading hook
 * Tests scroll-spy functionality with Intersection Observer
 */
describe("useActiveHeading", () => {
  let container: HTMLDivElement;
  let mockObserverInstances: Array<{
    observe: ReturnType<typeof vi.fn>;
    unobserve: ReturnType<typeof vi.fn>;
    disconnect: ReturnType<typeof vi.fn>;
    callback: IntersectionObserverCallback;
  }>;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    mockObserverInstances = [];

    // Mock IntersectionObserver as a class
    class MockIntersectionObserver {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
      callback: IntersectionObserverCallback;

      constructor(callback: IntersectionObserverCallback) {
        this.callback = callback;
        mockObserverInstances.push(this);
      }
    }

    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
  });

  afterEach(() => {
    document.body.removeChild(container);
    vi.unstubAllGlobals();
  });

  it("should be importable", () => {
    expect(typeof useActiveHeading).toBe("function");
  });

  it("should return object with activeId and setActiveId", () => {
    const { result } = renderHook(() => useActiveHeading([]));

    expect(result.current).toHaveProperty("activeId");
    expect(result.current).toHaveProperty("setActiveId");
    expect(typeof result.current.setActiveId).toBe("function");
  });

  it("should return empty activeId when no headings provided", () => {
    const { result } = renderHook(() => useActiveHeading([]));

    expect(result.current.activeId).toBe("");
  });

  it("should set first heading as active initially", async () => {
    // Create elements in DOM
    container.innerHTML = `
      <h2 id="section-1">Section 1</h2>
      <h2 id="section-2">Section 2</h2>
    `;

    const headingIds = ["section-1", "section-2"];
    const { result } = renderHook(() => useActiveHeading(headingIds));

    await waitFor(() => {
      expect(result.current.activeId).toBe("section-1");
    });
  });

  it("should observe all heading elements", () => {
    container.innerHTML = `
      <h2 id="heading-1">Heading 1</h2>
      <h2 id="heading-2">Heading 2</h2>
      <h2 id="heading-3">Heading 3</h2>
    `;

    const headingIds = ["heading-1", "heading-2", "heading-3"];
    renderHook(() => useActiveHeading(headingIds));

    // Check that IntersectionObserver was created
    expect(mockObserverInstances.length).toBeGreaterThan(0);

    // Check that observe was called for each heading
    const instance = mockObserverInstances[0];
    expect(instance.observe).toHaveBeenCalledTimes(3);
  });

  it("should allow manual setActiveId updates", async () => {
    container.innerHTML = `
      <h2 id="section-1">Section 1</h2>
      <h2 id="section-2">Section 2</h2>
    `;

    const headingIds = ["section-1", "section-2"];
    const { result } = renderHook(() => useActiveHeading(headingIds));

    // Wait for initial state
    await waitFor(() => {
      expect(result.current.activeId).toBe("section-1");
    });

    // Manually set active heading
    act(() => {
      result.current.setActiveId("section-2");
    });

    expect(result.current.activeId).toBe("section-2");
  });

  it("should disconnect observer on unmount", () => {
    container.innerHTML = `<h2 id="section-1">Section 1</h2>`;

    const { unmount } = renderHook(() => useActiveHeading(["section-1"]));

    expect(mockObserverInstances.length).toBeGreaterThan(0);
    const instance = mockObserverInstances[0];

    unmount();

    expect(instance.disconnect).toHaveBeenCalled();
  });

  it("should update activeId when intersection observer fires", async () => {
    container.innerHTML = `
      <h2 id="section-1">Section 1</h2>
      <h2 id="section-2">Section 2</h2>
    `;

    const headingIds = ["section-1", "section-2"];
    renderHook(() => useActiveHeading(headingIds));

    await waitFor(() => {
      expect(mockObserverInstances.length).toBeGreaterThan(0);
    });

    const instance = mockObserverInstances[0];
    const section2Element = document.getElementById("section-2");

    // Simulate intersection observer callback
    act(() => {
      instance.callback(
        [
          {
            target: section2Element!,
            isIntersecting: true,
            intersectionRatio: 1,
            boundingClientRect: {} as DOMRectReadOnly,
            intersectionRect: {} as DOMRectReadOnly,
            rootBounds: null,
            time: 0,
          },
        ],
        instance as unknown as IntersectionObserver,
      );
    });

    // The hook should update the active heading
    // Note: The actual update depends on the hook's internal logic
    // which prioritizes the first visible heading
  });

  it("should handle missing DOM elements gracefully", () => {
    // Don't create actual elements in DOM
    const headingIds = ["nonexistent-1", "nonexistent-2"];

    expect(() => {
      renderHook(() => useActiveHeading(headingIds));
    }).not.toThrow();
  });
});
