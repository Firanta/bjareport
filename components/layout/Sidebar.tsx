"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Truck,
  FileText,
  Settings,
  LogOut,
  X,
  ChevronRight,
  Camera,
  FilePlus,
  History,
} from "lucide-react";
import { useAuth } from "@/lib/auth/context";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  children?: { label: string; href: string; icon: React.ElementType }[];
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    label: "Trips",
    href: "/trips",
    icon: Truck,
    children: [
      { label: "Semua Trip", href: "/trips", icon: Truck },
      { label: "Input Manual", href: "/trips/new", icon: FilePlus },
      { label: "Upload OCR", href: "/trips/upload", icon: Camera },
    ],
  },
  {
    label: "Invoice",
    href: "/invoices",
    icon: FileText,
    children: [
      { label: "Buat Invoice", href: "/invoices/create", icon: FilePlus },
      { label: "Histori Invoice", href: "/invoices/history", icon: History },
    ],
  },
  {
    label: "Pengaturan",
    href: "/settings",
    icon: Settings,
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    Cookies.remove("firebase-auth-token", { path: '/' });
    toast.success("Berhasil keluar");
    window.location.href = "/login";
  }

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className="sidebar"
        style={{
          transform: isOpen ? "translateX(0)" : undefined,
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center justify-between px-5 py-5 border-b"
          style={{ borderColor: "rgba(255,255,255,0.1)" }}
        >
          <div className="flex items-center gap-3">
            <img
              src="https://i.ibb.co.com/bGPrxV1/logov3.png"
              alt="BJA Logo"
              className="w-9 h-9 rounded-lg object-cover border border-white/10"
            />
            <div>
              <div className="text-white font-bold text-sm">BJA Report</div>
              <div className="text-xs" style={{ color: "var(--brand-300)" }}>
                WMS Transportasi
              </div>
            </div>
          </div>
          <button
            className="btn-icon lg:hidden"
            style={{ color: "rgba(255,255,255,0.6)" }}
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            if (!item.children) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-all"
                  style={{
                    background: active
                      ? "rgba(255,255,255,0.12)"
                      : "transparent",
                    color: active ? "white" : "rgba(255,255,255,0.65)",
                  }}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span className="text-sm font-medium">{item.label}</span>
                  {active && (
                    <ChevronRight className="w-4 h-4 ml-auto opacity-60" />
                  )}
                </Link>
              );
            }

            return (
              <div key={item.href} className="mb-1">
                <div
                  className="flex items-center gap-3 px-3 py-2.5"
                  style={{ color: "rgba(255,255,255,0.4)" }}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-semibold uppercase tracking-widest">
                    {item.label}
                  </span>
                </div>
                {item.children.map((child) => {
                  const ChildIcon = child.icon;
                  const childActive = pathname === child.href;
                  return (
                    <Link
                      key={child.href}
                      href={child.href}
                      onClick={onClose}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg mb-0.5 ml-2 transition-all"
                      style={{
                        background: childActive
                          ? "rgba(255,255,255,0.12)"
                          : "transparent",
                        color: childActive
                          ? "white"
                          : "rgba(255,255,255,0.65)",
                      }}
                    >
                      <ChildIcon className="w-4 h-4 shrink-0" />
                      <span className="text-sm">{child.label}</span>
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* Bottom */}
        <div
          className="p-3 border-t"
          style={{ borderColor: "rgba(255,255,255,0.1)" }}
        >
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left"
            style={{ color: "rgba(255,255,255,0.6)" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background =
                "rgba(255,255,255,0.08)";
              (e.currentTarget as HTMLElement).style.color =
                "rgba(255,255,255,0.9)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "transparent";
              (e.currentTarget as HTMLElement).style.color =
                "rgba(255,255,255,0.6)";
            }}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium">Keluar</span>
          </button>
        </div>
      </aside>
    </>
  );
}
