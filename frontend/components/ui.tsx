"use client";

export function severityColor(sev: string): string {
  if (sev === "severe") return "var(--red)";
  if (sev === "moderate") return "var(--amber)";
  return "var(--green)";
}

export function severityBadgeClass(sev: string): string {
  if (sev === "severe") return "badge badge-red";
  if (sev === "moderate") return "badge badge-amber";
  return "badge badge-green";
}

export function SeverityTag({ severity }: { severity: string }) {
  const badgeClass = severityBadgeClass(severity);
  const labels: Record<string, string> = {
    severe: "Severe",
    moderate: "Moderate",
    none: "Stable",
  };
  return (
    <span className={badgeClass}>
      <span
        className="dot"
        style={{
          background: severityColor(severity),
          width: 6,
          height: 6,
        }}
      />
      {labels[severity] ?? severity}
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
  const color = severity ? severityColor(severity) : "var(--green-bright)";
  return (
    <div className="card" style={{ padding: "20px 24px" }}>
      <div style={{ fontSize: 11, fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color, fontFamily: "var(--font-mono)", lineHeight: 1, marginBottom: sublabel ? 6 : 0 }}>
        {value}
      </div>
      {sublabel && (
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
          {sublabel}
        </div>
      )}
    </div>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div style={{
      background: "rgba(239,68,68,0.08)",
      border: "1px solid rgba(239,68,68,0.35)",
      borderRadius: 4,
      color: "var(--red)",
      fontSize: 13,
      padding: "10px 14px",
      marginBottom: 16,
    }}>
      ✕ {message}
    </div>
  );
}

export function EmptyState({ icon = "◈", title, body, action }: { icon?: string; title: string; body?: string; action?: React.ReactNode }) {
  return (
    <div style={{ textAlign: "center", padding: "64px 32px" }}>
      <div style={{ fontSize: 32, marginBottom: 16, color: "var(--text-muted)" }}>{icon}</div>
      <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 }}>{title}</div>
      {body && <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 24 }}>{body}</div>}
      {action}
    </div>
  );
}

export function LoadingSpinner({ text = "Loading..." }: { text?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "80px 32px", color: "var(--text-muted)", fontSize: 13 }}>
      <svg width="16" height="16" viewBox="0 0 16 16" style={{ animation: "spin 1s linear infinite" }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <circle cx="8" cy="8" r="6" stroke="var(--border)" strokeWidth="2" fill="none"/>
        <path d="M8 2 A6 6 0 0 1 14 8" stroke="var(--green)" strokeWidth="2" fill="none" strokeLinecap="round"/>
      </svg>
      {text}
    </div>
  );
}
