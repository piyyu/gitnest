import { chatCompletion } from "@/lib/groq";

export async function POST(req: Request) {
  try {
    const { chapter, repoData } = await req.json();

    if (!chapter || !repoData) {
      return Response.json(
        { error: "Missing chapter or repo data" },
        { status: 400 }
      );
    }

    // Context preparation
    // We'll give the model the file structure and maybe the summary of the chapter
    // Ideally we'd give file contents, but for now let's stick to structure + minimal context
    // to avoid token limits, or we could filtering relevant files if we had a way to know which ones.
    // For this MVP, let's pass the same repoMap as the plan route, or the raw repoData if it's not huge.
    // The plan route constructed a `repoMap`. Let's try to reconstruct something similar or just usage repoData.
    // The previous route used:
    /*
     const repoMap = {
       projectType: repoData.projectType,
       client: repoData.files.code.filter(...).map(f => f.path),
       server: repoData.files.code.filter(...).map(f => f.path),
     };
    */
    // We can do something similar but maybe include the *names* of files is enough for now.

    // Gather all paths for structure context
    const allPaths = [
      ...(repoData.files.docs || []).map((f: any) => f.path),
      ...(repoData.files.configs || []).map((f: any) => f.path),
      ...(repoData.files.code || []).map((f: any) => f.path),
    ];

    // We limit context significantly to avoid hitting the 6k TPM limit on the free/instant tier
    const repoContext = {
      projectType: repoData.projectType,
      fileTree: allPaths.slice(0, 200), // Reduced from 300 to 200
      files: repoData.files.code.slice(0, 10).map((f: any) => ({ // Reduced from 15 to 10 files
        path: f.path,
        content: f.content ? f.content.slice(0, 1000) : "// No content" // Reduced from 1500 to 1000 chars
      })),
    };

    console.log("Generating chapter using context files:", repoContext.files.map((f: any) => f.path));

    const prompt = `
You are a senior software engineer writing a specific chapter for a project tutorial.

STRICT RULES:
1. You MUST use the code provided in the Project Context.
2. CITATION REQUIRED: When you explain a concept, you must reference the specific file path where it is implemented.
3. DO NOT generate a generic "How to build X" tutorial.
4. FOCUS ONLY on the specific topic of the Chapter Info below.
5. If the chapter is about "Auth", only explain the Auth files in the context.
6. If the chapter is "Project Structure" or an overview, use the 'fileTree' to describe the architecture.
7. Use Markdown. Use code blocks with the language specified (e.g. \`\`\`tsx).

STRUCTURE REQUIREMENT:
You MUST follow this exact structure for the chapter:
1. **Introduction**: Briefly explain what this chapter covers and why it matters.
2. **Key Concepts**: A bulleted list of the core concepts or technologies involved.
3. **Implementation**: The main content. Walk through the code, explaining specific functions and lines from the context. Use code blocks with file paths as comments or descriptions.
4. **Deep Dive**: Explain *why* certain design choices were made (e.g., "Why use this hook?", "Why this folder structure?").
5. **Summary**: A short wrap-up.

Project Context (FILES FROM REPO):
${JSON.stringify(repoContext, null, 2)}

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

    const { completion } = await chatCompletion(
      [
        { role: "system", content: "You are a helpful coding tutor." },
        { role: "user", content: prompt },
      ],
      { temperature: 0.3, max_tokens: 2000, task: "chapter" }
    );

    const content = completion.choices[0]?.message?.content || "";
    console.log(`Generated chapter ${chapter.id} length: ${content.length}`);

    return Response.json({ content });

  } catch (err: any) {
    console.error("Chapter generation error:", err);
    return Response.json(
      { error: "Chapter generation failed", message: err.message },
      { status: 500 }
    );
  }
}
