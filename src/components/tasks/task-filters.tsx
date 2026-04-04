"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import type { User, Phase, Tag } from "@/types";

type Filters = {
  assigneeId: string;
  phaseId: string;
  priority: string;
  tagId: string;
};

export function TaskFilters({
  filters,
  onChange,
  users,
  phases,
  tags,
}: {
  filters: Filters;
  onChange: (f: Filters) => void;
  users: User[];
  phases: Phase[];
  tags: Tag[];
}) {
  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl border border-[#d3cfc6]/50 bg-white/40">
      <Select
        value={filters.assigneeId || "all"}
        onValueChange={(v) =>
          onChange({ ...filters, assigneeId: v === "all" ? "" : (v ?? "") })
        }
      >
        <SelectTrigger className="w-[140px] h-8 text-xs bg-[#f2f0ea]/60 border-[#d3cfc6]">
          <SelectValue placeholder="Persona" />
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
        value={filters.phaseId || "all"}
        onValueChange={(v) =>
          onChange({ ...filters, phaseId: v === "all" ? "" : (v ?? "") })
        }
      >
        <SelectTrigger className="w-[160px] h-8 text-xs bg-[#f2f0ea]/60 border-[#d3cfc6]">
          <SelectValue placeholder="Fase" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas las fases</SelectItem>
          {phases.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              F{p.number}: {p.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.priority || "all"}
        onValueChange={(v) =>
          onChange({ ...filters, priority: v === "all" ? "" : (v ?? "") })
        }
      >
        <SelectTrigger className="w-[130px] h-8 text-xs bg-[#f2f0ea]/60 border-[#d3cfc6]">
          <SelectValue placeholder="Prioridad" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas</SelectItem>
          <SelectItem value="URGENT">Urgente</SelectItem>
          <SelectItem value="HIGH">Alta</SelectItem>
          <SelectItem value="MEDIUM">Media</SelectItem>
          <SelectItem value="LOW">Baja</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.tagId || "all"}
        onValueChange={(v) =>
          onChange({ ...filters, tagId: v === "all" ? "" : (v ?? "") })
        }
      >
        <SelectTrigger className="w-[140px] h-8 text-xs bg-[#f2f0ea]/60 border-[#d3cfc6]">
          <SelectValue placeholder="Tag" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los tags</SelectItem>
          {tags.map((t) => (
            <SelectItem key={t.id} value={t.id}>
              {t.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            onChange({ assigneeId: "", phaseId: "", priority: "", tagId: "" })
          }
          className="h-8 text-xs text-[#535766] hover:text-white"
        >
          <X className="w-3 h-3 mr-1" />
          Limpiar
        </Button>
      )}
    </div>
  );
}
