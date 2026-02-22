"use client";

import ReactMarkdown from "react-markdown";
import CodeBlock from "./CodeBlock";

interface TutorialDetailsProps {
  chapter: any;
  isLoading: boolean;
}

export default function TutorialDetails({ chapter, isLoading }: TutorialDetailsProps) {
  const CELL = 28;

  if (isLoading) {
    return (
      <div style={{ padding: "48px 48px", fontFamily: "monospace" }}>
        {/* skeleton header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ height: 9, backgroundColor: "#111", width: 180, marginBottom: 12 }} />
          <div style={{ height: 28, backgroundColor: "#0d0d0d", width: "60%", marginBottom: 8 }} />
          <div style={{ height: 28, backgroundColor: "#0a0a0a", width: "40%" }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ height: 13, backgroundColor: "#0a0a0a", width: `${70 + Math.random() * 25}%` }} />
          ))}
        </div>
        <div style={{ fontSize: 9, color: "#333", letterSpacing: "0.15em", textTransform: "uppercase", marginTop: 32 }}>
          ■ GENERATING CONTENT...
        </div>
      </div>
    );
  }

  if (!chapter?.content) {
    return (
      <div style={{ padding: "48px 48px", fontFamily: "monospace" }}>
        <div style={{ fontSize: 9, color: "#555", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 16 }}>
          CHAPTER · {String(chapter.id).padStart(2, "0")}
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 900, color: "#fff", textTransform: "uppercase", letterSpacing: "-0.03em", marginBottom: 12 }}>
          {chapter.title}
        </h2>
        <p style={{ fontSize: 13, color: "#555", lineHeight: 1.8 }}>
          {chapter.description || "Click the chapter to generate the full tutorial content."}
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: "48px clamp(24px, 5vw, 80px)", maxWidth: 860, fontFamily: "monospace" }}>

      {/* chapter header */}
      <div style={{ marginBottom: CELL * 2, paddingBottom: CELL, borderBottom: "1px solid #1e1e1e" }}>
        <div style={{ fontSize: 9, color: "#555", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 12, display: "flex", gap: 16 }}>
          <span>CH.{String(chapter.id).padStart(2, "0")}</span>
          <span style={{ color: "#2a2a2a" }}>·</span>
          <span>TUTORIAL CONTENT</span>
        </div>
        <h1
          style={{
            fontSize: "clamp(24px, 4vw, 40px)",
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "-0.04em",
            lineHeight: 1.1,
            background: "linear-gradient(135deg, #fff 0%, #d542ff 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          {chapter.title}
        </h1>
      </div>

      {/* markdown content */}
      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <h1 style={{ fontSize: 22, fontWeight: 900, color: "#fff", textTransform: "uppercase", letterSpacing: "-0.03em", marginTop: 40, marginBottom: 12, borderBottom: "1px solid #1e1e1e", paddingBottom: 8 }}>
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 32, marginBottom: 10, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 8, height: 8, backgroundColor: "var(--accent-cyan)", display: "inline-block", flexShrink: 0 }} />
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 24, marginBottom: 8 }}>
              // {children}
            </h3>
          ),
          p: ({ children }) => (
            <p style={{ fontSize: 14, color: "#888", lineHeight: 1.9, marginBottom: 16 }}>
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul style={{ margin: "12px 0 16px 0", paddingLeft: 0, listStyle: "none" }}>
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol style={{ margin: "12px 0 16px 0", paddingLeft: 0, listStyle: "none", counterReset: "item" }}>
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li style={{ fontSize: 13, color: "#777", lineHeight: 1.8, marginBottom: 6, paddingLeft: 20, position: "relative", display: "flex", gap: 10 }}>
              <span style={{ color: "#be29ec", flexShrink: 0 }}>›</span>
              <span>{children}</span>
            </li>
          ),
          a: ({ href, children }) => (
            <a href={href} style={{ color: "#00eaff", textDecoration: "none", borderBottom: "1px solid rgba(0,234,255,0.3)", transition: "border-color 0.2s" }}>
              {children}
            </a>
          ),
          blockquote: ({ children }) => (
            <blockquote style={{ borderLeft: "2px solid #be29ec", paddingLeft: 16, margin: "16px 0", color: "#666", fontStyle: "italic" }}>
              {children}
            </blockquote>
          ),
          strong: ({ children }) => (
            <strong style={{ color: "#ccc", fontWeight: 700 }}>{children}</strong>
          ),
          code({ children, className }) {
            const match = /language-(\w+)/.exec(className || "");
            const lang = match ? match[1] : "";
            const codeStr = String(children).replace(/\n$/, "");
            const isBlock = codeStr.includes("\n") || !!match;
            if (isBlock) {
              return <CodeBlock language={lang} value={codeStr} />;
            }
            return (
              <code style={{ backgroundColor: "#111", color: "#00eaff", padding: "1px 6px", fontSize: "0.85em", border: "1px solid #222", fontFamily: "monospace" }}>
                {children}
              </code>
            );
          },
        }}
      >
        {chapter.content}
      </ReactMarkdown>

      {/* next chapter footer */}
      <div style={{ marginTop: 64, paddingTop: 24, borderTop: "1px solid #1e1e1e", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 9, color: "#333", letterSpacing: "0.15em", textTransform: "uppercase" }}>
          END OF CH.{String(chapter.id).padStart(2, "0")}
        </span>
        <span style={{ fontSize: 9, color: "#333", letterSpacing: "0.15em", textTransform: "uppercase" }}>
          SELECT NEXT CHAPTER IN SIDEBAR →
        </span>
      </div>
    </div>
  );
}
