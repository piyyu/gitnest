"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import GridOverlay from "../components/GridOverlay";
import Sidebar from "../components/sidebar/Sidebar";
import TutorialDetails from "../components/tutorial/TutorialDetails";

const CELL = 28;
const RULER_H = 24;
const RULER_W = 48;

const colLabels = Array.from({ length: 60 }, (_, i) =>
  i < 26 ? String.fromCharCode(65 + i) : "A" + String.fromCharCode(65 + (i - 26))
);

export default function HomeDashboard() {
  const [repoUrl, setRepoUrl] = useState("");
  const [repoData, setRepoData] = useState<any>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState<any>(null);
  const [loadingChapter, setLoadingChapter] = useState(false);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [chapterError, setChapterError] = useState<string | null>(null);
  const router = useRouter();
  // Tracks the latest requested chapter so stale streams can't overwrite it.
  const activeChapterRef = useRef<string | null>(null);
  const streamAbortRef = useRef<AbortController | null>(null);
  // Chapters currently generating in the background — avoids duplicate work
  // when parallel prefetch overlaps with user navigation.
  const inflightRef = useRef<Set<string>>(new Set());

  // Full repoData holds up to 120 files × 100KB — sending it on every chapter
  // request means megabytes of upload per click. The server only needs path +
  // head of content, so trim once per request (~150-250KB instead of MBs).
  function getSlimRepo(data: any) {
    if (!data?.files) return data;
    return {
      projectType: data.projectType,
      files: {
        docs: (data.files.docs || []).slice(0, 5).map((f: any) => ({
          path: f.path,
          content: String(f.content || "").slice(0, 2000),
        })),
        configs: (data.files.configs || []).slice(0, 10).map((f: any) => ({
          path: f.path,
          content: String(f.path || "").endsWith("package.json")
            ? String(f.content || "").slice(0, 2000)
            : "",
        })),
        code: (data.files.code || []).slice(0, 80).map((f: any) => ({
          path: f.path,
          content: String(f.content || "").slice(0, 2500),
        })),
      },
    };
  }

  async function fetchGithub() {
    if (!repoUrl.trim()) return;
    setLoading(true);
    const res = await fetch("/api/github", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repoUrl }),
    });
    const json = await res.json();
    setRepoData(json);
    setLoading(false);
  }

  async function createChapters() {
    if (!repoData) return;
    setGeneratingPlan(true);
    try {
      const res = await fetch("/api/tutorial/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoData }),
      });
      if (!res.ok) return;
      const json = await res.json();
      setChapters(json.chapters);
      if (json.chapters?.length > 0) {
        // Auto-start the first chapter immediately so the user sees
        // content streaming in instead of waiting for another click.
        // Pass data explicitly to avoid stale state.
        handleChapterSelect(json.chapters[0], json.chapters, repoData);
        // Warm the next chapters in parallel right away (don't wait for ch.1
        // to finish — that serializes all generation into minutes).
        prefetchAhead(0, json.chapters, repoData, 2);
      }
    } finally {
      setGeneratingPlan(false);
    }
  }

  // Streams a chapter token-by-token and caches the result.
  // `prefetch=true` runs quietly in the background without touching selection.
  async function streamChapter(
    chapter: any,
    allChapters: any[],
    data: any,
    opts?: { prefetch?: boolean }
  ) {
    const prefetch = opts?.prefetch ?? false;
    const slimRepo = getSlimRepo(data);
    try {
      const res = await fetch("/api/tutorial/chapter?stream=1", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({ chapter, repoData: slimRepo }),
        signal: prefetch ? undefined : streamAbortRef.current?.signal,
      });
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let content = "";

      const flushSelection = (text: string) => {
        if (prefetch) return;
        if (activeChapterRef.current !== chapter.id) return;
        setSelectedChapter({ ...chapter, content: text });
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() || "";
        for (const evt of events) {
          const line = evt.trim();
          if (!line.startsWith("data:")) continue;
          const payload = JSON.parse(line.slice(5).trim());
          if (payload.token) {
            content += payload.token;
            flushSelection(content);
          } else if (payload.done) {
            content = payload.content || content;
            flushSelection(content);
          } else if (payload.error) {
            throw new Error(payload.error);
          }
        }
      }
      // Cache completed content for instant revisits + prefetch hits.
      setChapters((prev) =>
        prev.map((c) => (c.id === chapter.id ? { ...c, content } : c))
      );
      if (!prefetch && activeChapterRef.current === chapter.id) {
        setSelectedChapter({ ...chapter, content });
      }
      return content;
    } catch (err) {
      // Fallback to the non-streaming endpoint if SSE fails.
      if (prefetch) return null;
      if (activeChapterRef.current !== chapter.id) return null;
      const res = await fetch("/api/tutorial/chapter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chapter, repoData: slimRepo }),
      });
      if (!res.ok) return null;
      const { content } = await res.json();
      setChapters((prev) =>
        prev.map((c) => (c.id === chapter.id ? { ...c, content } : c))
      );
      if (activeChapterRef.current === chapter.id) {
        setSelectedChapter({ ...chapter, content });
      }
      return content;
    }
  }

  // Warm the next `count` uncached chapters in parallel, immediately.
  // Old code prefetched only the single next chapter after a delay, which
  // serialized all generation. Dedupe via inflight set + content check.
  function prefetchAhead(fromIndex: number, list: any[], data: any, count = 3) {
    let started = 0;
    for (let i = fromIndex + 1; i < list.length && started < count; i++) {
      const c = list[i];
      if (!c || c.content || inflightRef.current.has(c.id)) continue;
      inflightRef.current.add(c.id);
      started++;
      streamChapter(c, list, data, { prefetch: true }).finally(() => {
        inflightRef.current.delete(c.id);
      });
    }
  }

  function prefetchChapter(chapter: any, allChapters: any[], data: any) {
    if (!chapter || chapter.content || inflightRef.current.has(chapter.id)) return;
    inflightRef.current.add(chapter.id);
    streamChapter(chapter, allChapters, data, { prefetch: true }).finally(() => {
      inflightRef.current.delete(chapter.id);
    });
  }

  async function handleChapterSelect(chapter: any, allChapters?: any[], data?: any) {
    const list = allChapters ?? chapters;
    const repo = data ?? repoData;
    // Instant cache hit (including prefetched chapters).
    const cached = list.find((c: any) => c.id === chapter.id);
    if (cached?.content) {
      streamAbortRef.current?.abort();
      activeChapterRef.current = chapter.id;
      setSelectedChapter(cached);
      setLoadingChapter(false);
      setChapterError(null);
      const idx = list.findIndex((c: any) => c.id === chapter.id);
      prefetchAhead(idx, list, repo, 3);
      return;
    }
    // Cancel any in-flight stream before starting a new one.
    streamAbortRef.current?.abort();
    const controller = new AbortController();
    streamAbortRef.current = controller;
    activeChapterRef.current = chapter.id;
    setLoadingChapter(true);
    setChapterError(null);
    // Show the shell immediately with empty content so tokens stream in.
    setSelectedChapter({ ...chapter, content: "" });
    // Mark foreground generation as in-flight so prefetch won't duplicate it.
    inflightRef.current.add(chapter.id);
    try {
      const content = await streamChapter(chapter, list, repo);
      // Empty/failed generation used to leave a blank shell with a vague hint.
      // Surface it as an error with a retry instead.
      if (!content && activeChapterRef.current === chapter.id) {
        setChapterError("Couldn't generate this chapter (rate limit or network hiccup). Hit retry.");
      }
    } finally {
      inflightRef.current.delete(chapter.id);
      if (activeChapterRef.current === chapter.id) setLoadingChapter(false);
    }
    // Prefetch the next chapters in reading order.
    const idx = list.findIndex((c: any) => c.id === chapter.id);
    prefetchAhead(idx, list, repo, 3);
  }

  function retrySelectedChapter() {
    if (selectedChapter) handleChapterSelect(selectedChapter);
  }

  const hasChapters = chapters.length > 0;
  // The selected chapter is a detached copy — if a background prefetch
  // finishes for the same id, prefer the cached copy so the view always
  // reflects completed work (never stuck on an empty shell).
  const cachedSelected = selectedChapter
    ? chapters.find((c: any) => c.id === selectedChapter.id)
    : null;
  const visibleChapter =
    cachedSelected?.content ? cachedSelected : selectedChapter;
  const repoName = repoData?.repo || repoData?.name || "UNNAMED";

  return (
    <div
      className="grid-page h-screen flex flex-col font-mono overflow-hidden"
      style={{ backgroundColor: "#050505", color: "#fff", cursor: "cell" }}
    >
      <GridOverlay />

      {/* ── TOP RULER ─────────────────────────── */}
      <div
        className="flex shrink-0 select-none z-50"
        style={{ height: RULER_H, backgroundColor: "#080808", borderBottom: "1px solid #222" }}
      >
        {/* corner */}
        <div style={{ width: RULER_W, minWidth: RULER_W, borderRight: "1px solid #222", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M0 10 L10 0" stroke="#333" strokeWidth="1" /></svg>
        </div>

        {/* col labels */}
        <div className="flex overflow-hidden">
          {colLabels.map(c => (
            <div key={c} style={{ width: CELL, minWidth: CELL, height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#444", borderRight: "1px solid #111", letterSpacing: "0.05em" }}>{c}</div>
          ))}
        </div>

        {/* breadcrumb right side */}
        <div className="ml-auto flex items-center gap-4 pr-4 shrink-0" style={{ fontSize: 10, color: "#555", letterSpacing: "0.12em" }}>
          {repoData ? (
            <>
              <span style={{ color: "#444" }}>REPO /</span>
              <span style={{ color: "#00eaff" }}>{repoName}</span>
              {selectedChapter && (
                <>
                  <span style={{ color: "#333" }}>/ CH.{String(selectedChapter.id).padStart(2, "0")}</span>
                </>
              )}
            </>
          ) : (
            <span className="uppercase">ANALYZE MODE [IDLE]</span>
          )}
          {loading && <span style={{ color: "#be29ec" }}>■ LOADING...</span>}
        </div>
      </div>

      {/* ── BODY ROW ─────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT ROW RULER */}
        <div
          className="shrink-0 overflow-hidden select-none"
          style={{ width: RULER_W, backgroundColor: "#080808", borderRight: "1px solid #222" }}
        >
          {Array.from({ length: 60 }, (_, i) => (
            <div key={i} style={{ height: CELL, display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 8, fontSize: 9, color: hasChapters && selectedChapter?.id === chapters[i]?.id ? "#be29ec" : "#333", borderBottom: "1px solid #0f0f0f" }}>
              {i + 1}
            </div>
          ))}
        </div>

        {/* SIDEBAR PANEL (shown once chapters exist) */}
        {hasChapters && (
          <Sidebar
            chapters={chapters.map((c) =>
              loadingChapter && c.id === selectedChapter?.id && !c.content
                ? { ...c, _loading: true }
                : c
            )}
            onSelectChapter={handleChapterSelect}
            selectedChapterId={selectedChapter?.id}
          />
        )}

        {/* MAIN CONTENT AREA */}
        <div
          className="flex-1 overflow-y-auto overflow-x-hidden relative"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: `${CELL}px ${CELL}px`,
          }}
        >
          {selectedChapter ? (
            <TutorialDetails
              chapter={visibleChapter}
              isLoading={loadingChapter}
              error={chapterError}
              onRetry={retrySelectedChapter}
            />
          ) : (
            /* INPUT AREA */
            <div className="flex flex-col items-center justify-center min-h-full p-16 gap-0">

              {/* headline */}
              <div style={{ width: "100%", maxWidth: 680, marginBottom: CELL * 2 }}>
                <div style={{ fontSize: 9, color: "#555", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 8 }}>
                  CELL B7 — REPO ANALYSIS ENGINE
                </div>
                <h1 style={{
                  fontSize: "clamp(40px, 6vw, 72px)",
                  fontWeight: 900,
                  letterSpacing: "-0.04em",
                  lineHeight: 1,
                  textTransform: "uppercase",
                  background: "linear-gradient(135deg, #fff 0%, #d542ff 100%)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  marginBottom: 16,
                }}>
                  Analyze Any<br />GitHub Repo
                </h1>
                <p style={{ fontSize: 13, color: "#666", lineHeight: 1.8, maxWidth: 500 }}>
                  Enter a GitHub repository URL below. The AI will traverse the codebase and generate chapter-by-chapter tutorials.
                </p>
              </div>

              {/* FORMULA BAR INPUT */}
              <div style={{ width: "100%", maxWidth: 680 }}>
                <div style={{ fontSize: 9, color: "#444", letterSpacing: "0.15em", textTransform: "uppercase", padding: "6px 0", borderTop: "1px solid #1e1e1e", borderBottom: "1px solid #1e1e1e", marginBottom: 0 }}>
                  A7 · GITHUB_REPO_URL
                </div>
                <div
                  style={{ display: "flex", border: "1px solid #2a2a2a", borderTop: "none", transition: "border-color 0.2s, box-shadow 0.2s" }}
                  onFocusCapture={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(190,41,236,0.5)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 0 20px rgba(190,41,236,0.15)"; }}
                  onBlurCapture={e => { (e.currentTarget as HTMLElement).style.borderColor = "#2a2a2a"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
                >
                  <span style={{ padding: "13px 14px", fontSize: 11, color: "#444", borderRight: "1px solid #1e1e1e", textTransform: "uppercase", letterSpacing: "0.08em", userSelect: "none", display: "flex", alignItems: "center" }}>fx</span>
                  <input
                    type="text"
                    value={repoUrl}
                    onChange={e => setRepoUrl(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && fetchGithub()}
                    placeholder="https://github.com/username/repository"
                    style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#fff", fontSize: 13, padding: "13px 14px", fontFamily: "monospace", cursor: "text" }}
                  />
                  <button
                    onClick={fetchGithub}
                    disabled={loading}
                    className="grid-page"
                    style={{ padding: "0 24px", background: loading ? "#111" : "linear-gradient(90deg, #b000ff, #d542ff)", color: loading ? "#555" : "#fff", border: "none", borderLeft: "1px solid #1e1e1e", fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", fontFamily: "monospace", transition: "box-shadow 0.2s", cursor: loading ? "not-allowed" : "pointer" }}
                    onMouseEnter={e => !loading && ((e.currentTarget as HTMLElement).style.boxShadow = "0 0 16px rgba(190,41,236,0.4)")}
                    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.boxShadow = "none")}
                  >
                    {loading ? "RUNNING..." : "RUN →"}
                  </button>
                </div>
                <div style={{ fontSize: 9, color: "#2a2a2a", padding: "5px 0", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  ↵ ENTER · OR PRESS RUN
                </div>
              </div>

              {/* REPO FOUND — generate chapters */}
              {repoData && !hasChapters && (
                <div style={{ width: "100%", maxWidth: 680, marginTop: CELL * 2, border: "1px solid #1e1e1e" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderBottom: "1px solid #1e1e1e" }}>
                    <span style={{ width: 6, height: 6, backgroundColor: "#39ff14", boxShadow: "0 0 6px #39ff14", display: "inline-block" }} />
                    <span style={{ fontSize: 9, color: "#39ff14", letterSpacing: "0.15em", textTransform: "uppercase" }}>REPO FOUND</span>
                    <span style={{ fontSize: 12, color: "#aaa", marginLeft: "auto", fontFamily: "monospace" }}>{repoName}</span>
                  </div>
                  <div style={{ padding: "16px" }}>
                    <button
                      onClick={createChapters}
                      disabled={generatingPlan}
                      style={{ width: "100%", padding: "13px", background: generatingPlan ? "#111" : "linear-gradient(90deg, #b000ff, #d542ff)", color: generatingPlan ? "#555" : "#fff", border: "none", fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", fontFamily: "monospace", cursor: generatingPlan ? "not-allowed" : "pointer" }}
                      onMouseEnter={e => (!generatingPlan && ((e.currentTarget as HTMLElement).style.boxShadow = "0 0 20px rgba(190,41,236,0.4)"))}
                      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.boxShadow = "none")}
                    >
                      {generatingPlan ? "GENERATING OUTLINE..." : "GENERATE TUTORIAL CHAPTERS →"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── STATUS BAR ─────────────────────────── */}
      <div
        className="shrink-0 flex items-center justify-between px-4 select-none"
        style={{ height: 22, backgroundColor: "#080808", borderTop: "1px solid #222", fontSize: 9, color: "#444", letterSpacing: "0.12em", textTransform: "uppercase" }}
      >
        <span>GITNEST ANALYZE v1.0</span>
        <span style={{ display: "flex", gap: 20 }}>
          {chapters.length > 0 && <span>CHAPTERS: {chapters.length}</span>}
          {selectedChapter && <span style={{ color: "#be29ec" }}>CH.{String(selectedChapter.id).padStart(2, "0")} ACTIVE</span>}
        </span>
        <span>READY</span>
      </div>

      {/* LOADING OVERLAY */}
      {loading && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
          <div style={{ border: "1px solid #2a2a2a", backgroundColor: "#050505", padding: "32px 48px", textAlign: "center" }}>
            <div style={{ width: 28, height: 28, border: "2px solid #333", borderTop: "2px solid #be29ec", borderRadius: "50%", margin: "0 auto 16px", animation: "spin 0.8s linear infinite" }} />
            <div style={{ fontSize: 10, color: "#555", letterSpacing: "0.2em", textTransform: "uppercase" }}>ANALYZING REPOSITORY...</div>
          </div>
        </div>
      )}
    </div>
  );
}
