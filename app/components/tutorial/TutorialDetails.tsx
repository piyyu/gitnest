import ReactMarkdown from "react-markdown";
import CodeBlock from "./CodeBlock";

export default function TutorialDetails({ chapter, isLoading }: { chapter: any, isLoading?: boolean }) {
  if (!chapter) return null;

  return (
    <div className="flex-1 h-full flex items-center justify-center p-4">
      <div
        className="
          w-full h-full
          max-w-4xl
          p-8 md:p-12
          rounded-3xl
          bg-[#1f566d]/80
          backdrop-blur-xl
          shadow-[0_20px_40px_-12px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.2)]
          border border-white/10
          ring-1 ring-white/5
          flex flex-col
          overflow-hidden
        "
      >
        <div className="border-b border-white/10 pb-6 mb-6">
          <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-blue-100 text-xs font-medium mb-3">
            Chapter {chapter.id}
          </span>
          <h1 className="text-3xl md:text-4xl font-semibold text-white">
            {chapter.title}
          </h1>
        </div>

        <div className="flex-1 overflow-y-auto pr-4 text-blue-50/90 leading-relaxed space-y-4 dark-scroll">
          <div className="max-w-none prose prose-invert prose-pre:bg-transparent prose-pre:p-0 prose-pre:m-0">
            {isLoading ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-4 bg-white/5 rounded w-3/4"></div>
                <div className="h-4 bg-white/5 rounded w-full"></div>
                <div className="h-4 bg-white/5 rounded w-5/6"></div>
                <div className="h-32 bg-white/5 rounded w-full mt-8"></div>
              </div>
            ) : chapter.content ? (
              <ReactMarkdown
                components={{
                  code({ className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || "");
                    const isInline = !match;

                    if (isInline) {
                      return (
                        <span
                          className="px-1.5 py-0.5 rounded-md bg-white/10 text-blue-200 font-mono text-sm border border-white/5 mx-1"
                          {...props}
                        >
                          {children}
                        </span>
                      );
                    }

                    return (
                      <CodeBlock
                        language={match ? match[1] : ""}
                        value={String(children).replace(/\n$/, "")}
                      />
                    );
                  },
                  h1: ({ children }) => (
                    <h1 className="text-3xl font-bold text-white mt-10 mb-6 pb-2 border-b border-white/10">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-2xl font-semibold text-white mt-8 mb-4">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-xl font-medium text-blue-100 mt-6 mb-3">
                      {children}
                    </h3>
                  ),
                  p: ({ children }) => (
                    <p className="text-blue-50/80 leading-7 mb-4">
                      {children}
                    </p>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc list-outside ml-6 space-y-2 mb-6 marker:text-blue-300/50">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-outside ml-6 space-y-2 mb-6 marker:text-blue-300/50">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => (
                    <li className="pl-1">
                      {children}
                    </li>
                  ),
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#8bbad8] hover:text-white underline decoration-blue-400/30 underline-offset-4 transition-colors"
                    >
                      {children}
                    </a>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-blue-400/30 pl-4 py-1 my-6 bg-white/5 rounded-r-lg">
                      {children}
                    </blockquote>
                  ),
                }}
              >
                {chapter.content}
              </ReactMarkdown>
            ) : (
              <div className="mt-8 p-6 rounded-2xl bg-black/20 border border-white/5">
                <h3 className="text-xl font-medium text-white mb-2">Summary</h3>
                <p>{chapter.summary}</p>
                <div className="mt-4 pt-4 border-t border-white/5">
                  <p className="italic text-blue-200/60 text-center text-sm">
                    Select this chapter to generate the full tutorial.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
