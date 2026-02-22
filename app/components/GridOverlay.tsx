"use client";

import { useEffect, useRef } from "react";

const CELL = 28;
const RULER_H = 24;
const RULER_W = 48;

export default function GridOverlay() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let lastCellX = -1;
    let lastCellY = -1;

    function resize() {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      // Redraw after resize
      if (lastCellX !== -1) draw(lastCellX, lastCellY);
    }

    function draw(cellX: number, cellY: number) {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const drawX = RULER_W + cellX * CELL;
      const drawY = RULER_H + cellY * CELL;

      // — Column ruler highlight —
      ctx.fillStyle = "rgba(190, 41, 236, 0.18)";
      ctx.fillRect(drawX, 0, CELL, RULER_H);

      // — Row ruler highlight —
      ctx.fillStyle = "rgba(190, 41, 236, 0.18)";
      ctx.fillRect(0, drawY, RULER_W, CELL);

      // — Cell fill —
      ctx.fillStyle = "rgba(190, 41, 236, 0.06)";
      ctx.fillRect(drawX, drawY, CELL, CELL);

      // — Cell border (sharp 1px) —
      ctx.strokeStyle = "rgba(190, 41, 236, 0.45)";
      ctx.lineWidth = 1;
      ctx.strokeRect(drawX + 0.5, drawY + 0.5, CELL - 1, CELL - 1);

      // — Corner dot (top-left of the cell) —
      ctx.fillStyle = "rgba(190, 41, 236, 0.9)";
      ctx.fillRect(drawX, drawY, 2, 2);
    }

    function clear() {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      lastCellX = -1;
      lastCellY = -1;
    }

    function onMouseMove(e: MouseEvent) {
      // Ignore if cursor is inside either ruler so we don't highlight ruler cells
      if (e.clientX < RULER_W || e.clientY < RULER_H) {
        if (lastCellX !== -1) clear();
        return;
      }

      const cellX = Math.floor((e.clientX - RULER_W) / CELL);
      const cellY = Math.floor((e.clientY - RULER_H) / CELL);

      if (cellX === lastCellX && cellY === lastCellY) return; // no change
      lastCellX = cellX;
      lastCellY = cellY;
      draw(cellX, cellY);
    }

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseleave", clear);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseleave", clear);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 48, // above rulers (z-40/50) but below modals; pointer-events: none so clicks pass through
        pointerEvents: "none",
      }}
    />
  );
}
