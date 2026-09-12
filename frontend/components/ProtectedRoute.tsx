"use client";

import { useEffect, useState, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";
const PUBLIC_PATHS = ["/", "/auth/login", "/docs"];

interface Props {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Skip auth check for public pages
    if (PUBLIC_PATHS.includes(pathname)) {
      setChecking(false);
      return;
    }

    const token = localStorage.getItem("driftwatch_token");
    if (!token) {
      router.replace("/auth/login");
      return;
    }

    // Verify token is still valid via /auth/me
    fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) {
          localStorage.removeItem("driftwatch_token");
          router.replace("/auth/login");
        } else {
          setChecking(false);
        }
      })
      .catch(() => {
        // In local development if backend is not running, don't crash
        setChecking(false);
      });
  }, [pathname, router]);

  if (checking && !PUBLIC_PATHS.includes(pathname)) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text-muted)",
          fontSize: "13px",
          gap: 10,
          background: "var(--bg)",
        }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" style={{ animation: "spin 1s linear infinite" }}>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <circle cx="8" cy="8" r="6" stroke="var(--border)" strokeWidth="2" fill="none"/>
          <path d="M8 2 A6 6 0 0 1 14 8" stroke="var(--green)" strokeWidth="2" fill="none" strokeLinecap="round"/>
        </svg>
        Verifying session...
      </div>
    );
  }

  return <>{children}</>;
}