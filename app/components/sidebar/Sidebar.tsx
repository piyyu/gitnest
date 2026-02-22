interface SidebarProps {
  chapters: any[];
  onSelectChapter: (chapter: any) => void;
  selectedChapterId?: number | string;
}

const CELL = 28;

export default function Sidebar({ chapters, onSelectChapter, selectedChapterId }: SidebarProps) {
  return (
    <div
      className="shrink-0 overflow-y-auto no-scrollbar"
      style={{
        width: 260,
        borderRight: "1px solid #1e1e1e",
        backgroundColor: "#050505",
      }}
    >
      {/* Sidebar header */}
      <div
        style={{
          height: CELL * 2,
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          borderBottom: "1px solid #1e1e1e",
          gap: 8,
        }}
      >
        <span style={{ width: 6, height: 6, backgroundColor: "#39ff14", boxShadow: "0 0 6px #39ff14", display: "inline-block", flexShrink: 0 }} />
        <span style={{ fontSize: 9, color: "#555", letterSpacing: "0.18em", textTransform: "uppercase" }}>
          CHAPTERS · {chapters.length} TOTAL
        </span>
      </div>

      {/* Chapter rows */}
      {chapters.map((ch, i) => {
        const isSelected = selectedChapterId === ch.id;
        const isCompleted = ch.content && !isSelected;
        return (
          <div
            key={ch.id}
            onClick={() => onSelectChapter(ch)}
            style={{
              display: "flex",
              alignItems: "flex-start",
              padding: "10px 0",
              borderBottom: "1px solid #111",
              cursor: "pointer",
              borderLeft: isSelected ? "2px solid #00eaff" : "2px solid transparent",
              backgroundColor: isSelected ? "rgba(0,234,255,0.04)" : "transparent",
              transition: "background-color 0.15s, border-left-color 0.15s",
            }}
            onMouseEnter={e => {
              if (!isSelected) {
                (e.currentTarget as HTMLElement).style.backgroundColor = "#0a0a0a";
              }
            }}
            onMouseLeave={e => {
              if (!isSelected) {
                (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
              }
            }}
          >
            {/* row number */}
            <span
              style={{
                width: 40,
                minWidth: 40,
                textAlign: "right",
                paddingRight: 12,
                fontSize: 9,
                color: isSelected ? "#00eaff" : "#333",
                fontFamily: "monospace",
                lineHeight: "20px",
                flexShrink: 0,
              }}
            >
              {String(i + 1).padStart(2, "0")}
            </span>

            {/* chapter title */}
            <div style={{ flex: 1, paddingRight: 12 }}>
              <div
                style={{
                  fontSize: 12,
                  color: isSelected ? "#fff" : "#888",
                  lineHeight: 1.4,
                  fontFamily: "monospace",
                  letterSpacing: "-0.01em",
                }}
              >
                {ch.title}
              </div>
              {isCompleted && (
                <div style={{ fontSize: 9, color: "#39ff14", letterSpacing: "0.1em", marginTop: 3, textTransform: "uppercase" }}>
                  ✓ DONE
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
