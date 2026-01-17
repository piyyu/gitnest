import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Check, Copy } from "lucide-react";

interface CodeBlockProps {
  language: string;
  value: string;
}

export default function CodeBlock({ language, value }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group rounded-xl overflow-hidden my-6 border border-white/10 shadow-2xl bg-[#1e1e1e]">
      <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/5">
        <span className="text-xs font-mono text-blue-200/60 uppercase tracking-wider">
          {language || "text"}
        </span>
        <button
          onClick={handleCopy}
          className="
            p-1.5 rounded-lg
            text-white/40 hover:text-white hover:bg-white/10
            transition-all duration-200
          "
          aria-label="Copy code"
        >
          {copied ? (
            <Check size={16} className="text-green-400" />
          ) : (
            <Copy size={16} />
          )}
        </button>
      </div>
      <div className="text-sm font-mono overflow-auto">
        <SyntaxHighlighter
          language={language || "text"}
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            padding: "1.5rem",
            background: "transparent",
            fontSize: "0.9rem",
            lineHeight: "1.5",
          }}
          showLineNumbers={true}
          wrapLines={true}
          lineNumberStyle={{ minWidth: "2.5em", paddingRight: "1em", opacity: 0.3 }}
        >
          {value}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
