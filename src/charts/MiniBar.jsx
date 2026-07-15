export function MiniBar({ value, max, tone = "bg-accent", className }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div
      className={`h-1.5 w-full overflow-hidden rounded-full bg-inset ${className || ""}`}
    >
      <div
        className={`h-full rounded-full ${tone}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
