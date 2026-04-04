"use client";

import { useState } from "react";
import {
  Plus,
  Search,
  Filter,
  LayoutGrid,
  List,
  BookOpen,
  Wrench,
  Star,
  FileText,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ResearchCard } from "./research-card";
import { CreateResearchDialog } from "./create-research-dialog";
import { ResearchDetailSheet } from "./research-detail-sheet";
import type { ResearchEntry, User, Comment, Resource, Task, Decision } from "@/types";

export type ResearchEntryWithRelations = ResearchEntry & {
  user: User;
  comments: (Comment & { user: User })[];
  resource?: Resource | null;
  tasks?: (Task & { assignees: User[] })[];
  decisions?: (Decision & { madeBy: User })[];
};

type ViewMode = "feed" | "grid";

export function ResearchHub({
  initialEntries,
  users,
  allTags,
  stats,
}: {
  initialEntries: ResearchEntryWithRelations[];
  users: User[];
  allTags: string[];
  stats: { total: number; papers: number; tools: number; critical: number };
}) {
  const [entries, setEntries] = useState(initialEntries);
  const [viewMode, setViewMode] = useState<ViewMode>("feed");
  const [showCreate, setShowCreate] = useState(false);
  const [selectedEntry, setSelectedEntry] =
    useState<ResearchEntryWithRelations | null>(null);
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    userId: "",
    type: "",
    relevance: "",
    tag: "",
  });

  const filteredEntries = entries.filter((e) => {
    if (
      search &&
      !e.title.toLowerCase().includes(search.toLowerCase()) &&
      !e.summary.toLowerCase().includes(search.toLowerCase()) &&
      !(e.keyFindings || "").toLowerCase().includes(search.toLowerCase())
    )
      return false;
    if (filters.userId && e.userId !== filters.userId) return false;
    if (filters.type && e.type !== filters.type) return false;
    if (filters.relevance && e.relevance !== filters.relevance) return false;
    if (filters.tag && !e.tags.includes(filters.tag)) return false;
    return true;
  });

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="flex gap-3 overflow-x-auto pb-1">
        {[
          {
            label: "Total",
            value: stats.total,
            icon: FileText,
            color: "text-[#535766] bg-[#535766]/10",
          },
          {
            label: "Papers",
            value: stats.papers,
            icon: BookOpen,
            color: "text-[#9a4a00] bg-[#9a4a00]/10",
          },
          {
            label: "Herramientas",
            value: stats.tools,
            icon: Wrench,
            color: "text-violet-400 bg-violet-500/10",
          },
          {
            label: "Críticos",
            value: stats.critical,
            icon: Star,
            color: "text-amber-600 bg-amber-50",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-[#d3cfc6]/40 bg-white/40 shrink-0"
          >
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center ${s.color}`}
            >
              <s.icon className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#1a1c24] font-mono">
                {s.value}
              </p>
              <p className="text-[9px] text-[#535766] uppercase tracking-wider">
                {s.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#535766]" />
          <Input
            placeholder="Buscar en research..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 bg-[#f2f0ea]/60 border-[#d3cfc6] text-[#383c48] placeholder:text-[#535766]/50 text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "h-9 text-xs border-[#d3cfc6] bg-white/40",
              showFilters && "bg-[#e9e7df]/80 border-[#d3cfc6]"
            )}
          >
            <Filter className="w-3.5 h-3.5 mr-1.5" />
            Filtros
            {activeFilterCount > 0 && (
              <Badge
                variant="secondary"
                className="ml-1.5 h-4 px-1.5 text-[10px] bg-[#ff7c11]/15 text-[#ff7c11]"
              >
                {activeFilterCount}
              </Badge>
            )}
          </Button>

          <div className="flex items-center rounded-lg border border-[#d3cfc6] overflow-hidden">
            {[
              { mode: "feed" as const, icon: List },
              { mode: "grid" as const, icon: LayoutGrid },
            ].map(({ mode, icon: Icon }) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  "p-2 transition-colors",
                  viewMode === mode
                    ? "bg-[#e9e7df] text-[#1a1c24]"
                    : "text-[#535766] hover:text-[#535766]"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open("/api/export/research", "_blank")}
            className="h-9 text-xs border-[#d3cfc6] text-[#535766] hover:text-[#1a1c24]"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Exportar CSV
          </Button>

          <Button
            size="sm"
            onClick={() => setShowCreate(true)}
            className="h-9 text-xs bg-[#ff7c11] hover:bg-[#ff9a3e] text-white"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Nuevo entry
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl border border-[#d3cfc6]/50 bg-white/40">
          <Select
            value={filters.userId || "all"}
            onValueChange={(v) =>
              setFilters({ ...filters, userId: v === "all" ? "" : (v ?? "") })
            }
          >
            <SelectTrigger className="w-[130px] h-8 text-xs bg-[#f2f0ea]/60 border-[#d3cfc6]">
              <SelectValue placeholder="Autor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.type || "all"}
            onValueChange={(v) =>
              setFilters({ ...filters, type: v === "all" ? "" : (v ?? "") })
            }
          >
            <SelectTrigger className="w-[130px] h-8 text-xs bg-[#f2f0ea]/60 border-[#d3cfc6]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="PAPER">Paper</SelectItem>
              <SelectItem value="ARTICLE">Artículo</SelectItem>
              <SelectItem value="REPO">Repo</SelectItem>
              <SelectItem value="TOOL">Herramienta</SelectItem>
              <SelectItem value="VIDEO">Video</SelectItem>
              <SelectItem value="OTHER">Otro</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.relevance || "all"}
            onValueChange={(v) =>
              setFilters({ ...filters, relevance: v === "all" ? "" : (v ?? "") })
            }
          >
            <SelectTrigger className="w-[130px] h-8 text-xs bg-[#f2f0ea]/60 border-[#d3cfc6]">
              <SelectValue placeholder="Relevancia" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="CRITICAL">Crítica</SelectItem>
              <SelectItem value="HIGH">Alta</SelectItem>
              <SelectItem value="MEDIUM">Media</SelectItem>
              <SelectItem value="LOW">Baja</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.tag || "all"}
            onValueChange={(v) =>
              setFilters({ ...filters, tag: v === "all" ? "" : (v ?? "") })
            }
          >
            <SelectTrigger className="w-[140px] h-8 text-xs bg-[#f2f0ea]/60 border-[#d3cfc6]">
              <SelectValue placeholder="Tag" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tags</SelectItem>
              {allTags.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setFilters({ userId: "", type: "", relevance: "", tag: "" })
              }
              className="h-8 text-xs text-[#535766] hover:text-[#1a1c24]"
            >
              Limpiar
            </Button>
          )}
        </div>
      )}

      {/* Content */}
      {filteredEntries.length === 0 ? (
        <div className="rounded-xl border border-[#d3cfc6]/50 bg-white/40 p-12 text-center">
          <BookOpen className="w-8 h-8 text-[#535766]/60 mx-auto mb-3" />
          <p className="text-sm text-[#535766]">
            {search || activeFilterCount > 0
              ? "No se encontraron resultados"
              : "Aún no hay entries de research"}
          </p>
          <p className="text-xs text-[#535766] mt-1">
            {!search && activeFilterCount === 0 &&
              "Agregá tu primer paper, artículo o herramienta"}
          </p>
        </div>
      ) : viewMode === "feed" ? (
        <div className="space-y-3">
          {filteredEntries.map((entry) => (
            <ResearchCard
              key={entry.id}
              entry={entry}
              variant="feed"
              onClick={() => setSelectedEntry(entry)}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filteredEntries.map((entry) => (
            <ResearchCard
              key={entry.id}
              entry={entry}
              variant="grid"
              onClick={() => setSelectedEntry(entry)}
            />
          ))}
        </div>
      )}

      <CreateResearchDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        allTags={allTags}
        onCreated={(entry) => {
          setEntries((prev) => [entry, ...prev]);
          setShowCreate(false);
          toast.success("Research entry creado");
        }}
      />

      <ResearchDetailSheet
        entry={selectedEntry}
        onClose={() => setSelectedEntry(null)}
        onUpdated={(updated) => {
          setEntries((prev) =>
            prev.map((e) => (e.id === updated.id ? updated : e))
          );
          setSelectedEntry(updated);
        }}
        onDeleted={(id) => {
          setEntries((prev) => prev.filter((e) => e.id !== id));
          setSelectedEntry(null);
          toast.success("Research entry eliminado");
        }}
      />
    </div>
  );
}
