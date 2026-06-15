"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { X, CheckCircle2, AlertTriangle, Info, AlertCircle } from "lucide-react";

const alertVariants = cva(
  "relative flex w-full items-stretch gap-3 overflow-hidden rounded-xl border p-4 transition-all",
  {
    variants: {
      variant: {
        secondary:
          "border-white/10 bg-white/06 text-white/85",
        success:
          "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
        warning:
          "border-amber-500/25 bg-amber-500/10 text-amber-300",
        danger:
          "border-red-500/25 bg-red-500/10 text-red-300",
        info:
          "border-purple-500/25 bg-purple-500/10 text-purple-300",
      },
    },
    defaultVariants: {
      variant: "secondary",
    },
  }
);

const iconMap = {
  secondary: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: AlertCircle,
  info: Info,
};

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  title?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  icon?: React.ReactNode;
}

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
      ...props
    },
    ref
  ) => {
    const [visible, setVisible] = React.useState(true);

    if (!visible) return null;

    const IconComponent = iconMap[variant ?? "secondary"];

    const handleDismiss = () => {
      setVisible(false);
      onDismiss?.();
    };

    const accentColorMap: Record<string, string> = {
      secondary: "rgba(255,255,255,0.25)",
      success: "#10b981",
      warning: "#f59e0b",
      danger: "#ef4444",
      info: "#a855f7",
    };

    const accentColor = accentColorMap[variant ?? "secondary"];

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(alertVariants({ variant }), className)}
        {...props}
      >
        {/* Left accent bar */}
        <div
          className="absolute left-0 top-0 h-full w-1 rounded-l-xl"
          style={{ background: accentColor }}
        />

        {/* Icon */}
        <div className="pl-2 pt-0.5 shrink-0">
          {icon ?? (
            <IconComponent
              className="w-5 h-5"
              style={{ color: accentColor }}
            />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {title && (
            <p
              className="font-semibold text-sm mb-1"
              style={{ color: accentColor }}
            >
              {title}
            </p>
          )}
          <div className="text-sm leading-relaxed opacity-90">{children}</div>
        </div>

        {/* Dismiss button */}
        {dismissible && (
          <button
            onClick={handleDismiss}
            className="shrink-0 rounded-md p-1 opacity-60 hover:opacity-100 transition-opacity"
            aria-label="Dismiss alert"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }
);
Alert.displayName = "Alert";

export { Alert, alertVariants };
