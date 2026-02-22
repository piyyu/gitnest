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
    let lastScrollX = typeof window !== "undefined" ? window.scrollX : 0;
    let lastScrollY = typeof window !== "undefined" ? window.scrollY : 0;

    function resize() {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      if (lastCellX !== -1) draw(lastCellX, lastCellY);
    }

    function draw(cellX: number, cellY: number) {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // position relative to document
      const docDrawX = RULER_W + cellX * CELL;
      const docDrawY = RULER_H + cellY * CELL;

      // position relative to viewport (since canvas is fixed)
      const viewX = docDrawX - window.scrollX;
      const viewY = docDrawY - window.scrollY;

      // — Column ruler highlight (fixed to top of viewport) —
      ctx.fillStyle = "rgba(190, 41, 236, 0.18)";
      ctx.fillRect(viewX, 0, CELL, RULER_H);

      // — Row ruler highlight (fixed to left of viewport, but scrolls vertically) —
      ctx.fillStyle = "rgba(190, 41, 236, 0.18)";
      ctx.fillRect(0, viewY, RULER_W, CELL);

      // — Cell fill —
      ctx.fillStyle = "rgba(190, 41, 236, 0.06)";
      ctx.fillRect(viewX, viewY, CELL, CELL);

      // — Cell border (sharp 1px) —
      ctx.strokeStyle = "rgba(190, 41, 236, 0.45)";
      ctx.lineWidth = 1;
      ctx.strokeRect(viewX + 0.5, viewY + 0.5, CELL - 1, CELL - 1);

      // — Corner dot —
      ctx.fillStyle = "rgba(190, 41, 236, 0.9)";
      ctx.fillRect(viewX, viewY, 2, 2);
    }

    function clear() {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      lastCellX = -1;
      lastCellY = -1;
    }

    function onMouseMove(e: MouseEvent) {
      if (e.clientX < RULER_W || e.clientY < RULER_H) {
        if (lastCellX !== -1) clear();
        return;
      }

      const docX = e.clientX + window.scrollX - RULER_W;
      const docY = e.clientY + window.scrollY - RULER_H;

      const cellX = Math.floor(docX / CELL);
      const cellY = Math.floor(docY / CELL);

      if (cellX === lastCellX && cellY === lastCellY) return;
      lastCellX = cellX;
      lastCellY = cellY;
      draw(cellX, cellY);
    }

    function onScroll() {
      // If we are currently hovering a cell, redrawing on scroll keeps the highlight pinned to the document
      if (lastCellX !== -1) {
        draw(lastCellX, lastCellY);
      }
    }

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseleave", clear);
    window.addEventListener("scroll", onScroll);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseleave", clear);
      window.removeEventListener("scroll", onScroll);
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
