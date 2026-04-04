"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Filter,
  LayoutGrid,
  Table2,
  Plus,
  FlaskConical,
  Activity,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowUpDown,
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { CreateExperimentDrawer } from "./create-experiment-drawer";
import { ExperimentDetailDrawer } from "./experiment-detail-drawer";
import type { Experiment, User, Comment, Decision } from "@/types";

export type ExperimentWithRelations = Experiment & {
  user: User;
  comments: (Comment & { user: User })[];
  childExperiments: Experiment[];
  parentExperiment: Experiment | null;
  decisions?: (Decision & { madeBy: User })[];
};

type ViewMode = "cards" | "table";
type SortField = "name" | "architecture" | "status" | "exhaustivity" | "precision" | "latency" | "cost" | "tokenCount";
type SortDir = "asc" | "desc";

const STATUS_STYLES: Record<string, string> = {
  PLANNED: "bg-[#e9e7df] text-[#535766]",
  RUNNING: "bg-[#ff7c11]/10 text-[#ff7c11]",
  COMPLETED: "bg-emerald-50 text-emerald-600",
  FAILED: "bg-red-50 text-red-500",
};

const STATUS_LABELS: Record<string, string> = {
  PLANNED: "Planned",
  RUNNING: "Running",
  COMPLETED: "Completed",
  FAILED: "Failed",
};

const ARCHITECTURE_COLORS: Record<string, string> = {
  RLM: "bg-violet-100 text-violet-700",
  "Deep Agent": "bg-blue-100 text-blue-700",
  ReAct: "bg-amber-100 text-amber-700",
  RAG: "bg-emerald-100 text-emerald-700",
  CoT: "bg-rose-100 text-rose-700",
  Custom: "bg-zinc-100 text-zinc-600",
};

const ARCHITECTURES = ["RLM", "Deep Agent", "ReAct", "RAG", "CoT", "Custom"];

export function ExperimentLab({
  initialExperiments,
  users,
}: {
  initialExperiments: ExperimentWithRelations[];
  users: User[];
}) {
  const [experiments, setExperiments] = useState(initialExperiments);
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [showCreate, setShowCreate] = useState(false);
  const [selectedExperiment, setSelectedExperiment] = useState<ExperimentWithRelations | null>(null);
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterArchitecture, setFilterArchitecture] = useState("");
  const [filterUser, setFilterUser] = useState("");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const filtered = useMemo(() => {
    return experiments.filter((e) => {
      if (search && !e.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterStatus && e.status !== filterStatus) return false;
      if (filterArchitecture && e.architecture !== filterArchitecture) return false;
      if (filterUser && e.userId !== filterUser) return false;
      return true;
    });
  }, [experiments, search, filterStatus, filterArchitecture, filterUser]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let aVal: string | number | null = null;
      let bVal: string | number | null = null;

      switch (sortField) {
        case "name": aVal = a.name.toLowerCase(); bVal = b.name.toLowerCase(); break;
        case "architecture": aVal = a.architecture; bVal = b.architecture; break;
        case "status": aVal = a.status; bVal = b.status; break;
        case "exhaustivity": aVal = a.exhaustivity; bVal = b.exhaustivity; break;
        case "precision": aVal = a.precision; bVal = b.precision; break;
        case "latency": aVal = a.latency; bVal = b.latency; break;
        case "cost": aVal = a.cost; bVal = b.cost; break;
        case "tokenCount": aVal = a.tokenCount; bVal = b.tokenCount; break;
      }

      if (aVal === null && bVal === null) return 0;
      if (aVal === null) return 1;
      if (bVal === null) return -1;
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [filtered, sortField, sortDir]);

  const activeFilterCount = [filterStatus, filterArchitecture, filterUser].filter(Boolean).length;

  const stats = useMemo(() => ({
    total: experiments.length,
    planned: experiments.filter((e) => e.status === "PLANNED").length,
    running: experiments.filter((e) => e.status === "RUNNING").length,
    completed: experiments.filter((e) => e.status === "COMPLETED").length,
  }), [experiments]);

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  return (
    <div className="space-y-5">
      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total", value: stats.total, icon: FlaskConical, color: "text-[#1a1c24]", bg: "bg-white/60" },
          { label: "Planned", value: stats.planned, icon: Clock, color: "text-[#535766]", bg: "bg-white/60" },
          { label: "Running", value: stats.running, icon: Activity, color: "text-[#ff7c11]", bg: "bg-[#ff7c11]/5" },
          { label: "Completed", value: stats.completed, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50/50" },
        ].map((s) => (
          <div
            key={s.label}
            className={cn(
              "rounded-xl border border-[#d3cfc6]/40 px-4 py-3 flex items-center gap-3",
              s.bg
            )}
          >
            <s.icon className={cn("w-4 h-4", s.color)} />
            <div>
              <p className="text-lg font-semibold text-[#1a1c24] leading-none">{s.value}</p>
              <p className="text-[10px] text-[#535766] mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#535766]" />
          <Input
            placeholder="Buscar experimentos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 bg-[#f2f0ea]/60 border-[#d3cfc6] text-[#1a1c24] placeholder:text-[#535766]/50 text-xs"
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

          {/* View toggle */}
          <div className="flex items-center rounded-lg border border-[#d3cfc6] overflow-hidden">
            {[
              { mode: "cards" as const, icon: LayoutGrid, label: "Cards" },
              { mode: "table" as const, icon: Table2, label: "Comparativa" },
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
            size="sm"
            onClick={() => setShowCreate(true)}
            className="h-9 text-xs bg-[#ff7c11] hover:bg-[#ff9a3e] text-white rounded-full"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Nuevo experimento
          </Button>
        </div>
      </div>

      {/* Filters row */}
      {showFilters && (
        <div className="flex flex-wrap gap-3 px-4 py-3 rounded-xl border border-[#d3cfc6]/40 bg-white/40">
          <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v === "all" ? "" : (v ?? ""))}>
            <SelectTrigger className="h-8 w-36 text-xs bg-white border-[#d3cfc6]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="PLANNED">Planned</SelectItem>
              <SelectItem value="RUNNING">Running</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterArchitecture} onValueChange={(v) => setFilterArchitecture(v === "all" ? "" : (v ?? ""))}>
            <SelectTrigger className="h-8 w-40 text-xs bg-white border-[#d3cfc6]">
              <SelectValue placeholder="Arquitectura" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {ARCHITECTURES.map((a) => (
                <SelectItem key={a} value={a}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterUser} onValueChange={(v) => setFilterUser(v === "all" ? "" : (v ?? ""))}>
            <SelectTrigger className="h-8 w-40 text-xs bg-white border-[#d3cfc6]">
              <SelectValue placeholder="Usuario" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-[10px] text-[#535766]"
              onClick={() => {
                setFilterStatus("");
                setFilterArchitecture("");
                setFilterUser("");
              }}
            >
              Limpiar filtros
            </Button>
          )}
        </div>
      )}

      {/* Content */}
      {viewMode === "cards" ? (
        <CardsView experiments={sorted} onSelect={setSelectedExperiment} />
      ) : (
        <ComparisonTable
          experiments={sorted}
          onSelect={setSelectedExperiment}
          sortField={sortField}
          sortDir={sortDir}
          onToggleSort={toggleSort}
        />
      )}

      {/* Empty state */}
      {sorted.length === 0 && (
        <div className="text-center py-16">
          <FlaskConical className="w-8 h-8 text-[#d3cfc6] mx-auto mb-3" />
          <p className="text-sm text-[#535766]">No se encontraron experimentos</p>
          <p className="text-xs text-[#535766]/60 mt-1">Crea uno nuevo o ajusta los filtros</p>
        </div>
      )}

      {/* Drawers */}
      <CreateExperimentDrawer
        open={showCreate}
        onOpenChange={setShowCreate}
        onCreated={(exp) => {
          setExperiments((prev) => [exp, ...prev]);
          setShowCreate(false);
        }}
      />

      <ExperimentDetailDrawer
        experiment={selectedExperiment}
        onClose={() => setSelectedExperiment(null)}
        users={users}
        onUpdated={(updated) => {
          setExperiments((prev) =>
            prev.map((e) => (e.id === updated.id ? updated : e))
          );
          setSelectedExperiment(updated);
        }}
        onDeleted={(id) => {
          setExperiments((prev) => prev.filter((e) => e.id !== id));
          setSelectedExperiment(null);
        }}
      />
    </div>
  );
}

/* ─── Cards View ─── */

function CardsView({
  experiments,
  onSelect,
}: {
  experiments: ExperimentWithRelations[];
  onSelect: (e: ExperimentWithRelations) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {experiments.map((exp) => (
        <div
          key={exp.id}
          onClick={() => onSelect(exp)}
          className="rounded-xl border border-[#d3cfc6]/40 bg-white/60 p-4 hover:bg-white/80 transition-colors cursor-pointer space-y-3"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-[#1a1c24] truncate">{exp.name}</h3>
              {exp.hypothesis && (
                <p className="text-[11px] text-[#535766] mt-1 line-clamp-2 leading-relaxed">
                  {exp.hypothesis}
                </p>
              )}
            </div>
            <span className="text-[10px] font-mono text-[#535766] bg-[#e9e7df]/60 px-1.5 py-0.5 rounded shrink-0">
              v{exp.iteration}
            </span>
          </div>

          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-medium", STATUS_STYLES[exp.status])}>
              {STATUS_LABELS[exp.status]}
            </span>
            <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-medium", ARCHITECTURE_COLORS[exp.architecture] || ARCHITECTURE_COLORS["Custom"])}>
              {exp.architecture}
            </span>
          </div>

          {/* Metrics (only if completed/has data) */}
          {(exp.exhaustivity !== null || exp.precision !== null || exp.latency !== null) && (
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#d3cfc6]/30">
              {exp.exhaustivity !== null && (
                <div>
                  <p className="text-[9px] text-[#535766] uppercase">Exh.</p>
                  <p className="text-xs font-medium text-[#1a1c24]">{(exp.exhaustivity * 100).toFixed(1)}%</p>
                </div>
              )}
              {exp.precision !== null && (
                <div>
                  <p className="text-[9px] text-[#535766] uppercase">Prec.</p>
                  <p className="text-xs font-medium text-[#1a1c24]">{(exp.precision * 100).toFixed(1)}%</p>
                </div>
              )}
              {exp.latency !== null && (
                <div>
                  <p className="text-[9px] text-[#535766] uppercase">Lat.</p>
                  <p className="text-xs font-medium text-[#1a1c24]">{exp.latency.toFixed(2)}s</p>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-1">
            <Avatar className="w-5 h-5">
              <AvatarFallback className="bg-[#e9e7df]/80 text-[9px] text-[#535766]">
                {exp.user.name[0]}
              </AvatarFallback>
            </Avatar>
            {exp.childExperiments.length > 0 && (
              <span className="text-[10px] text-[#535766]">
                {exp.childExperiments.length} iteraci{exp.childExperiments.length === 1 ? "on" : "ones"}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Comparison Table View ─── */

function ComparisonTable({
  experiments,
  onSelect,
  sortField,
  sortDir,
  onToggleSort,
}: {
  experiments: ExperimentWithRelations[];
  onSelect: (e: ExperimentWithRelations) => void;
  sortField: SortField;
  sortDir: SortDir;
  onToggleSort: (field: SortField) => void;
}) {
  const columns: { key: SortField; label: string; className?: string }[] = [
    { key: "name", label: "Nombre" },
    { key: "architecture", label: "Arquitectura" },
    { key: "status", label: "Estado" },
    { key: "exhaustivity", label: "Exhaustividad", className: "hidden lg:table-cell" },
    { key: "precision", label: "Precision", className: "hidden lg:table-cell" },
    { key: "latency", label: "Latencia", className: "hidden xl:table-cell" },
    { key: "cost", label: "Costo", className: "hidden xl:table-cell" },
    { key: "tokenCount", label: "Tokens", className: "hidden xl:table-cell" },
  ];

  return (
    <div className="rounded-xl border border-[#d3cfc6]/50 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#d3cfc6]/50 bg-white/40">
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => onToggleSort(col.key)}
                  className={cn(
                    "text-left px-4 py-3 text-[#535766] uppercase tracking-wider font-medium cursor-pointer hover:text-[#1a1c24] select-none",
                    col.className
                  )}
                >
                  <span className="flex items-center gap-1">
                    {col.label}
                    {sortField === col.key && (
                      <ArrowUpDown className="w-3 h-3 text-[#ff7c11]" />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {experiments.map((exp) => (
              <tr
                key={exp.id}
                onClick={() => onSelect(exp)}
                className="border-b border-[#d3cfc6]/40 hover:bg-white/40 cursor-pointer transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[#383c48] truncate max-w-[200px]">{exp.name}</span>
                    <span className="text-[10px] font-mono text-[#535766]">v{exp.iteration}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-medium", ARCHITECTURE_COLORS[exp.architecture] || ARCHITECTURE_COLORS["Custom"])}>
                    {exp.architecture}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-medium", STATUS_STYLES[exp.status])}>
                    {STATUS_LABELS[exp.status]}
                  </span>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell text-[#535766]">
                  {exp.exhaustivity !== null ? `${(exp.exhaustivity * 100).toFixed(1)}%` : "---"}
                </td>
                <td className="px-4 py-3 hidden lg:table-cell text-[#535766]">
                  {exp.precision !== null ? `${(exp.precision * 100).toFixed(1)}%` : "---"}
                </td>
                <td className="px-4 py-3 hidden xl:table-cell text-[#535766]">
                  {exp.latency !== null ? `${exp.latency.toFixed(2)}s` : "---"}
                </td>
                <td className="px-4 py-3 hidden xl:table-cell text-[#535766]">
                  {exp.cost !== null ? `$${exp.cost.toFixed(3)}` : "---"}
                </td>
                <td className="px-4 py-3 hidden xl:table-cell text-[#535766]">
                  {exp.tokenCount !== null ? exp.tokenCount.toLocaleString() : "---"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
