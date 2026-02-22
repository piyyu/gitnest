"use client";

import { useState } from "react";
import Link from "next/link";
import GridOverlay from "./components/GridOverlay";
import Sidebar from "./components/sidebar/Sidebar";
import TutorialDetails from "./components/tutorial/TutorialDetails";

const CELL = 28;
const RULER_H = 24;
const RULER_W = 48;
const NUM_ROWS = 90;

const colLabels = Array.from({ length: 60 }, (_, i) =>
  i < 26 ? String.fromCharCode(65 + i) : "A" + String.fromCharCode(65 + (i - 26))
);

const exampleRepos = [
  { name: "vercel/next.js", year: "2024", type: "Framework", stars: "120K" },
  { name: "facebook/react", year: "2024", type: "UI Library", stars: "220K" },
  { name: "microsoft/vscode", year: "2024", type: "Editor", stars: "161K" },
  { name: "openai/whisper", year: "2023", type: "AI / ML", stars: "67K" },
  { name: "torvalds/linux", year: "2024", type: "OS Kernel", stars: "178K" },
];

function LoadingGrid() {
  const codePattern = [
    [1, 1, 1, 1, 1, 0, 0, 0, 0, 0], // function x()
    [0, 0, 1, 1, 1, 1, 1, 1, 0, 0], //   doSomething()
    [0, 0, 1, 1, 1, 1, 0, 0, 0, 0], //   return y
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0], // }
  ];
  const ROWS = codePattern.length;
  const COLS = codePattern[0].length;
  const cells = Array.from({ length: COLS * ROWS });

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${COLS}, ${CELL}px)`,
        gridTemplateRows: `repeat(${ROWS}, ${CELL}px)`,
        gap: 1,
        backgroundColor: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.05)",
        margin: "0 auto 24px auto",
        width: "fit-content"
      }}
    >
      {cells.map((_, i) => {
        const x = i % COLS;
        const y = Math.floor(i / COLS);
        const isActive = codePattern[y][x] === 1;

        // cascade delay left-to-right, top-to-bottom
        const delay = (y * 0.2) + (x * 0.05);

        return (
          <div
            key={i}
            className={isActive ? "grid-loader-cell" : ""}
            style={{
              backgroundColor: "#050505",
              position: "relative",
              width: "100%",
              height: "100%",
              ...(isActive ? { "--delay": `${delay}s` } : {})
            } as any}
          />
        );
      })}
    </div>
  );
}

export default function Home() {
  const [repoUrl, setRepoUrl] = useState("");
  const [repoData, setRepoData] = useState<any>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState<any>(null);
  const [loadingChapter, setLoadingChapter] = useState(false);

  // Dynamic grid size to cover scrolling content
  const [gridRows, setGridRows] = useState(200);
  const [gridCols, setGridCols] = useState(colLabels.length);

  // Phase 1: fetch repo metadata
  async function handleAnalyze() {
    if (!repoUrl.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/github", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl: repoUrl.trim() }),
      });
      const json = await res.json();
      setRepoData(json);

      // Phase 2: auto-generate chapters immediately
      const planRes = await fetch("/api/tutorial/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoData: json }),
      });
      if (planRes.ok) {
        const planJson = await planRes.json();
        setChapters(planJson.chapters ?? []);
        if (planJson.chapters?.length > 0) setSelectedChapter(planJson.chapters[0]);
      }
    } finally {
      setLoading(false);
    }
  }

  // Phase 3: fetch individual chapter content on demand
  async function handleChapterSelect(chapter: any) {
    if (chapter.content) { setSelectedChapter(chapter); return; }
    setLoadingChapter(true);
    setSelectedChapter(chapter);
    try {
      const res = await fetch("/api/tutorial/chapter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chapter, repoData }),
      });
      if (!res.ok) return;
      const { content } = await res.json();
      setChapters(prev => prev.map(c => c.id === chapter.id ? { ...c, content } : c));
      setSelectedChapter({ ...chapter, content });
    } finally {
      setLoadingChapter(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleAnalyze();
  }

  const hasChapters = chapters.length > 0;

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
                disabled={loading}
                style={{
                  padding: "0 28px",
                  background: loading ? "#111" : "linear-gradient(90deg, #b000ff, #d542ff)",
                  color: loading ? "#555" : "#fff",
                  border: "none",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  fontFamily: "monospace",
                  transition: "box-shadow 0.2s, transform 0.1s",
                  borderLeft: "1px solid rgba(255,255,255,0.1)",
                  minWidth: 120,
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => {
                  if (!loading) (e.currentTarget as HTMLElement).style.boxShadow = "0 0 20px rgba(190,41,236,0.5)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                }}
                onMouseDown={(e) => {
                  if (!loading) (e.currentTarget as HTMLElement).style.transform = "scale(0.97)";
                }}
                onMouseUp={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = "scale(1)";
                }}
              >
                {loading ? "RUNNING..." : "RUN →"}
              </button>
            </div>
            <div style={{ fontSize: 9, color: "#333", letterSpacing: "0.1em", padding: "6px 0", textTransform: "uppercase" }}>
              ↵ ENTER TO EXECUTE · RESULTS APPEAR INLINE
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

      {/* ── TUTORIAL VIEW (replaces landing once chapters load) ── */}
      {hasChapters && (
        <div
          className="grid-page"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            backgroundColor: "#050505",
            fontFamily: "monospace",
            zIndex: 100,
            backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: `${CELL}px ${CELL}px`,
          }}
        >
          <GridOverlay />

          {/* TOP RULER */}
          <div className="flex shrink-0 select-none sticky top-0" style={{ height: RULER_H, backgroundColor: "#080808", borderBottom: "1px solid #222", zIndex: 150 }}>
            <div style={{ width: RULER_W, minWidth: RULER_W, borderRight: "1px solid #222", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M0 10 L10 0" stroke="#333" strokeWidth="1" /></svg>
            </div>
            <div className="flex overflow-hidden">
              {colLabels.slice(0, gridCols).map((c, i) => (
                <div key={i} style={{ width: CELL, minWidth: CELL, height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#444", borderRight: "1px solid #111", letterSpacing: "0.05em" }}>{c}</div>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-4 pr-4 shrink-0" style={{ fontSize: 10, color: "#555", letterSpacing: "0.12em" }}>
              {repoData && <span style={{ color: "#00eaff" }}>{repoData.name || "REPO"}</span>}
              {selectedChapter && <span style={{ color: "#444" }}>/ CH.{String(selectedChapter.id).padStart(2, "0")}</span>}
              <button
                onClick={() => { setChapters([]); setRepoData(null); setSelectedChapter(null); }}
                style={{ fontSize: 9, color: "#555", letterSpacing: "0.15em", background: "none", border: "1px solid #222", padding: "3px 10px", cursor: "pointer", fontFamily: "monospace", textTransform: "uppercase" }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = "#fff")}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = "#555")}
              >← BACK</button>
            </div>
          </div>

          {/* BODY */}
          <div className="flex flex-1 relative" ref={(el) => {
            if (!el) return;
            const updateSize = () => {
              const rect = el.getBoundingClientRect();
              const neededRows = Math.max(200, Math.ceil(rect.height / CELL) + 20); // +20 buffer
              const neededCols = Math.max(colLabels.length, Math.ceil(rect.width / CELL));

              if (neededRows > gridRows) setGridRows(neededRows);
              if (neededCols > gridCols) setGridCols(neededCols);
            };
            const obs = new ResizeObserver(updateSize);
            obs.observe(el);
            // also observe body in case scrolling stretches the page
            obs.observe(document.body);
            updateSize();
            return () => obs.disconnect();
          }}>
            {/* LEFT ROW RULER */}
            <div className="shrink-0 select-none" style={{ width: RULER_W, backgroundColor: "#080808", borderRight: "1px solid #222" }}>
              <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: RULER_W, overflow: "hidden" }}>
                {Array.from({ length: gridRows }, (_, i) => (
                  <div key={i} style={{ height: CELL, display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 8, fontSize: 9, color: selectedChapter?.id === chapters[i]?.id ? "#be29ec" : "#333", borderBottom: "1px solid #0f0f0f" }}>
                    {i + 1}
                  </div>
                ))}
              </div>
            </div>

            {/* SIDEBAR */}
            <div className="sticky" style={{ top: RULER_H, height: `calc(100vh - ${RULER_H}px - 22px)`, zIndex: 140 }}>
              <Sidebar chapters={chapters} onSelectChapter={handleChapterSelect} selectedChapterId={selectedChapter?.id} />
            </div>

            {/* MAIN CONTENT */}
            <div className="flex-1" style={{ position: "relative", paddingBottom: 64 }}>
              <TutorialDetails chapter={selectedChapter} isLoading={loadingChapter} />
            </div>
          </div>

          {/* STATUS BAR */}
          <div className="shrink-0 flex items-center justify-between px-4 fixed bottom-0 left-0 right-0" style={{ height: 22, backgroundColor: "#080808", borderTop: "1px solid #222", fontSize: 9, color: "#444", letterSpacing: "0.12em", textTransform: "uppercase", zIndex: 160 }}>
            <span>KODIN v1.0</span>
            <span style={{ display: "flex", gap: 20 }}>
              <span>CHAPTERS: {chapters.length}</span>
              {selectedChapter && <span style={{ color: "#be29ec" }}>CH.{String(selectedChapter.id).padStart(2, "0")} ACTIVE</span>}
            </span>
            <span>READY</span>
          </div>
        </div>
      )}

      {/* LOADING OVERLAY */}
      {loading && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300 }}>
          <div style={{ border: "1px solid #2a2a2a", backgroundColor: "#050505", padding: "32px 48px", textAlign: "center" }}>
            <LoadingGrid />
            <div style={{ fontSize: 10, color: "#555", letterSpacing: "0.2em", textTransform: "uppercase" }}>ANALYZING REPOSITORY...</div>
          </div>
        </div>
      )}
    </div>
  );
}
