"use client";

import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

interface CodeBlockProps {
  language: string;
  value: string;
}

export default function CodeBlock({ language, value }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      style={{
        margin: "20px 0",
        border: "1px solid #222",
        fontFamily: "monospace",
      }}
    >
      {/* header row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "6px 12px",
          borderBottom: "1px solid #1e1e1e",
          backgroundColor: "#080808",
        }}
      >
        <span style={{ fontSize: 9, color: "#00eaff", letterSpacing: "0.15em", textTransform: "uppercase" }}>
          {language || "text"}
        </span>
        <button
          onClick={handleCopy}
          style={{
            fontSize: 9,
            color: copied ? "#39ff14" : "#555",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontFamily: "monospace",
            transition: "color 0.2s",
          }}
        >
          {copied ? "✓ COPIED" : "COPY"}
        </button>
      </div>

      {/* code body */}
      <div style={{ fontSize: "0.85rem", lineHeight: 1.6, overflowX: "auto" }}>
        <SyntaxHighlighter
          language={language || "text"}
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            padding: "16px",
            background: "#030303",
            fontSize: "0.8rem",
            lineHeight: "1.6",
          }}
          showLineNumbers={true}
          wrapLines={true}
          lineNumberStyle={{ minWidth: "2em", paddingRight: "1em", fontSize: "9px", opacity: 0.3, color: "#555" }}
        >
          {value}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
