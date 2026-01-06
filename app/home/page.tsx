"use client";

import { useState } from "react";
import Sidebar from "../components/sidebar/Sidebar";
import TutorialDetails from "../components/tutorial/TutorialDetails";

export default function Home() {
  const [repoUrl, setRepoUrl] = useState("");
  const [repoData, setRepoData] = useState<any>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState<any>(null);

  async function fetchGithub() {
    setLoading(true);

    const res = await fetch("/api/github", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repoUrl }),
    });

    const json = await res.json();
    setRepoData(json);
    console.log("Fetched repo data:", json);

    setLoading(false);
  }

  async function createChapters() {
    if (!repoData) return;

    const res = await fetch("/api/tutorial/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repoData }),
    });

    if (!res.ok) {
      console.error("Failed to generate chapters");
      return;
    }

    const json = await res.json();
    setChapters(json.chapters);

    // Auto-select first chapter
    if (json.chapters && json.chapters.length > 0) {
      setSelectedChapter(json.chapters[0]);
    }
  }


  return (
    <main className="h-screen w-screen bg-[url('/bg.webp')] bg-cover bg-center overflow-hidden flex items-center p-4 gap-6">
      {chapters.length > 0 && (
        <Sidebar
          chapters={chapters}
          onSelectChapter={setSelectedChapter}
          selectedChapterId={selectedChapter?.id}
        />
      )}

      {selectedChapter ? (
        <TutorialDetails chapter={selectedChapter} />
      ) : (
        <div className="flex-1 h-full flex items-center justify-center p-4">
          <div
            className="
            w-full max-w-2xl
            p-8 md:p-12
            rounded-3xl
            bg-[#1f566d]/80
            backdrop-blur-xl
            shadow-[0_20px_40px_-12px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.2)]
            border border-white/10
            ring-1 ring-white/5
            flex flex-col gap-6
          "
          >
            <div>
              <h2 className="text-3xl font-semibold text-white mb-2">Analyze Repository</h2>
              <p className="text-blue-100/80 max-w-lg">
                Enter a GitHub URL to generate step-by-step tutorials and understanding.
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium text-blue-100 ml-1 mb-2 block">GitHub Repository URL</label>
                <input
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/username/repo"
                  className="
                  w-full px-5 py-4
                  rounded-2xl
                  bg-[#1b4b5f]/60
                  border border-white/10
                  text-white placeholder-white/40
                  focus:outline-none focus:ring-2 focus:ring-[#8bbad8]/50 focus:border-transparent
                  transition-all
                  text-lg
                "
                />
              </div>

              <button
                onClick={fetchGithub}
                className="
                w-full py-4 px-6
                rounded-2xl
                bg-gradient-to-b from-[#8bbad8] to-[#7aa9c6]
                text-white text-lg font-semibold
                shadow-[0_4px_14px_0_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.4)]
                hover:shadow-[0_6px_20px_rgba(0,0,0,0.23),inset_0_1px_0_rgba(255,255,255,0.5)]
                border-t border-white/20
                transition-all duration-200
                transform active:scale-[0.98]
              "
              >
                {loading ? "Analyzing..." : "Fetch Repository"}
              </button>

              {repoData && (
                <div className="pt-6 border-t border-white/10 mt-6 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center gap-4 mb-6 p-4 bg-white/5 rounded-xl border border-white/5">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-xl">📦</div>
                    <div>
                      <p className="text-xs text-blue-200 uppercase tracking-wider font-medium">Repository Found</p>
                      <p className="text-white font-semibold text-lg">{repoData.name || "Repository"}</p>
                    </div>
                  </div>
                  <button
                    onClick={createChapters}
                    className="
                    w-full py-4 px-6
                    rounded-2xl
                    bg-white/10
                    text-white font-medium
                    border border-white/10
                    hover:bg-white/20 hover:border-white/20
                    shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]
                    transition-all duration-200
                  "
                  >
                    Generate Tutorials
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="fixed inset-0 bg-[#0f2d3a]/60 backdrop-blur-sm flex items-center justify-center z-[100]">
          <div className="flex flex-col items-center gap-4 p-8 rounded-3xl bg-[#1f566d] border border-white/10 shadow-2xl">
            <div className="w-12 h-12 border-4 border-[#8bbad8] border-t-transparent rounded-full animate-spin"></div>
            <span className="text-white font-medium text-lg">Analyzing Repository...</span>
          </div>
        </div>
      )}
    </main>
  );
}
