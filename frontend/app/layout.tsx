import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DriftWatch — AI Drift Monitoring",
  description: "Model drift detection and reliability monitoring dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
