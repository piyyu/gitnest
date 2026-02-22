"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import GridOverlay from "./components/GridOverlay";

const CELL = 28; // grid cell size in px
const RULER_H = 24; // top ruler height
const RULER_W = 48; // left ruler width
const NUM_ROWS = 90;

const colLabels = Array.from({ length: 60 }, (_, i) => {
  if (i < 26) return String.fromCharCode(65 + i);
  return "A" + String.fromCharCode(65 + (i - 26));
});

const exampleRepos = [
  { name: "vercel/next.js", year: "2024", type: "Framework", stars: "120K" },
  { name: "facebook/react", year: "2024", type: "UI Library", stars: "220K" },
  { name: "microsoft/vscode", year: "2024", type: "Editor", stars: "161K" },
  { name: "openai/whisper", year: "2023", type: "AI / ML", stars: "67K" },
  { name: "torvalds/linux", year: "2024", type: "OS Kernel", stars: "178K" },
];

export default function Home() {
  const [repoUrl, setRepoUrl] = useState("");
  const router = useRouter();

  function handleAnalyze() {
    if (!repoUrl.trim()) return;
    router.push(`/home?repo=${encodeURIComponent(repoUrl.trim())}`);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleAnalyze();
  }

  return (
    <div
      className="grid-page min-h-screen font-mono overflow-x-hidden"
      style={{ backgroundColor: "#050505", color: "#fff", cursor: "cell" }}
    >
      <GridOverlay />
      {/* ─── TOP RULER (sticky) ─────────────────────── */}
      <div
        className="sticky top-0 z-50 flex select-none"
        style={{
          height: RULER_H,
          backgroundColor: "#080808",
          borderBottom: "1px solid #222",
        }}
      >
        {/* corner cell */}
        <div
          style={{
            width: RULER_W,
            minWidth: RULER_W,
            borderRight: "1px solid #222",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M0 10 L10 0" stroke="#333" strokeWidth="1" />
          </svg>
        </div>

        {/* column letters */}
        <div className="flex flex-1 overflow-hidden">
          {colLabels.map((c) => (
            <div
              key={c}
              style={{
                width: CELL,
                minWidth: CELL,
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 9,
                color: "#444",
                borderRight: "1px solid #0f0f0f",
                letterSpacing: "0.05em",
              }}
            >
              {c}
            </div>
          ))}
        </div>

        {/* nav pulls to the right  */}
        <div
          className="flex items-center gap-6 pr-6 shrink-0"
          style={{ fontSize: 10, color: "#555", letterSpacing: "0.15em", textTransform: "uppercase" }}
        >
          <Link href="#" className="hover:text-[#00eaff] transition-colors">INDEX [A]</Link>
          <Link href="/home" className="hover:text-[#00eaff] transition-colors">ANALYZE [B]</Link>
          <Link href="#features" className="hover:text-[#00eaff] transition-colors">FEATURES [C]</Link>
          <Link href="#repos" className="hover:text-[#00eaff] transition-colors">REPOS [D]</Link>
        </div>
      </div>

      {/* ─── MAIN AREA ──────────────────────────────── */}
      <div className="flex">

        {/* LEFT RULER (sticky) */}
        <div
          className="sticky left-0 z-40 shrink-0 select-none"
          style={{
            width: RULER_W,
            backgroundColor: "#080808",
            borderRight: "1px solid #222",
          }}
        >
          {Array.from({ length: NUM_ROWS }, (_, i) => (
            <div
              key={i}
              style={{
                height: CELL,
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                paddingRight: 8,
                fontSize: 9,
                color: "#333",
                borderBottom: "1px solid #0f0f0f",
              }}
            >
              {i + 1}
            </div>
          ))}
        </div>

        {/* GRID CONTENT AREA */}
        <div
          className="flex-1 relative"
          style={{
            minHeight: NUM_ROWS * CELL,
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: `${CELL}px ${CELL}px`,
          }}
        >

          {/* ── BIG HEADLINE (rows 2-10) ── */}
          <div
            style={{
              position: "absolute",
              top: CELL * 1,
              left: CELL * 2,
              right: CELL * 2,
            }}
          >
            <h1
              style={{
                fontSize: "clamp(80px, 14vw, 180px)",
                fontWeight: 900,
                letterSpacing: "-0.04em",
                lineHeight: 1,
                textTransform: "uppercase",
                color: "transparent",
                WebkitTextStroke: "1px rgba(255,255,255,0.12)",
                userSelect: "none",
                whiteSpace: "nowrap",
              }}
            >
              ANALYZE
            </h1>
            <h1
              style={{
                fontSize: "clamp(80px, 14vw, 180px)",
                fontWeight: 900,
                letterSpacing: "-0.04em",
                lineHeight: 1,
                textTransform: "uppercase",
                background: "linear-gradient(135deg, #fff 0%, #d542ff 100%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
                marginTop: "-0.05em",
                whiteSpace: "nowrap",
              }}
            >
              GITHUB
            </h1>
          </div>

          {/* ── FLOATING INFO CARD (rows 9-18, cols 2-12) ── */}
          <div
            style={{
              position: "absolute",
              top: CELL * 9,
              left: CELL * 2,
              width: CELL * 16,
              backgroundColor: "#0a0a0a",
              border: "1px solid #282828",
              boxShadow: "0 0 40px rgba(0,0,0,0.8), 0 0 1px rgba(255,255,255,0.05) inset",
            }}
          >
            {/* card header row */}
            <div
              style={{
                borderBottom: "1px solid #1e1e1e",
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <div style={{ width: 6, height: 6, backgroundColor: "#00eaff", boxShadow: "0 0 8px #00eaff" }} />
              <span style={{ fontSize: 10, color: "#555", letterSpacing: "0.15em", textTransform: "uppercase" }}>
                SYS.01.2025 // V.1.0.0
              </span>
            </div>

            {/* card body */}
            <div style={{ padding: "20px 16px" }}>
              <div style={{ fontSize: 10, color: "#555", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 6 }}>
                KODIN
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 16, letterSpacing: "-0.02em", lineHeight: 1.3 }}>
                We explain any repository<br />with machine precision.
              </h2>
              <p style={{ fontSize: 13, color: "#666", lineHeight: 1.7, marginBottom: 20 }}>
                Drop a GitHub URL. Our AI traverses the codebase, maps architecture, and generates structured, chapter-by-chapter tutorials — in seconds.
              </p>

              {/* two-col metadata */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 24px", borderTop: "1px solid #1e1e1e", paddingTop: 16 }}>
                <div>
                  <div style={{ fontSize: 9, color: "#444", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 4 }}>Mode</div>
                  <div style={{ fontSize: 13, color: "#aaa" }}>AI Tutorial Gen</div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: "#444", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 4 }}>Status</div>
                  <div style={{ fontSize: 13, color: "#39ff14", display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#39ff14", boxShadow: "0 0 6px #39ff14", display: "inline-block" }} />
                    Operational
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: "#444", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 4 }}>Languages</div>
                  <div style={{ fontSize: 13, color: "#aaa" }}>50+ Supported</div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: "#444", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 4 }}>Latency</div>
                  <div style={{ fontSize: 13, color: "#aaa" }}>&lt; 30 seconds</div>
                </div>
              </div>
            </div>
          </div>

          {/* ── INPUT SECTION (rows 20-24, cols 2-38) ── */}
          <div
            id="analyze"
            style={{
              position: "absolute",
              top: CELL * 22,
              left: CELL * 2,
              right: CELL * 2,
            }}
          >
            {/* label row */}
            <div
              style={{
                borderTop: "1px solid #1e1e1e",
                borderBottom: "1px solid #1e1e1e",
                padding: "6px 0",
                marginBottom: 0,
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <span style={{ fontSize: 9, color: "#444", textTransform: "uppercase", letterSpacing: "0.15em" }}>
                A27
              </span>
              <span style={{ fontSize: 9, color: "#555", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                GITHUB REPOSITORY URL
              </span>
            </div>

            {/* the input "cell" */}
            <div
              className="grid-input-wrapper"
              style={{
                display: "flex",
                border: "1px solid #2a2a2a",
                borderTop: "none",
                transition: "border-color 0.2s, box-shadow 0.2s",
              }}
              onFocusCapture={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(190,41,236,0.6)";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 0 24px rgba(190,41,236,0.18)";
              }}
              onBlurCapture={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "#2a2a2a";
                (e.currentTarget as HTMLElement).style.boxShadow = "none";
              }}
            >
              <span
                style={{
                  padding: "14px 16px",
                  fontSize: 11,
                  color: "#444",
                  letterSpacing: "0.1em",
                  borderRight: "1px solid #1e1e1e",
                  textTransform: "uppercase",
                  display: "flex",
                  alignItems: "center",
                  userSelect: "none",
                  whiteSpace: "nowrap",
                }}
              >
                fx
              </span>
              <input
                type="text"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="https://github.com/username/repository"
                style={{
                  flex: 1,
                  backgroundColor: "transparent",
                  border: "none",
                  outline: "none",
                  color: "#fff",
                  fontSize: 14,
                  padding: "14px 16px",
                  fontFamily: "monospace",
                }}
              />
              <button
                onClick={handleAnalyze}
                style={{
                  padding: "0 28px",
                  background: "linear-gradient(90deg, #b000ff, #d542ff)",
                  color: "#fff",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  fontFamily: "monospace",
                  transition: "box-shadow 0.2s, transform 0.1s",
                  borderLeft: "1px solid rgba(255,255,255,0.1)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 0 20px rgba(190,41,236,0.5)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                }}
                onMouseDown={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = "scale(0.97)";
                }}
                onMouseUp={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = "scale(1)";
                }}
              >
                RUN →
              </button>
            </div>
            <div style={{ fontSize: 9, color: "#333", letterSpacing: "0.1em", padding: "6px 0", textTransform: "uppercase" }}>
              ↵ ENTER TO EXECUTE &nbsp;·&nbsp; RESULTS APPEAR IN /home
            </div>
          </div>

          {/* ── SELECTED REPOS TABLE (rows 30-50) ── */}
          <div
            id="repos"
            style={{
              position: "absolute",
              top: CELL * 30,
              left: CELL * 2,
              right: CELL * 2,
            }}
          >
            {/* table label */}
            <div style={{ marginBottom: 0 }}>
              <span style={{ fontSize: 9, color: "#555", textTransform: "uppercase", letterSpacing: "0.2em" }}>
                EXAMPLE REPOSITORIES // KODIN CAN EXPLAIN THESE
              </span>
            </div>

            {/* table */}
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                marginTop: 8,
                border: "1px solid #1e1e1e",
              }}
            >
              <thead>
                <tr style={{ borderBottom: "1px solid #2a2a2a", backgroundColor: "#080808" }}>
                  {["#", "Repository", "Year", "Type", "Stars"].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "10px 16px",
                        fontSize: 9,
                        color: "#555",
                        textAlign: "left",
                        fontWeight: 700,
                        letterSpacing: "0.15em",
                        textTransform: "uppercase",
                        borderRight: "1px solid #161616",
                        fontFamily: "monospace",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {exampleRepos.map((r, i) => (
                  <tr
                    key={r.name}
                    className="grid-table-row"
                    onClick={() => {
                      setRepoUrl(`https://github.com/${r.name}`);
                    }}
                  >
                    <td style={{ padding: "12px 16px", fontSize: 10, color: "#333", borderRight: "1px solid #161616", fontFamily: "monospace" }}>
                      {String(i + 1).padStart(2, "0")}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: "#ccc", borderRight: "1px solid #161616", fontFamily: "monospace" }}>
                      {r.name}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: "#666", borderRight: "1px solid #161616", fontFamily: "monospace" }}>
                      {r.year}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: "#666", borderRight: "1px solid #161616", fontFamily: "monospace" }}>
                      {r.type}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: "#00eaff", fontFamily: "monospace" }}>
                      ★ {r.stars}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ fontSize: 9, color: "#2a2a2a", marginTop: 6, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              CLICK ANY ROW TO PREFILL URL &nbsp;·&nbsp; SHOWING {exampleRepos.length} OF 10,000+ SUPPORTED REPOS
            </div>
          </div>

          {/* ── FEATURES GRID (rows 52-75) ── */}
          <div
            id="features"
            style={{
              position: "absolute",
              top: CELL * 52,
              left: CELL * 2,
              right: CELL * 2,
            }}
          >
            <div style={{ marginBottom: 16 }}>
              <span style={{ fontSize: 9, color: "#555", textTransform: "uppercase", letterSpacing: "0.2em" }}>
                SYSTEM CAPABILITIES
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1, backgroundColor: "#1e1e1e", border: "1px solid #1e1e1e" }}>
              {[
                { label: "50+ Languages", desc: "Python, TS, Rust, Go, Java & more", accent: "#00eaff", accentKey: "cyan" },
                { label: "Private Repos", desc: "Secure OAuth. Your code stays yours.", accent: "#be29ec", accentKey: "purple" },
                { label: "Chapter Structure", desc: "Structured chapters with objectives.", accent: "#39ff14", accentKey: "green" },
                { label: "< 30s Latency", desc: "First chapter in under 30 seconds.", accent: "#00eaff", accentKey: "cyan" },
                { label: "Code-Aware AI", desc: "In-context code examples & syntax.", accent: "#be29ec", accentKey: "purple" },
                { label: "Always Current", desc: "Re-run against any commit.", accent: "#39ff14", accentKey: "green" },
              ].map((f, i) => (
                <div
                  key={i}
                  className="grid-feature-cell"
                  data-accent={f.accentKey}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <div style={{ width: 6, height: 6, backgroundColor: f.accent, boxShadow: `0 0 8px ${f.accent}` }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>{f.label}</span>
                  </div>
                  <p style={{ fontSize: 12, color: "#555", lineHeight: 1.6 }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── FOOTER ROW (row 82) ── */}
          <div
            style={{
              position: "absolute",
              top: CELL * 82,
              left: CELL * 2,
              right: CELL * 2,
              borderTop: "1px solid #1e1e1e",
              paddingTop: 12,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: 10, color: "#333", letterSpacing: "0.15em", textTransform: "uppercase" }}>
              X: 0 &nbsp;·&nbsp; Y: 0
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 900,
                letterSpacing: "-0.04em",
                textTransform: "uppercase",
                background: "linear-gradient(90deg, #00eaff, #fff)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              KODIN
            </span>
            <span style={{ fontSize: 10, color: "#333", letterSpacing: "0.15em", textTransform: "uppercase" }}>
              © 2025 KODIN SYS
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}
