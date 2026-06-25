"use client";

export function severityColor(sev: string): string {
  if (sev === "severe") return "var(--danger)";
  if (sev === "moderate") return "var(--amber)";
  return "var(--phosphor)";
}

export function SeverityTag({ severity }: { severity: string }) {
  const color = severityColor(severity);
  return (
    <span
      className="px-2 py-0.5 text-xs font-bold uppercase tracking-wider border"
      style={{
        color,
        borderColor: color,
        textShadow: `0 0 6px ${color}`,
      }}
    >
      {severity === "severe" && "▓ "}
      {severity}
    </span>
  );
}

export function StatBlock({
  label,
  value,
  sublabel,
  severity,
}: {
  label: string;
  value: string | number;
  sublabel?: string;
  severity?: string;
}) {
  const color = severity ? severityColor(severity) : "var(--phosphor-bright)";
  return (
    <div className="panel p-4">
      <div className="text-xs uppercase tracking-widest opacity-60 mb-1">{label}</div>
      <div
        className="text-3xl font-bold glow-text"
        style={{ color }}
      >
        {value}
      </div>
      {sublabel && <div className="text-xs opacity-50 mt-1">{sublabel}</div>}
    </div>
  );
}
