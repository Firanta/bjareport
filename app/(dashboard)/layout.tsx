"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { useAuth } from "@/lib/auth/context";
import { useRouter } from "next/navigation";
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
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div
          className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: "var(--brand-500)" }}
        />
      </div>
    );
  }

  if (!user) {
    return null; // Prevents flashing dashboard content while redirecting
  }

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
