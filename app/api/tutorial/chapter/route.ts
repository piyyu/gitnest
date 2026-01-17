import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

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

    // We limit to top 50 files and truncate content to avoid token limits
    const repoContext = {
      projectType: repoData.projectType,
      fileTree: allPaths.slice(0, 500), // Provide a broad view of the file structure
      files: repoData.files.code.slice(0, 50).map((f: any) => ({
        path: f.path,
        content: f.content ? f.content.slice(0, 8000) : "// No content"
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

Project Context (FILES FROM REPO):
${JSON.stringify(repoContext, null, 2)}

Chapter Info:
ID: ${chapter.id}
Title: ${chapter.title}
Summary: ${chapter.summary}

Task:
Write the detailed tutorial content for this SINGLE chapter.
Start immediately with a level 1 heading (# ${chapter.title}).
`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      temperature: 0.3,
      max_tokens: 2000,
      messages: [
        { role: "system", content: "You are a helpful coding tutor." },
        { role: "user", content: prompt },
      ],
    });

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
