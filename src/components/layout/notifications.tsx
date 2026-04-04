"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, CheckCheck, MessageSquare, ClipboardList, AtSign, Milestone } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  entityType?: string | null;
  entityId?: string | null;
  read: boolean;
  createdAt: string;
}

const typeIcons: Record<string, typeof Bell> = {
  task_assigned: ClipboardList,
  mentioned: AtSign,
  comment_added: MessageSquare,
  milestone_approaching: Milestone,
};

export function NotificationBell() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch {
      // Silently fail on network issues
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  async function markAsRead(ids: string[]) {
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      setNotifications((prev) => prev.filter((n) => !ids.includes(n.id)));
      setUnreadCount((prev) => Math.max(0, prev - ids.length));
    } catch {
      // Silently fail
    }
  }

  async function markAllAsRead() {
    const ids = notifications.map((n) => n.id);
    if (ids.length === 0) return;
    await markAsRead(ids);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative flex items-center justify-center w-9 h-9 rounded-full border border-[#d3cfc6]/60 bg-white/40 text-[#535766] hover:bg-white/70 hover:border-[#d3cfc6] transition-colors cursor-pointer"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-[#ff7c11] text-white text-[10px] font-medium px-1">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-[#d3cfc6] rounded-xl shadow-lg z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#d3cfc6]/40">
            <span className="text-xs font-medium text-[#1a1c24]">
              Notificaciones
            </span>
            {notifications.length > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1 text-[10px] text-[#ff7c11] hover:text-[#ff9a3e] transition-colors cursor-pointer"
              >
                <CheckCheck className="w-3 h-3" />
                Marcar todas como leidas
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-8 text-center">
                <Bell className="w-6 h-6 text-[#d3cfc6] mx-auto mb-2" />
                <p className="text-xs text-[#535766]">Sin notificaciones</p>
              </div>
            ) : (
              notifications.map((n) => {
                const Icon = typeIcons[n.type] || Bell;
                return (
                  <button
                    key={n.id}
                    onClick={() => markAsRead([n.id])}
                    className="w-full flex items-start gap-3 px-4 py-3 hover:bg-[#f2f0ea]/60 transition-colors text-left border-b border-[#d3cfc6]/20 last:border-0 cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-[#ff7c11]/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="w-3.5 h-3.5 text-[#ff7c11]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium text-[#1a1c24] truncate">
                        {n.title}
                      </p>
                      <p className="text-[10px] text-[#535766] mt-0.5 line-clamp-2">
                        {n.message}
                      </p>
                      <p className="text-[9px] text-[#535766]/50 mt-1">
                        {formatDistanceToNow(new Date(n.createdAt), {
                          addSuffix: true,
                          locale: es,
                        })}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
