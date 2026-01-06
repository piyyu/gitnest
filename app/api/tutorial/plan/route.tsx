import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

function extractJSONArray(text: string) {
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) throw new Error("No JSON array found");
  return JSON.parse(match[0]);
}

export async function POST(req: Request) {
  try {
    const { repoData } = await req.json();

    if (!repoData?.files?.code) {
      return Response.json(
        { error: "Invalid repo data" },
        { status: 400 }
      );
    }

    // 🔹 Build a clean repo map (paths only)
    const repoMap = {
      projectType: repoData.projectType,
      client: repoData.files.code
        .filter((f: any) => f.path.startsWith("client/"))
        .map((f: any) => f.path),
      server: repoData.files.code
        .filter((f: any) => f.path.startsWith("server/"))
        .map((f: any) => f.path),
    };

    const buildRepoChapterPrompt = (repoMap: any) => {
      return `
You are a senior software engineer creating a tutorial outline.

You are given a high-level map of a project.
Your task is to decide the MAIN tutorial chapters for this project.

Rules:
- Chapters represent major systems or concepts
- Ignore configuration files and UI primitives
- Do NOT explain anything
- Do NOT include code
- 4–8 chapters maximum
- Use kebab-case for ids

Return ONLY valid JSON in this exact format:

[
  {
    "id": "string",
    "title": "string",
    "summary": "string (1 short sentence)"
  }
]

Project structure:
${JSON.stringify(repoMap, null, 2)}
`;

    }
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      temperature: 0.2,
      max_tokens: 300,
      messages: [
        { role: "system", content: "Output JSON only." },
        {
          role: "user",
          content: buildRepoChapterPrompt(repoMap),
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    const chapters = extractJSONArray(raw);

    return Response.json({ chapters });
  } catch (err: any) {
    console.error("Repo chapter planning error:", err);
    return Response.json(
      { error: "Repo chapter planning failed", message: err.message },
      { status: 500 }
    );
  }
}
