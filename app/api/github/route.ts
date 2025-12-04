export async function POST(req: Request) {
  const { repoUrl } = await req.json();

  const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
  if (!match) return Response.json({ error: "Invalid URL" });

  const owner = match[1];
  const repo = match[2];

  const meta = await fetch(`https://api.github.com/repos/${owner}/${repo}`).then(r => r.json());
  const branch = meta.default_branch || "main";

  const commitMeta = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/commits/${branch}`
  ).then(r => r.json());

  const treeSha = commitMeta.commit.tree.sha;

  const treeRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${treeSha}?recursive=1`
  );
  const tree = (await treeRes.json()).tree;

  async function raw(path: string) {
    const url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
    const res = await fetch(url);
    return res.ok ? await res.text() : null;
  }


  const docFiles = [
    "readme.md", "readme", "license", "contributors", "contributing.md"
  ];

  const configFiles = [
    "package.json", "tsconfig.json", "vite.config.ts", "vite.config.js",
    "next.config.js", "angular.json", "tailwind.config.js",
    "postcss.config.js", "webpack.config.js", "babel.config.js",
    "pyproject.toml", "requirements.txt", "go.mod", "Cargo.toml",
    "pom.xml", "build.gradle", "Makefile", ".env.example"
  ];

  const codeExtensions = [
    ".js", ".ts", ".jsx", ".tsx", ".py", ".java", ".go", ".rs", ".cpp",
    ".c", ".cs", ".php", ".rb", ".kt", ".swift"
  ];

  const ignoreFolders = ["node_modules", "dist", "build", "coverage", ".next", "out", "target", "bin"];

  function isIgnored(path: string) {
    return ignoreFolders.some(f => path.startsWith(f));
  }

  function isCodeFile(path: string) {
    return codeExtensions.some(ext => path.endsWith(ext));
  }

  function isDocFile(path: string) {
    const lower = path.toLowerCase();
    return docFiles.some(d => lower.endsWith(d));
  }

  function isConfigFile(path: string) {
    const lower = path.toLowerCase();
    return configFiles.some(c => lower.endsWith(c));
  }


  function detectProjectTypes(tree: any[]) {
    const paths = tree.map(n => n.path.toLowerCase());

    return {
      isNode: paths.some(p => p.endsWith("package.json")),
      isPython: paths.some(p => p.endsWith("requirements.txt") || p.endsWith("pyproject.toml")),
      isGo: paths.some(p => p.endsWith("go.mod")),
      isRust: paths.some(p => p.endsWith("cargo.toml")),
      isJava: paths.some(p => p.endsWith("pom.xml") || p.endsWith("build.gradle")),
      isMonorepo: paths.filter(p => p.endsWith("package.json")).length > 1
    };
  }

  const projectType = detectProjectTypes(tree);


  async function extractFiles() {
    const docs: any[] = [];
    const configs: any[] = [];
    const code: any[] = [];
    const packages: any[] = [];

    for (const node of tree) {
      const path = node.path;

      if (node.type !== "blob") continue;
      if (isIgnored(path)) continue;

      if (isDocFile(path)) {
        docs.push({
          path,
          content: await raw(path)
        });
        continue;
      }

      if (isConfigFile(path)) {
        const content = await raw(path);

        configs.push({ path, content });

        if (path.endsWith("package.json")) {
          try {
            packages.push({
              path,
              json: JSON.parse(content || "{}")
            });
          } catch {}
        }

        continue;
      }

      if (isCodeFile(path)) {
        if (code.length > 300) continue;

        code.push({
          path,
          content: await raw(path)
        });
      }
    }

    return { docs, configs, code, packages };
  }

  const extracted = await extractFiles();


  return Response.json({
    repo: `${owner}/${repo}`,
    branch,
    projectType,
    stats: {
      totalFiles: tree.length,
      docs: extracted.docs.length,
      configs: extracted.configs.length,
      code: extracted.code.length,
      packages: extracted.packages.length,
    },
    files: extracted
  });
}
