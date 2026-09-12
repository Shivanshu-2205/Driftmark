"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ErrorBanner } from "@/components/ui";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

function DriftWatchLogo() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 28 }}>
      <div style={{
        width: 40, height: 40, background: "var(--green)", borderRadius: 8,
        display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12,
      }}>
        <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
          <path d="M4 10 Q7 5 10 10 Q13 15 16 10" stroke="#071a0f" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
          <circle cx="10" cy="10" r="2" fill="#071a0f"/>
        </svg>
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>DriftWatch</div>
      <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>Sign in to your workspace</div>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const body = new URLSearchParams();
      body.append("username", email);
      body.append("password", password);
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Login failed");
      }
      const data = await res.json();
      if (data.access_token) {
        localStorage.setItem("driftwatch_token", data.access_token);
      }
      router.push("/models");
    } catch (err: any) {
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", padding: "32px 16px", background: "var(--bg)",
    }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div className="card" style={{ padding: 32 }}>
          <DriftWatchLogo />

          {error && <ErrorBanner message={error} />}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="input"
                disabled={loading}
              />
            </div>

            <div>
              <label className="label" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ marginTop: 4, width: "100%", justifyContent: "center", padding: "10px 0", fontSize: 14 }}
            >
              {loading ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 14 14" style={{ animation: "spin 1s linear infinite" }}>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    <circle cx="7" cy="7" r="5" stroke="rgba(7,26,15,0.4)" strokeWidth="2" fill="none"/>
                    <path d="M7 2 A5 5 0 0 1 12 7" stroke="#071a0f" strokeWidth="2" fill="none" strokeLinecap="round"/>
                  </svg>
                  Signing in...
                </>
              ) : "Sign in"}
            </button>
          </form>

          <div style={{ marginTop: 20, padding: "10px 12px", background: "var(--bg)", borderRadius: 4, border: "1px solid var(--border)" }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Demo credentials</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-secondary)" }}>
              admin@example.com / admin123
            </div>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: "var(--text-muted)" }}>
          ML Observability Platform · v2.4.1
        </div>
      </div>
    </div>
  );
}
