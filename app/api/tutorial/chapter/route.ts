import { chatCompletion, streamChatCompletion } from "@/lib/groq";

export const maxDuration = 60;

// Pick files relevant to this chapter instead of always the first N.
// The old code sent the same first 10 files for every chapter — wasteful
// input tokens (slower TTFT) and generic output. Keyword overlap on the
// file path is a cheap but effective relevance signal.
function selectRelevantFiles(chapter: any, codeFiles: any[], maxFiles = 6) {
  const text = `${chapter?.id || ""} ${chapter?.title || ""} ${chapter?.summary || ""}`.toLowerCase();
  const keywords = text.split(/[^a-z0-9]+/g).filter((w) => w.length > 2);
  const stop = new Set([
    "the", "and", "for", "with", "from", "into", "your", "you", "this",
    "that", "chapter", "part", "guide", "tutorial", "introduction", "overview",
    "deep", "dive", "summary", "concepts", "concept", "implementation",
  ]);
  const terms = keywords.filter((w) => !stop.has(w));

  const scored = codeFiles.map((f: any, index: number) => {
    const pathLower = String(f.path || "").toLowerCase();
    const segments = pathLower.split(/[\/._-]+/g);
    let score = 0;
    for (const t of terms) {
      if (pathLower.includes(t)) {
        score += segments.includes(t) ? 3 : 1;
      }
    }
    // Prefer entry-point / structural files for overview chapters.
    if (/overview|structure|getting-started|setup|introduction/.test(text)) {
      if (/readme|index|main|app|server|config|package\.json/.test(pathLower)) score += 2;
    }
    return { f, score, index };
  });

  scored.sort((a, b) => b.score - a.score || a.index - b.index);
  const top = scored.slice(0, maxFiles).map((s) => s.f);

  // If nothing matched (all scores 0), fall back to a diverse spread
  // across the repo instead of the first N alphabetically.
  if (top.length > 0 && scored[0].score === 0 && codeFiles.length > maxFiles) {
    const step = Math.max(1, Math.floor(codeFiles.length / maxFiles));
    const spread: any[] = [];
    for (let i = 0; i < codeFiles.length && spread.length < maxFiles; i += step) {
      spread.push(codeFiles[i]);
    }
    return spread;
  }
  return top;
}

function buildRepoContext(chapter: any, repoData: any) {
  const allPaths = [
    ...(repoData.files.docs || []).map((f: any) => f.path),
    ...(repoData.files.configs || []).map((f: any) => f.path),
    ...(repoData.files.code || []).map((f: any) => f.path),
  ];

  const relevant = selectRelevantFiles(chapter, repoData.files.code || [], 6);

  return {
    projectType: repoData.projectType,
    fileTree: allPaths.slice(0, 150),
    files: relevant.map((f: any) => ({
      path: f.path,
      content: f.content ? String(f.content).slice(0, 1800) : "// No content",
    })),
  };
}

function buildPrompt(chapter: any, repoContext: any) {
  return `
You are a senior software engineer writing a specific chapter for a project tutorial.

STRICT RULES:
1. You MUST use the code provided in the Project Context.
2. CITATION REQUIRED: When you explain a concept, you must reference the specific file path where it is implemented.
3. DO NOT generate a generic "How to build X" tutorial.
4. FOCUS ONLY on the specific topic of the Chapter Info below.
5. If the chapter is about "Auth", only explain the Auth files in the context.
6. If the chapter is "Project Structure" or an overview, use the 'fileTree' to describe the architecture.
7. Use Markdown. Use code blocks with the language specified (e.g. \`\`\`tsx).
8. Be concise but complete. Aim for ~700-1000 words.

STRUCTURE REQUIREMENT:
You MUST follow this exact structure for the chapter:
1. **Introduction**: Briefly explain what this chapter covers and why it matters.
2. **Key Concepts**: A bulleted list of the core concepts or technologies involved.
3. **Implementation**: The main content. Walk through the code, explaining specific functions and lines from the context. Use code blocks with file paths as comments or descriptions.
4. **Deep Dive**: Explain *why* certain design choices were made (e.g., "Why use this hook?", "Why this folder structure?").
5. **Summary**: A short wrap-up.

Project Context (FILES FROM REPO):
${JSON.stringify(repoContext)}

Chapter Info:
ID: ${chapter.id}
Title: ${chapter.title}
Summary: ${chapter.summary}


Task:
Write the detailed tutorial content for this SINGLE chapter following the structure above.
IMPORTANT Rules for Output:
1. DO NOT output the Chapter Title as a heading. It is already shown in the UI. Start directly with the "**Introduction**" section (use ## Introduction).
2. DO NOT use decorative separator lines (like "======" or "------").
3. Use at most ## (H2) for top-level sections since the page title is H1.
`;
}

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const wantsStream =
      url.searchParams.get("stream") === "1" ||
      req.headers.get("accept")?.includes("text/event-stream");

    const { chapter, repoData } = await req.json();

    if (!chapter || !repoData) {
      return Response.json(
        { error: "Missing chapter or repo data" },
        { status: 400 }
      );
    }

    const repoContext = buildRepoContext(chapter, repoData);
    console.log(
      "Generating chapter using context files:",
      repoContext.files.map((f: any) => f.path)
    );

    const messages = [
      { role: "system" as const, content: "You are a helpful coding tutor." },
      { role: "user" as const, content: buildPrompt(chapter, repoContext) },
    ];
    const genOpts = { temperature: 0.3, max_tokens: 2000, task: "chapter" as const };

    if (wantsStream) {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          try {
            const { content, model } = await streamChatCompletion(messages, {
              ...genOpts,
              onToken: (token) => {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ token })}\n\n`)
                );
              },
            });
            console.log(
              `Streamed chapter ${chapter.id} with model: ${model} length: ${content.length}`
            );
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ done: true, content })}\n\n`)
            );
          } catch (err: any) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ error: err?.message || "generation failed" })}\n\n`
              )
            );
          } finally {
            controller.close();
          }
        },
      });
      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    const { completion, model } = await chatCompletion(messages, genOpts);

    const content = completion.choices[0]?.message?.content || "";
    console.log(`Generated chapter ${chapter.id} with model: ${model} length: ${content.length}`);

    return Response.json({ content });
  } catch (err: any) {
    console.error("Chapter generation error:", err);
    return Response.json(
      { error: "Chapter generation failed", message: err.message },
      { status: 500 }
    );
  }
}
