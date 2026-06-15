"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { X, CheckCircle2, AlertTriangle, Info, AlertCircle, ShieldAlert } from "lucide-react";

// ─── Variant config ──────────────────────────────────────────────────────────
type AlertVariant = "secondary" | "success" | "warning" | "danger" | "info";

interface VariantStyle {
  border: string;
  bg: string;
  glow: string;
  iconBg: string;
  iconColor: string;
  titleColor: string;
  bodyColor: string;
  barColor: string;
  Icon: React.ElementType;
}

const VARIANTS: Record<AlertVariant, VariantStyle> = {
  secondary: {
    border: "rgba(255,255,255,0.10)",
    bg: "rgba(255,255,255,0.04)",
    glow: "rgba(255,255,255,0.0)",
    iconBg: "rgba(255,255,255,0.08)",
    iconColor: "rgba(255,255,255,0.6)",
    titleColor: "rgba(255,255,255,0.9)",
    bodyColor: "rgba(255,255,255,0.55)",
    barColor: "rgba(255,255,255,0.2)",
    Icon: Info,
  },
  info: {
    border: "rgba(168,85,247,0.25)",
    bg: "rgba(168,85,247,0.08)",
    glow: "rgba(168,85,247,0.12)",
    iconBg: "rgba(168,85,247,0.18)",
    iconColor: "#c084fc",
    titleColor: "#c084fc",
    bodyColor: "rgba(192,132,252,0.75)",
    barColor: "#a855f7",
    Icon: Info,
  },
  success: {
    border: "rgba(16,185,129,0.25)",
    bg: "rgba(16,185,129,0.07)",
    glow: "rgba(16,185,129,0.10)",
    iconBg: "rgba(16,185,129,0.18)",
    iconColor: "#34d399",
    titleColor: "#34d399",
    bodyColor: "rgba(52,211,153,0.75)",
    barColor: "#10b981",
    Icon: CheckCircle2,
  },
  warning: {
    border: "rgba(245,158,11,0.25)",
    bg: "rgba(245,158,11,0.07)",
    glow: "rgba(245,158,11,0.10)",
    iconBg: "rgba(245,158,11,0.18)",
    iconColor: "#fbbf24",
    titleColor: "#fbbf24",
    bodyColor: "rgba(251,191,36,0.75)",
    barColor: "#f59e0b",
    Icon: AlertTriangle,
  },
  danger: {
    border: "rgba(239,68,68,0.25)",
    bg: "rgba(239,68,68,0.07)",
    glow: "rgba(239,68,68,0.10)",
    iconBg: "rgba(239,68,68,0.18)",
    iconColor: "#f87171",
    titleColor: "#f87171",
    bodyColor: "rgba(248,113,113,0.75)",
    barColor: "#ef4444",
    Icon: ShieldAlert,
  },
};

// ─── Props ────────────────────────────────────────────────────────────────────
export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  title?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  icon?: React.ReactNode;
}

// ─── Component ────────────────────────────────────────────────────────────────
const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  (
    {
      className,
      variant = "secondary",
      title,
      children,
      dismissible = false,
      onDismiss,
      icon,
      style,
      ...props
    },
    ref
  ) => {
    const [visible, setVisible] = React.useState(true);
    const [leaving, setLeaving] = React.useState(false);

    const v = VARIANTS[variant];
    const { Icon } = v;

    const handleDismiss = () => {
      setLeaving(true);
      setTimeout(() => {
        setVisible(false);
        onDismiss?.();
      }, 250);
    };

    if (!visible) return null;

    return (
      <div
        ref={ref}
        role="alert"
        className={cn("relative w-full overflow-hidden rounded-2xl", className)}
        style={{
          border: `1px solid ${v.border}`,
          background: v.bg,
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          boxShadow: `0 0 0 1px ${v.border}, 0 8px 32px -8px ${v.glow}, inset 0 1px 0 rgba(255,255,255,0.05)`,
          opacity: leaving ? 0 : 1,
          transform: leaving ? "translateY(-4px)" : "translateY(0)",
          transition: "opacity 0.25s ease, transform 0.25s ease",
          ...style,
        }}
        {...props}
      >
        {/* Top shimmer line */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{
            background: `linear-gradient(90deg, transparent, ${v.border}, transparent)`,
          }}
        />

        {/* Left glow bar */}
        <div
          className="absolute left-0 top-0 h-full w-[3px] rounded-l-2xl"
          style={{
            background: `linear-gradient(to bottom, ${v.barColor}, ${v.barColor}80)`,
            boxShadow: `2px 0 12px ${v.barColor}60`,
          }}
        />

        {/* Main content */}
        <div className="flex items-start gap-3.5 px-5 py-4">
          {/* Icon badge */}
          <div
            className="shrink-0 mt-0.5 rounded-xl flex items-center justify-center"
            style={{
              width: 36,
              height: 36,
              background: v.iconBg,
              border: `1px solid ${v.border}`,
              boxShadow: `0 0 12px ${v.glow}`,
            }}
          >
            {icon ?? (
              <Icon className="w-4.5 h-4.5" style={{ color: v.iconColor }} strokeWidth={2} />
            )}
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0 py-0.5">
            {title && (
              <p
                className="font-semibold text-sm leading-snug mb-1"
                style={{ color: v.titleColor }}
              >
                {title}
              </p>
            )}
            <div
              className="text-sm leading-relaxed"
              style={{ color: v.bodyColor }}
            >
              {children}
            </div>
          </div>

          {/* Dismiss */}
          {dismissible && (
            <button
              onClick={handleDismiss}
              className="shrink-0 mt-0.5 rounded-lg p-1.5 transition-all"
              style={{ color: v.iconColor + "80" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = v.iconBg;
                (e.currentTarget as HTMLButtonElement).style.color = v.iconColor;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                (e.currentTarget as HTMLButtonElement).style.color = v.iconColor + "80";
              }}
              aria-label="Tutup alert"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }
);
Alert.displayName = "Alert";

export { Alert };
