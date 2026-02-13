import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useTableOfContents } from "../hooks/useTableOfContents";

/**
 * Tests for useTableOfContents hook
 * Tests heading extraction from DOM and ID generation
 */
describe("useTableOfContents", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it("should be importable", () => {
    expect(typeof useTableOfContents).toBe("function");
  });

  it("should return empty array when ref is null", () => {
    const ref = { current: null };
    const { result } = renderHook(() => useTableOfContents(ref));

    expect(result.current).toEqual([]);
  });

  it("should return empty array when no headings exist", async () => {
    container.innerHTML = "<p>Just a paragraph</p>";
    const ref = { current: container };

    const { result } = renderHook(() => useTableOfContents(ref));

    await waitFor(() => {
      expect(result.current).toEqual([]);
    });
  });

  it("should extract h2 and h3 headings", async () => {
    container.innerHTML = `
      <h2 id="section-1">Section 1</h2>
      <p>Content</p>
      <h3 id="subsection-1">Subsection 1</h3>
      <p>More content</p>
      <h2 id="section-2">Section 2</h2>
    `;
    const ref = { current: container };

    const { result } = renderHook(() => useTableOfContents(ref));

    await waitFor(() => {
      expect(result.current).toHaveLength(3);
    });

    expect(result.current[0]).toEqual({
      id: "section-1",
      text: "Section 1",
      level: 2,
    });
    expect(result.current[1]).toEqual({
      id: "subsection-1",
      text: "Subsection 1",
      level: 3,
    });
    expect(result.current[2]).toEqual({
      id: "section-2",
      text: "Section 2",
      level: 2,
    });
  });

  it("should generate IDs for headings without them", async () => {
    container.innerHTML = `
      <h2>Heading Without ID</h2>
      <h3>Another Heading</h3>
    `;
    const ref = { current: container };

    const { result } = renderHook(() => useTableOfContents(ref));

    await waitFor(() => {
      expect(result.current).toHaveLength(2);
    });

    // Check that IDs were generated
    expect(result.current[0].id).toBe("heading-without-id");
    expect(result.current[1].id).toBe("another-heading");

    // Check that IDs were assigned to DOM elements
    const h2 = container.querySelector("h2");
    const h3 = container.querySelector("h3");
    expect(h2?.id).toBe("heading-without-id");
    expect(h3?.id).toBe("another-heading");
  });

  it("should handle German umlauts in slugs", async () => {
    container.innerHTML = `
      <h2>Einführung</h2>
      <h2>Größe und Maße</h2>
      <h2>Übersicht</h2>
    `;
    const ref = { current: container };

    const { result } = renderHook(() => useTableOfContents(ref));

    await waitFor(() => {
      expect(result.current).toHaveLength(3);
    });

    expect(result.current[0].id).toBe("einfuehrung");
    expect(result.current[1].id).toBe("groesse-und-masse");
    expect(result.current[2].id).toBe("uebersicht");
  });

  it("should handle duplicate heading texts with unique IDs", async () => {
    container.innerHTML = `
      <h2>Introduction</h2>
      <h2>Introduction</h2>
      <h2>Introduction</h2>
    `;
    const ref = { current: container };

    const { result } = renderHook(() => useTableOfContents(ref));

    await waitFor(() => {
      expect(result.current).toHaveLength(3);
    });

    // All IDs should be unique
    const ids = result.current.map((h) => h.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(3);

    expect(ids[0]).toBe("introduction");
    expect(ids[1]).toBe("introduction-1");
    expect(ids[2]).toBe("introduction-2");
  });

  it("should ignore h1 and h4+ headings", async () => {
    container.innerHTML = `
      <h1>Main Title (ignored)</h1>
      <h2>Section</h2>
      <h4>Sub-sub-section (ignored)</h4>
      <h3>Subsection</h3>
    `;
    const ref = { current: container };

    const { result } = renderHook(() => useTableOfContents(ref));

    await waitFor(() => {
      expect(result.current).toHaveLength(2);
    });

    expect(result.current[0].text).toBe("Section");
    expect(result.current[1].text).toBe("Subsection");
  });

  it("should handle special characters in headings", async () => {
    container.innerHTML = `
      <h2>What's New in 2026?</h2>
      <h2>C++ & JavaScript</h2>
    `;
    const ref = { current: container };

    const { result } = renderHook(() => useTableOfContents(ref));

    await waitFor(() => {
      expect(result.current).toHaveLength(2);
    });

    // Special chars should be removed, spaces become dashes
    expect(result.current[0].id).toBe("whats-new-in-2026");
    expect(result.current[1].id).toBe("c-javascript");
  });
});
