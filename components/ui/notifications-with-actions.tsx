"use client";

import * as React from "react";
import { Bell, GripVertical, Trash2, Archive, ChevronRight, CheckCheck } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  read?: boolean;
}

interface NotificationsWithActionsProps {
  items?: NotificationItem[];
  placement?: "top" | "right" | "bottom" | "left";
}

const defaultNotifications: NotificationItem[] = [
  {
    id: "1",
    title: "Selamat Datang 🎉",
    description: "Sistem BJA Report siap digunakan. Kelola data trip dan invoice dengan mudah.",
    time: "Baru saja",
    read: false,
  },
  {
    id: "2",
    title: "Sinkronisasi Data",
    description: "Data tersinkronisasi secara realtime dengan Firebase Firestore.",
    time: "1j lalu",
    read: false,
  },
];

export default function NotificationsWithActions({
  items = defaultNotifications,
  placement = "bottom",
}: NotificationsWithActionsProps) {
  const [notifications, setNotifications] =
    React.useState<NotificationItem[]>(items);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [open, setOpen] = React.useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleArchive = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setActiveId(null);
  };

  const handleDelete = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setActiveId(null);
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="relative inline-flex items-center justify-center rounded-full p-2 transition-colors"
          style={{
            color: "rgba(255,255,255,0.6)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.08)";
            (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.95)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "transparent";
            (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.6)";
          }}
          aria-label="Notifikasi"
        >
          <Bell className="h-5 w-5" />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                key="badge"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-0.5 -right-0.5 flex items-center justify-center rounded-full text-white font-bold"
                style={{
                  background: "linear-gradient(135deg, #a855f7, #7c3aed)",
                  fontSize: "10px",
                  minWidth: "18px",
                  height: "18px",
                  padding: "0 4px",
                  boxShadow: "0 0 0 2px #000",
                }}
              >
                {unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </PopoverTrigger>

      <PopoverContent
        className="w-80 p-0 overflow-hidden"
        align="end"
        side={placement}
        sideOffset={8}
        style={{
          background: "rgba(10, 5, 20, 0.95)",
          border: "1px solid rgba(139,92,246,0.25)",
          boxShadow: "0 20px 60px -10px rgba(0,0,0,0.8), 0 0 0 1px rgba(139,92,246,0.1)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b"
          style={{ borderColor: "rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4" style={{ color: "#a855f7" }} />
            <span className="font-semibold text-sm" style={{ color: "rgba(255,255,255,0.9)" }}>
              Notifikasi
            </span>
            {unreadCount > 0 && (
              <span
                className="text-xs px-1.5 py-0.5 rounded-full font-semibold"
                style={{ background: "rgba(168,85,247,0.2)", color: "#c084fc" }}
              >
                {unreadCount} baru
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1 text-xs transition-colors"
              style={{ color: "rgba(255,255,255,0.4)" }}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "#a855f7")}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "rgba(255,255,255,0.4)")}
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Tandai dibaca
            </button>
          )}
        </div>

        {/* Notification list */}
        <div className="max-h-72 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.05)" }}
              >
                <Bell className="w-5 h-5" style={{ color: "rgba(255,255,255,0.2)" }} />
              </div>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>
                Tidak ada notifikasi
              </p>
            </div>
          ) : (
            <ul>
              <AnimatePresence initial={false}>
                {notifications.map((item) => {
                  const isActive = activeId === item.id;
                  return (
                    <motion.li
                      key={item.id}
                      layout
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="relative border-b last:border-0 overflow-hidden"
                      style={{ borderColor: "rgba(255,255,255,0.05)" }}
                    >
                      {/* Unread indicator */}
                      {!item.read && (
                        <div
                          className="absolute left-0 top-0 h-full w-0.5"
                          style={{ background: "linear-gradient(to bottom, #a855f7, #7c3aed)" }}
                        />
                      )}

                      <div
                        className="flex items-center gap-3 px-4 py-3 transition-colors"
                        style={{
                          background: isActive
                            ? "rgba(168,85,247,0.08)"
                            : !item.read
                            ? "rgba(168,85,247,0.04)"
                            : "transparent",
                        }}
                      >
                        {/* Text content */}
                        <motion.div
                          animate={{ x: isActive ? -48 : 0 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                          className="flex-1 min-w-0"
                        >
                          <div className="flex justify-between items-center mb-0.5">
                            <span
                              className="font-medium text-sm truncate"
                              style={{
                                color: item.read
                                  ? "rgba(255,255,255,0.55)"
                                  : "rgba(255,255,255,0.9)",
                              }}
                            >
                              {item.title}
                            </span>
                            <span
                              className="text-xs ml-2 shrink-0"
                              style={{ color: "rgba(255,255,255,0.3)" }}
                            >
                              {item.time}
                            </span>
                          </div>
                          <p
                            className="text-xs leading-relaxed line-clamp-2"
                            style={{ color: "rgba(255,255,255,0.4)" }}
                          >
                            {item.description}
                          </p>
                        </motion.div>

                        {/* Action controls */}
                        <div className="ml-2 flex items-center shrink-0">
                          {isActive ? (
                            <div className="flex items-center gap-1">
                              <button
                                className="p-1.5 rounded-lg transition-colors"
                                style={{ color: "rgba(255,255,255,0.4)" }}
                                onMouseEnter={(e) => {
                                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.08)";
                                  (e.currentTarget as HTMLButtonElement).style.color = "#a855f7";
                                }}
                                onMouseLeave={(e) => {
                                  (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                                  (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.4)";
                                }}
                                onClick={() => handleArchive(item.id)}
                                title="Tandai dibaca"
                              >
                                <Archive className="h-4 w-4" />
                              </button>
                              <button
                                className="p-1.5 rounded-lg transition-colors"
                                style={{ color: "rgba(255,255,255,0.4)" }}
                                onMouseEnter={(e) => {
                                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.1)";
                                  (e.currentTarget as HTMLButtonElement).style.color = "#f87171";
                                }}
                                onMouseLeave={(e) => {
                                  (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                                  (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.4)";
                                }}
                                onClick={() => handleDelete(item.id)}
                                title="Hapus"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                              <button
                                className="p-1.5 rounded-lg transition-colors"
                                style={{ color: "rgba(255,255,255,0.4)" }}
                                onMouseEnter={(e) => {
                                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.08)";
                                  (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.9)";
                                }}
                                onMouseLeave={(e) => {
                                  (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                                  (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.4)";
                                }}
                                onClick={() => setActiveId(null)}
                                title="Tutup"
                              >
                                <ChevronRight className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              className="p-1.5 rounded-lg transition-colors"
                              style={{ color: "rgba(255,255,255,0.2)" }}
                              onMouseEnter={(e) => {
                                (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)";
                                (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.6)";
                              }}
                              onMouseLeave={(e) => {
                                (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                                (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.2)";
                              }}
                              onClick={() => setActiveId(isActive ? null : item.id)}
                              title="Aksi"
                            >
                              <GripVertical className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div
            className="px-4 py-2.5 border-t text-center"
            style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}
          >
            <button
              onClick={() => setNotifications([])}
              className="text-xs transition-colors"
              style={{ color: "rgba(255,255,255,0.3)" }}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "#f87171")}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "rgba(255,255,255,0.3)")}
            >
              Hapus semua notifikasi
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
