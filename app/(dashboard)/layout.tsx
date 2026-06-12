"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import dynamic from "next/dynamic";

const ParticleBackground = dynamic(
  () => import("@/components/ui/particle-background"),
  { ssr: false }
);

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="relative min-h-screen" style={{ background: "#000" }}>
      {/* Particle canvas — fixed behind everything */}
      <div className="fixed inset-0 z-0">
        <ParticleBackground />
      </div>

      {/* Subtle purple radial glow */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 60% 40%, rgba(139,92,246,0.10) 0%, transparent 70%)",
        }}
      />

      {/* Sidebar & Navbar sit above the canvas */}
      <div className="relative z-10">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="main-content">
          <div className="page-container animate-fade-in">{children}</div>
        </main>
      </div>
    </div>
  );
}
