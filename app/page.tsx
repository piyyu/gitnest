"use client";

import { useState } from "react";

export default function Home() {
  const [repo, setRepo] = useState("");
  const [data, setData] = useState(null);

  async function fetchGithub() {
    const res = await fetch("/api/github", {
      method: "POST",
      body: JSON.stringify({ repoUrl: repo })
    });

    const json = await res.json();
    setData(json);
  }

  return (
    <div className="w-screen p-6 space-y-4 flex flex-col items-center bg-gray-800 min-h-screen">
      <input
        value={repo}
        onChange={(e) => setRepo(e.target.value)}
        placeholder="Paste GitHub repo URL"
        className="border p-2 w-full"
      />

      <button 
        onClick={fetchGithub} 
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        Fetch GitHub Data
      </button>

      {data && <pre className="bg-gray-900 text-white p-4 rounded w-full overflow-x-auto">
        {JSON.stringify(data, null, 2)}
      </pre>}
    </div>
  );
}
