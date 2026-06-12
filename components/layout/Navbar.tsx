"use client";

import { usePathname } from "next/navigation";
import { Menu, Bell, ChevronRight } from "lucide-react";
import { useAuth } from "@/lib/auth/context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const BREADCRUMBS: Record<string, string[]> = {
  "/": ["Dashboard"],
  "/trips": ["Trips", "Semua Trip"],
  "/trips/new": ["Trips", "Input Manual"],
  "/trips/upload": ["Trips", "Upload OCR"],
  "/invoices/create": ["Invoice", "Buat Invoice"],
  "/invoices/history": ["Invoice", "Histori"],
  "/settings": ["Pengaturan"],
};

interface NavbarProps {
  onMenuClick: () => void;
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  // Build breadcrumb from dynamic routes too
  const crumbs = BREADCRUMBS[pathname] ?? [
    pathname
      .split("/")
      .filter(Boolean)
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(" › "),
  ];

  const pageTitle = crumbs[crumbs.length - 1] ?? "Dashboard";

  return (
    <header
      className="fixed top-0 right-0 z-20 flex items-center gap-4 px-5 border-b"
      style={{
        left: "var(--sidebar-width)",
        height: "var(--navbar-height)",
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderColor: "rgba(255,255,255,0.08)",
        boxShadow: "0 1px 0 0 rgba(139,92,246,0.15)",
        transition: "left 0.25s ease",
      }}
    >
      {/* Mobile menu btn */}
      <button
        className="btn-icon lg:hidden"
        onClick={onMenuClick}
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 flex-1">
        {crumbs.map((crumb, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span
              className={`text-sm ${
                i === crumbs.length - 1 ? "font-semibold" : "font-normal"
              }`}
              style={{
                color:
                  i === crumbs.length - 1
                    ? "rgba(255,255,255,0.95)"
                    : "rgba(255,255,255,0.4)",
              }}
            >
              {crumb}
            </span>
            {i < crumbs.length - 1 && (
              <ChevronRight
                className="w-3 h-3"
                style={{ color: "rgba(255,255,255,0.2)" }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* User info */}
        <div className="hidden sm:flex items-center gap-2 pl-2 border-l"
          style={{ borderColor: "rgba(255,255,255,0.1)" }}>
          <Avatar className="w-8 h-8 border border-white/10">
            <AvatarImage
              src="https://static.vecteezy.com/system/resources/previews/059/969/634/non_2x/sleek-avatar-profile-collection-with-male-and-female-user-icons-in-flat-black-outline-and-filled-style-designed-for-apps-websites-and-business-media-free-vector.jpg"
              alt="Admin Avatar"
              className="object-cover"
            />
            <AvatarFallback className="bg-purple-600 text-white text-xs font-bold flex items-center justify-center w-full h-full">
              {user?.email?.charAt(0).toUpperCase() ?? "A"}
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:block">
            <p className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.85)" }}>
              Admin
            </p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
              {user?.email}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
