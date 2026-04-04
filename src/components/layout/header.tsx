"use client";

import { usePathname } from "next/navigation";
import { Search } from "lucide-react";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/tasks": "Tareas",
  "/research": "Research Hub",
  "/experiments": "Experiment Lab",
  "/decisions": "Decision Log",
  "/meetings": "Reuniones",
  "/team": "Equipo",
  "/resources": "Recursos",
  "/settings": "Settings",
  "/timeline": "Timeline",
};

export function Header() {
  const pathname = usePathname();
  const title = pageTitles[pathname] || "Horizon";

  return (
    <header className="sticky top-0 z-30 h-13 border-b border-[#d3cfc6]/50 bg-[#f2f0ea]/80 backdrop-blur-xl flex items-center px-6 gap-4">
      <div className="w-8 lg:hidden" />

      <h1 className="text-sm font-semibold text-[#1a1c24]">{title}</h1>

      {/* Search placeholder */}
      <div className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#d3cfc6]/60 bg-white/40 text-[#535766] cursor-not-allowed max-w-xs w-full sm:w-56">
        <Search className="w-3.5 h-3.5" />
        <span className="text-xs">Buscar...</span>
        <kbd className="ml-auto text-[10px] text-[#535766]/50 bg-[#e9e7df] px-1.5 py-0.5 rounded hidden sm:inline">
          ⌘K
        </kbd>
      </div>
    </header>
  );
}
