"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/lib/api";

function DriftWatchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="20" height="20" rx="4" fill="#22c55e"/>
      <path d="M4 10 Q7 5 10 10 Q13 15 16 10" stroke="#071a0f" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
      <circle cx="10" cy="10" r="2" fill="#071a0f"/>
    </svg>
  );
}

interface NavbarProps {
  rightContent?: React.ReactNode;
}

export default function Navbar({ rightContent }: NavbarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <nav className="navbar">
      <Link href="/" className="navbar-logo">
        <DriftWatchIcon />
        <span>DriftWatch</span>
        <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 400, marginLeft: 2 }}>v2.4</span>
      </Link>

      <ul className="navbar-links">
        <li><Link href="/#features" className={isActive("/#features") ? "active" : ""}>Features</Link></li>
        <li><Link href="/#how" className={isActive("/#how") ? "active" : ""}>How It Works</Link></li>
        <li><Link href="/models" className={isActive("/models") ? "active" : ""}>Registry</Link></li>
        <li><Link href="/docs" className={isActive("/docs") ? "active" : ""}>Docs</Link></li>
      </ul>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-muted)" }}>
          <span className="dot dot-green pulse" />
          <span>System: Online</span>
        </div>
        {rightContent}
      </div>
    </nav>
  );
}

export function AppNavbar() {
  return (
    <nav className="navbar">
      <Link href="/" className="navbar-logo">
        <DriftWatchIcon />
        <span>DriftWatch</span>
        <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 400, marginLeft: 2 }}>v2.4</span>
      </Link>

      <ul className="navbar-links">
        <li><Link href="/models">Registry</Link></li>
        <li><Link href="/docs">Docs</Link></li>
      </ul>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-muted)" }}>
          <span className="dot dot-green pulse" />
          <span>Online</span>
        </div>
        <button
          onClick={() => logout()}
          style={{
            background: "transparent",
            border: "1px solid var(--border)",
            borderRadius: 4,
            color: "var(--text-secondary)",
            fontSize: 12,
            padding: "5px 10px",
            cursor: "pointer",
            fontFamily: "var(--font-sans)",
          }}
        >
          Sign out
        </button>
      </div>
    </nav>
  );
}
