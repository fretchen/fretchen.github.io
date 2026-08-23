import React, { useEffect, useRef, useState } from "react";
import { css } from "../../../styled-system/css";
import { ESSAY_ACCENT } from "../palette";
import { countLineCells, countFilledCells, parseCellKey, type Point } from "./boxCounting";

const GRID_COLOR = "#d1d5db"; // gray-300, chrome not brand — literal per palette.ts convention
// Derived from ESSAY_ACCENT via globalAlpha rather than restated as a literal: the old
// rgba(124, 58, 237, …) was #7C3AED (violet-600), a visibly different purple from the
// #7B3FA0 stroke drawn on top of it.
const HIGHLIGHT_ALPHA = 0.22;
const FILL_ALPHA = 0.25;
const WATER_COLOR = "#bfdbfe"; // blue-200
const LAND_COLOR = "#bbf7d0"; // green-200

// Wider than the prose it sits in, on screens that have the room. IDENTITY.md: "Figures and
// tools may exceed [the measure] — they are the content, not decoration." At 360px the finest
// grid gave 5,6px per cell, and that mesh is the thing the reader is asked to look at.
const wrapper = css({
  position: "relative",
  width: "100%",
  aspectRatio: "1 / 1",
  maxWidth: "360px",
  mx: "auto",
  "@media (min-width: 768px)": { maxWidth: "560px" },
});

const canvasStyle = css({
  display: "block",
  width: "100%",
  height: "100%",
  border: "1px solid token(colors.border, #e5e7eb)",
  borderRadius: "md",
  bg: "white",
});

const drawableCanvasStyle = css({
  touchAction: "none",
  cursor: "crosshair",
});

export interface BoxCanvasProps {
  mode: "line" | "filled";
  points: Point[];
  worldSize: number;
  cellSize: number;
  closed?: boolean;
  highlightHits?: boolean;
  showGrid?: boolean;
  /** Filled polygons drawn as a land silhouette on a water-colored background (real coastlines only). */
  landRings?: Point[][];
  drawEnabled?: boolean;
  /** BoxCanvas converts client coordinates to world coordinates before calling this. */
  onPointerDraw?: (p: Point) => void;
  /**
   * What the canvas is showing, for screen readers — the drawing itself is opaque to them.
   * The measurement it produces stays available: the guidance line announces each count and
   * the Messreihe is real DOM.
   */
  label?: string;
  className?: string;
}

export function BoxCanvas({
  mode,
  points,
  worldSize,
  cellSize,
  closed = false,
  highlightHits = true,
  showGrid = true,
  landRings,
  drawEnabled = false,
  onPointerDraw,
  label,
  className,
}: BoxCanvasProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cssWidth, setCssWidth] = useState(300);

  useEffect(() => {
    const wrapperEl = wrapperRef.current;
    if (!wrapperEl) return;

    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width && width > 0) setCssWidth(width);
    });
    observer.observe(wrapperEl);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return; // e.g. jsdom in tests — draw calls are a no-op

    const dpr = window.devicePixelRatio || 1;
    canvas.width = cssWidth * dpr;
    canvas.height = cssWidth * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssWidth, cssWidth);

    const scale = cssWidth / worldSize;
    const hasLand = !!landRings && landRings.length > 0;

    ctx.fillStyle = hasLand ? WATER_COLOR : "white";
    ctx.fillRect(0, 0, cssWidth, cssWidth);

    if (hasLand) {
      ctx.fillStyle = LAND_COLOR;
      for (const ring of landRings) {
        if (ring.length < 3) continue;
        ctx.beginPath();
        ctx.moveTo(ring[0].x * scale, ring[0].y * scale);
        for (let i = 1; i < ring.length; i++) {
          ctx.lineTo(ring[i].x * scale, ring[i].y * scale);
        }
        ctx.closePath();
        ctx.fill();
      }
    }

    if (showGrid && cellSize > 0) {
      ctx.strokeStyle = GRID_COLOR;
      ctx.lineWidth = 1;
      for (let x = 0; x <= worldSize + 1e-9; x += cellSize) {
        const px = Math.round(x * scale) + 0.5;
        ctx.beginPath();
        ctx.moveTo(px, 0);
        ctx.lineTo(px, cssWidth);
        ctx.stroke();
      }
      for (let y = 0; y <= worldSize + 1e-9; y += cellSize) {
        const py = Math.round(y * scale) + 0.5;
        ctx.beginPath();
        ctx.moveTo(0, py);
        ctx.lineTo(cssWidth, py);
        ctx.stroke();
      }
    }

    if (highlightHits && cellSize > 0 && points.length > 0) {
      const result = mode === "filled" ? countFilledCells(points, cellSize) : countLineCells(points, cellSize, closed);
      ctx.globalAlpha = HIGHLIGHT_ALPHA;
      ctx.fillStyle = ESSAY_ACCENT;
      for (const key of result.cells) {
        const [col, row] = parseCellKey(key);
        ctx.fillRect(col * cellSize * scale, row * cellSize * scale, cellSize * scale, cellSize * scale);
      }
      ctx.globalAlpha = 1;
    }

    if (points.length > 0) {
      ctx.beginPath();
      ctx.moveTo(points[0].x * scale, points[0].y * scale);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x * scale, points[i].y * scale);
      }
      if (closed || mode === "filled") ctx.closePath();

      if (mode === "filled") {
        ctx.globalAlpha = FILL_ALPHA;
        ctx.fillStyle = ESSAY_ACCENT;
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      ctx.strokeStyle = ESSAY_ACCENT;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }, [points, cellSize, mode, closed, highlightHits, showGrid, landRings, cssWidth, worldSize]);

  function toWorldPoint(clientX: number, clientY: number): Point | null {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scale = rect.width / worldSize;
    return { x: (clientX - rect.left) / scale, y: (clientY - rect.top) / scale };
  }

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawEnabled || !onPointerDraw) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = toWorldPoint(e.clientX, e.clientY);
    if (p) onPointerDraw(p);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawEnabled || !onPointerDraw) return;
    if (e.buttons === 0 && e.pointerType !== "touch") return;
    e.preventDefault();
    const p = toWorldPoint(e.clientX, e.clientY);
    if (p) onPointerDraw(p);
  }

  return (
    <div ref={wrapperRef} className={wrapper}>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={label}
        className={`${canvasStyle} ${drawEnabled ? drawableCanvasStyle : ""} ${className ?? ""}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
      />
    </div>
  );
}

export default BoxCanvas;
