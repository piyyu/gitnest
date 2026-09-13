export async function POST(req: Request) {

  try {
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
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);
        if (!res.ok) return null;
        const text = await res.text();
        // Cap file size early to keep payloads small (skip giant/minified blobs)
        if (text.length > 100_000) return text.slice(0, 100_000);
        return text;
      } catch {
        return null;
      }
    }

    // Fetch many files concurrently instead of sequentially.
    // Sequential `await raw()` in a loop = hundreds of round-trips added up.
    async function mapWithConcurrency<T, R>(
      items: T[],
      limit: number,
      fn: (item: T, index: number) => Promise<R>
    ): Promise<R[]> {
      const results: R[] = new Array(items.length);
      let cursor = 0;
      const workers = Array.from(
        { length: Math.min(limit, items.length) },
        async () => {
          while (cursor < items.length) {
            const i = cursor++;
            results[i] = await fn(items[i], i);
          }
        }
      );
      await Promise.all(workers);
      return results;
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

    const ignoreFolders = ["node_modules", "dist", "build", "coverage", ".next", "out", "target", "bin", ".git", "vendor"];
    const skipFiles = [
      "package-lock.json",
      "pnpm-lock.yaml",
      "yarn.lock",
      "bun.lockb",
    ];

    function isIgnored(path: string) {
      if (ignoreFolders.some(f => path.startsWith(f) || path.includes(`/${f}/`))) return true;
      const lower = path.toLowerCase();
      if (skipFiles.some(s => lower.endsWith(s))) return true;
      if (lower.endsWith(".min.js") || lower.endsWith(".map") || lower.endsWith(".lock")) return true;
      // Skip blobs that are already known to be huge (tree entries carry size)
      return false;
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

      // Pre-filter blobs first so we only fetch what we'll actually use.
      // Previous code fetched sequentially inside the loop (await per file).
      const MAX_CODE_FILES = 120;
      const MAX_DOC_FILES = 10;
      const MAX_CONFIG_FILES = 15;
      const MAX_BLOB_BYTES = 100_000;

      const candidates = tree.filter((node: any) => {
        if (node.type !== "blob") return false;
        if (isIgnored(node.path)) return false;
        if (typeof node.size === "number" && node.size > MAX_BLOB_BYTES) return false;
        return true;
      });

      const docPaths: string[] = [];
      const configPaths: string[] = [];
      const codePaths: string[] = [];

      for (const node of candidates) {
        const path = node.path as string;
        if (isDocFile(path)) {
          if (docPaths.length < MAX_DOC_FILES) docPaths.push(path);
        } else if (isConfigFile(path)) {
          if (configPaths.length < MAX_CONFIG_FILES) configPaths.push(path);
        } else if (isCodeFile(path)) {
          if (codePaths.length < MAX_CODE_FILES) codePaths.push(path);
        }
        if (
          docPaths.length >= MAX_DOC_FILES &&
          configPaths.length >= MAX_CONFIG_FILES &&
          codePaths.length >= MAX_CODE_FILES
        ) {
          break;
        }
      }

      const CONCURRENCY = 20;

      const [docContents, configContents, codeContents] = await Promise.all([
        mapWithConcurrency(docPaths, CONCURRENCY, (p) => raw(p)),
        mapWithConcurrency(configPaths, CONCURRENCY, (p) => raw(p)),
        mapWithConcurrency(codePaths, CONCURRENCY, (p) => raw(p)),
      ]);

      docPaths.forEach((path, i) => {
        docs.push({ path, content: docContents[i] });
      });

      configPaths.forEach((path, i) => {
        const content = configContents[i];
        configs.push({ path, content });
        if (path.endsWith("package.json")) {
          try {
            packages.push({ path, json: JSON.parse(content || "{}") });
          } catch { }
        }
      });

      codePaths.forEach((path, i) => {
        code.push({ path, content: codeContents[i] });
      });

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
  } catch (error) {
    return Response.json({ error: "Server error" }, { status: 500 });
  }

}
