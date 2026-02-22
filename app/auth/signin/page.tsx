"use client";

import { useState } from "react";
import Link from "next/link";
import GridOverlay from "../../components/GridOverlay";

const CELL = 28;
const RULER_H = 24;
const RULER_W = 48;
const colLabels = Array.from({ length: 60 }, (_, i) =>
  i < 26 ? String.fromCharCode(65 + i) : "A" + String.fromCharCode(65 + (i - 26))
);

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div
      className="grid-page h-screen flex flex-col font-mono overflow-hidden"
      style={{ backgroundColor: "#050505", color: "#fff", cursor: "cell" }}
    >
      <GridOverlay />

      {/* TOP RULER */}
      <div className="flex shrink-0 select-none z-50"
        style={{ height: RULER_H, backgroundColor: "#080808", borderBottom: "1px solid #222" }}>
        <div style={{ width: RULER_W, minWidth: RULER_W, borderRight: "1px solid #222", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M0 10 L10 0" stroke="#333" strokeWidth="1" /></svg>
        </div>
        <div className="flex overflow-hidden">
          {colLabels.map(c => (
            <div key={c} style={{ width: CELL, minWidth: CELL, height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#444", borderRight: "1px solid #111", letterSpacing: "0.05em" }}>{c}</div>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-6 pr-4 shrink-0" style={{ fontSize: 10, color: "#555", letterSpacing: "0.12em", textTransform: "uppercase" }}>
          <Link href="/" className="hover:text-white transition-colors">INDEX [A]</Link>
          <Link href="/auth/signup" className="hover:text-white transition-colors">SIGN UP [B]</Link>
        </div>
      </div>

      {/* BODY */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT RULER */}
        <div className="shrink-0 select-none overflow-hidden"
          style={{ width: RULER_W, backgroundColor: "#080808", borderRight: "1px solid #222" }}>
          {Array.from({ length: 40 }, (_, i) => (
            <div key={i} style={{ height: CELL, display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 8, fontSize: 9, color: "#333", borderBottom: "1px solid #0f0f0f" }}>
              {i + 1}
            </div>
          ))}
        </div>

        {/* GRID CONTENT */}
        <div
          className="flex-1 flex items-center justify-center"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: `${CELL}px ${CELL}px`,
          }}
        >
          <div style={{ width: "100%", maxWidth: 440 }}>
            {/* label */}
            <div style={{ fontSize: 9, color: "#555", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 20, display: "flex", gap: 12 }}>
              <span>D14</span>
              <span style={{ color: "#2a2a2a" }}>·</span>
              <span>AUTHENTICATION FORM</span>
            </div>

            {/* title */}
            <h1 style={{ fontSize: 28, fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.04em", color: "#fff", marginBottom: 32, lineHeight: 1 }}>
              Sign In
            </h1>

            {/* email field */}
            <div style={{ marginBottom: 1 }}>
              <div style={{ fontSize: 9, color: "#444", letterSpacing: "0.15em", textTransform: "uppercase", padding: "6px 0", borderTop: "1px solid #1e1e1e", borderBottom: "1px solid #1e1e1e" }}>
                D15 · EMAIL
              </div>
              <div style={{ display: "flex", border: "1px solid #222", borderTop: "none" }}>
                <span style={{ padding: "12px 12px", fontSize: 11, color: "#444", borderRight: "1px solid #1e1e1e", userSelect: "none" }}>@</span>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#fff", fontSize: 13, padding: "12px", fontFamily: "monospace", cursor: "text" }}
                />
              </div>
            </div>

            {/* password field */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 9, color: "#444", letterSpacing: "0.15em", textTransform: "uppercase", padding: "6px 0", borderBottom: "1px solid #1e1e1e" }}>
                D16 · PASSWORD
              </div>
              <div style={{ display: "flex", border: "1px solid #222", borderTop: "none" }}>
                <span style={{ padding: "12px 12px", fontSize: 11, color: "#444", borderRight: "1px solid #1e1e1e", userSelect: "none" }}>**</span>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#fff", fontSize: 13, padding: "12px", fontFamily: "monospace", cursor: "text" }}
                />
              </div>
            </div>

            {/* submit */}
            <button
              style={{ width: "100%", padding: "13px", background: "linear-gradient(90deg, #b000ff, #d542ff)", color: "#fff", border: "none", fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", fontFamily: "monospace", cursor: "pointer", marginBottom: 16 }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.boxShadow = "0 0 20px rgba(190,41,236,0.4)")}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.boxShadow = "none")}
            >
              AUTHENTICATE →
            </button>

            {/* signup link */}
            <div style={{ fontSize: 10, color: "#444", letterSpacing: "0.1em", textTransform: "uppercase", textAlign: "center" }}>
              NO ACCOUNT?{" "}
              <Link href="/auth/signup" style={{ color: "#00eaff", textDecoration: "none" }}>
                SIGN UP [B]
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* STATUS BAR */}
      <div className="shrink-0 flex items-center justify-between px-4" style={{ height: 22, backgroundColor: "#080808", borderTop: "1px solid #222", fontSize: 9, color: "#444", letterSpacing: "0.12em", textTransform: "uppercase" }}>
        <span>KODIN AUTH</span>
        <span>CELL READY</span>
      </div>
    </div>
  );
}
