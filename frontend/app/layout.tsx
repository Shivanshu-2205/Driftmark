import type { Metadata } from "next";
import "./globals.css";
import ProtectedRoute from "@/components/ProtectedRoute";

export const metadata: Metadata = {
  title: "DriftWatch — Production ML Observability & Drift Detection",
  description: "Real-time model monitoring, feature drift detection, and reliability engineering platform for production ML systems.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <ProtectedRoute>{children}</ProtectedRoute>
      </body>
    </html>
  );
}