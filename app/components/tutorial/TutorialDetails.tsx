export default function TutorialDetails({ chapter }: { chapter: any }) {
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

        <div className="flex-1 overflow-y-auto pr-4 text-blue-50/90 leading-relaxed space-y-4">
          <div className="prose prose-invert max-w-none">
            {/* Placeholder for actual markdown content */}
            <h3 className="text-xl font-medium text-white mb-2">Summary</h3>
            <p>{chapter.summary}</p>

            <div className="mt-8 p-6 rounded-2xl bg-black/20 border border-white/5">
              <p className="italic text-blue-200/60 text-center">
                Full tutorial content generation coming soon...
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
