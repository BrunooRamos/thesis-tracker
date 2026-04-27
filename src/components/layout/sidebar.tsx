"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  CheckSquare,
  BookOpen,
  FlaskConical,
  Scale,
  Calendar,
  Users,
  FolderOpen,
  Settings,
  LogOut,
  GanttChart,
  Menu,
  X,
  ListChecks,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { getFileViewUrl } from "@/lib/file-url";
import { ThemeToggle } from "./theme-toggle";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Hitos", href: "/hitos", icon: ListChecks },
  { name: "Tareas", href: "/tasks", icon: CheckSquare },
  { name: "Research", href: "/research", icon: BookOpen },
  { name: "Timeline", href: "/timeline", icon: GanttChart },
  { name: "Experimentos", href: "/experiments", icon: FlaskConical },
  { name: "Decisiones", href: "/decisions", icon: Scale },
  { name: "Reuniones", href: "/meetings", icon: Calendar },
  { name: "Equipo", href: "/team", icon: Users },
  { name: "Recursos", href: "/resources", icon: FolderOpen },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  const userName = session?.user?.name || "?";

  const navContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 flex items-center gap-2.5">
        <svg width="24" height="24" viewBox="0 0 28 28" fill="none" className="shrink-0">
          <rect width="28" height="28" rx="6" fill="#ff7c11"/>
          <path d="M7 9h14M7 13h10M7 17h12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <div>
          <h2 className="text-sm font-semibold text-[#e9e7df] tracking-tight leading-none">
            horizon
          </h2>
          <p className="text-[9px] text-[#535766] tracking-widest mt-0.5">
            THESIS TRACKER
          </p>
        </div>
      </div>

      <div className="mx-4 h-px bg-white/[0.06]" />

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {navigation.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all duration-150 group relative",
                isActive
                  ? "text-white bg-white/[0.08]"
                  : "text-[#7a7d87] hover:text-[#c5c0b6] hover:bg-white/[0.04]"
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-[#ff7c11]" />
              )}
              <item.icon
                className={cn(
                  "w-[15px] h-[15px] shrink-0",
                  isActive ? "text-[#ff7c11]" : "text-[#535766] group-hover:text-[#7a7d87]"
                )}
              />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mx-4 h-px bg-white/[0.06]" />

      {/* Bottom */}
      <div className="px-3 py-3 space-y-1">
        <div className="flex items-center gap-1">
          <Link
            href="/settings"
            className="flex-1 flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-[#7a7d87] hover:text-[#c5c0b6] hover:bg-white/[0.04] transition-all"
          >
            <Settings className="w-[15px] h-[15px]" />
            <span>Settings</span>
          </Link>
          <ThemeToggle />
        </div>

        <div className="flex items-center gap-2.5 px-3 py-2">
          {session?.user?.image ? (
            <img
              src={getFileViewUrl(session.user.image)}
              alt={userName}
              className="w-7 h-7 rounded-full object-cover shrink-0"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#ff7c11] to-[#ff9a3e] flex items-center justify-center text-[10px] text-white font-semibold shrink-0">
              {userName[0]}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-[#c5c0b6] truncate">
              {userName}
            </p>
            <p className="text-[10px] text-[#535766] truncate">
              {session?.user?.email}
            </p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="p-1.5 rounded-md text-[#535766] hover:text-[#ff7c11] hover:bg-[#ff7c11]/10 transition-colors"
            title="Cerrar sesión"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-3 left-3 z-50 lg:hidden p-2 rounded-lg bg-[#1a1c24] text-[#c5c0b6] shadow-md"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-screen w-56 bg-[#1a1c24] border-r border-white/[0.04] transition-transform duration-200 lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {navContent}
      </aside>
    </>
  );
}
