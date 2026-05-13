"use client";

export default function EmptyState() {
  return (
    <div className="flex flex-col items-start gap-0">
      {/* A few blank ruled lines before the message */}
      {[1, 2, 3].map((n) => (
        <div key={n} className="flex items-center" style={{ minHeight: "40px", width: "100%" }}>
          <div className="w-10 flex-shrink-0 flex items-center justify-end pr-3">
            <span className="font-mono text-[10px] text-ink-faint/40 select-none">
              {String(n).padStart(2, "0")}
            </span>
          </div>
          <div className="w-px self-stretch bg-margin/20 flex-shrink-0" />
        </div>
      ))}

      {/* Message line */}
      <div className="flex items-center" style={{ minHeight: "40px", width: "100%" }}>
        <div className="w-10 flex-shrink-0 flex items-center justify-end pr-3">
          <span className="font-mono text-[10px] text-ink-faint/40 select-none">04</span>
        </div>
        <div className="w-px self-stretch bg-margin/20 flex-shrink-0" />
        <div className="px-4 flex items-center gap-3">
          <span className="font-mono text-xs text-ink-faint">// no tasks yet —</span>
          <span className="font-mono text-xs text-accent/70">press N to add one</span>
        </div>
      </div>

      {/* Cursor line */}
      <div className="flex items-center" style={{ minHeight: "40px", width: "100%" }}>
        <div className="w-10 flex-shrink-0 flex items-center justify-end pr-3">
          <span className="font-mono text-[10px] text-ink-faint/40 select-none">05</span>
        </div>
        <div className="w-px self-stretch bg-margin/20 flex-shrink-0" />
        <div className="px-4 flex items-center">
          <span className="font-mono text-sm text-ink-faint animate-blink">|</span>
        </div>
      </div>
    </div>
  );
}
