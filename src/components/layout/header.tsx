"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { SearchDialog } from "./search-dialog";
import { NotificationBell } from "./notifications";

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
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-30 h-13 border-b border-border/50 bg-background/80 backdrop-blur-xl flex items-center px-6 gap-4">
        <div className="w-8 lg:hidden" />

        <h1 className="text-sm font-semibold text-foreground">{title}</h1>

        <button
          onClick={() => setSearchOpen(true)}
          className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/60 bg-card/40 text-muted-foreground hover:bg-card/70 hover:border-border transition-colors max-w-xs w-full sm:w-56 cursor-pointer"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="text-xs">Buscar...</span>
          <kbd className="ml-auto text-[10px] text-muted-foreground/50 bg-muted px-1.5 py-0.5 rounded hidden sm:inline">
            ⌘K
          </kbd>
        </button>

        <NotificationBell />
      </header>

      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
