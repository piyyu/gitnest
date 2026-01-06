interface SidebarProps {
  chapters: any[];
  onSelectChapter: (chapter: any) => void;
  selectedChapterId?: number | string;
}

export default function Sidebar({ chapters, onSelectChapter, selectedChapterId }: SidebarProps) {
  return (
    <aside
      className="
        hidden md:flex flex-col
        w-80 h-[95vh]
        my-auto ml-4
        rounded-3xl
        bg-[#1f566d]/80
        backdrop-blur-xl
        border border-white/10
        shadow-[0_20px_40px_-12px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.2)]
        overflow-hidden
      "
    >
      <div className="p-6 border-b border-white/10">
        <h2 className="text-xl font-semibold text-white">Chapters</h2>
        <p className="text-sm text-blue-100/60 mt-1">Generated tutorials</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {chapters.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center text-blue-200/40 border-2 border-dashed border-white/5 rounded-2xl mx-2">
            <p className="text-sm">No chapters yet</p>
          </div>
        ) : (
          chapters.map((ch) => {
            const isSelected = selectedChapterId === ch.id;
            return (
              <div
                key={ch.id}
                onClick={() => onSelectChapter(ch)}
                className={`
                  group
                  relative
                  p-4
                  rounded-xl
                  border
                  cursor-pointer
                  transition-all duration-200
                  ${isSelected
                    ? "bg-white/20 border-white/30 shadow-lg ring-1 ring-white/10"
                    : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10"
                  }
                `}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isSelected ? "bg-white text-[#1f566d]" : "bg-white/10 text-blue-100"}`}>
                    {ch.id}
                  </span>
                </div>
                <h3 className={`font-medium transition-colors line-clamp-2 ${isSelected ? "text-white" : "text-blue-50 group-hover:text-white"}`}>
                  {ch.title}
                </h3>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
