"use client";

import { useState } from "react";
import { Plus, Search, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CreateDecisionDrawer } from "./create-decision-drawer";
import { DecisionDetailDrawer } from "./decision-detail-drawer";
import type {
  Decision,
  User,
  Comment,
  DecisionStatus,
  MeetingNote,
  ResearchEntry,
  Experiment,
  Task,
  Phase,
  Tag,
} from "@/types";

export type DecisionWithRelations = Decision & {
  madeBy: User;
  meetingNote?: MeetingNote | null;
  researchEntry?: (ResearchEntry & { user: User }) | null;
  experiment?: Experiment | null;
  tasks: (Task & { assignee: User | null })[];
  comments: (Comment & { user: User })[];
};

const statusFilters = [
  { value: "ALL", label: "Todas" },
  { value: "PROPOSED", label: "Propuestas" },
  { value: "ACCEPTED", label: "Aceptadas" },
  { value: "REVISITED", label: "Revisadas" },
] as const;

const statusBadge: Record<string, string> = {
  PROPOSED: "bg-amber-50 text-amber-600 border-amber-200/60",
  ACCEPTED: "bg-emerald-50 text-emerald-600 border-emerald-200/60",
  REVISITED: "bg-[#ff7c11]/10 text-[#ff7c11] border-[#ff7c11]/20",
};

const statusLabel: Record<string, string> = {
  PROPOSED: "Propuesta",
  ACCEPTED: "Aceptada",
  REVISITED: "Revisada",
};

export function DecisionLog({
  initialDecisions,
  users,
  meetings,
  researchEntries,
  experiments,
  phases,
  tags,
}: {
  initialDecisions: DecisionWithRelations[];
  users: User[];
  meetings: MeetingNote[];
  researchEntries: (ResearchEntry & { user: User })[];
  experiments: Experiment[];
  phases: Phase[];
  tags: Tag[];
}) {
  const [decisions, setDecisions] = useState(initialDecisions);
  const [statusFilter, setStatusFilter] = useState<"ALL" | DecisionStatus>("ALL");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [selectedDecision, setSelectedDecision] = useState<DecisionWithRelations | null>(null);

  const filtered = decisions.filter((d) => {
    if (statusFilter !== "ALL" && d.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        d.title.toLowerCase().includes(q) ||
        d.decision.toLowerCase().includes(q) ||
        d.rationale.toLowerCase().includes(q)
      );
    }
    return true;
  });

  function handleCreated(decision: DecisionWithRelations) {
    setDecisions((prev) => [decision, ...prev]);
    setShowCreate(false);
  }

  function handleUpdated(updated: DecisionWithRelations) {
    setDecisions((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
    setSelectedDecision(updated);
  }

  function handleDeleted(id: string) {
    setDecisions((prev) => prev.filter((d) => d.id !== id));
    setSelectedDecision(null);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#1a1c24]">Decision Log</h1>
          <p className="text-sm text-[#535766] mt-0.5">
            Registro de decisiones del proyecto
          </p>
        </div>
        <Button
          onClick={() => setShowCreate(true)}
          className="bg-[#ff7c11] hover:bg-[#ff9a3e] text-white rounded-full gap-2"
        >
          <Plus className="w-4 h-4" />
          Nueva decision
        </Button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-1.5 bg-white/60 border border-[#d3cfc6]/40 rounded-lg p-1">
          {statusFilters.map((sf) => (
            <button
              key={sf.value}
              onClick={() => setStatusFilter(sf.value as "ALL" | DecisionStatus)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                statusFilter === sf.value
                  ? "bg-[#ff7c11] text-white"
                  : "text-[#535766] hover:text-[#1a1c24] hover:bg-white/80"
              }`}
            >
              {sf.label}
            </button>
          ))}
        </div>

        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#535766]" />
          <Input
            placeholder="Buscar decisiones..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs bg-white border-[#d3cfc6] text-[#383c48] placeholder:text-[#535766]/50 focus:border-[#ff7c11]"
          />
        </div>
      </div>

      {/* Decision list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Scale className="w-10 h-10 text-[#d3cfc6] mx-auto mb-3" />
          <p className="text-sm text-[#535766]">No hay decisiones registradas</p>
          <p className="text-xs text-[#535766]/60 mt-1">
            Crea una nueva decision para comenzar
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((d) => (
            <button
              key={d.id}
              onClick={() => setSelectedDecision(d)}
              className="w-full text-left bg-white/60 border border-[#d3cfc6]/40 rounded-xl p-4 hover:border-[#ff7c11]/30 hover:bg-white/80 transition-all group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <h3 className="text-sm font-medium text-[#1a1c24] truncate group-hover:text-[#ff7c11] transition-colors">
                      {d.title}
                    </h3>
                    <Badge
                      variant="outline"
                      className={`text-[10px] shrink-0 ${statusBadge[d.status]}`}
                    >
                      {statusLabel[d.status]}
                    </Badge>
                  </div>
                  <p className="text-xs text-[#535766] line-clamp-2 leading-relaxed">
                    {d.rationale}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <Avatar className="w-5 h-5">
                      <AvatarFallback className="bg-[#e9e7df]/80 text-[9px] text-[#535766]">
                        {d.madeBy.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-[10px] text-[#535766]">{d.madeBy.name}</span>
                  </div>
                  <span className="text-[10px] text-[#535766]/60">
                    {format(new Date(d.createdAt), "d MMM yyyy", { locale: es })}
                  </span>
                </div>
              </div>

              {d.comments.length > 0 && (
                <div className="mt-2 flex items-center gap-1 text-[10px] text-[#535766]/60">
                  <span>{d.comments.length} comentario{d.comments.length !== 1 ? "s" : ""}</span>
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Drawers */}
      <CreateDecisionDrawer
        open={showCreate}
        onOpenChange={setShowCreate}
        onCreated={handleCreated}
        meetings={meetings}
        researchEntries={researchEntries}
        experiments={experiments}
      />

      <DecisionDetailDrawer
        decision={selectedDecision}
        onClose={() => setSelectedDecision(null)}
        users={users}
        phases={phases}
        tags={tags}
        onUpdated={handleUpdated}
        onDeleted={handleDeleted}
      />
    </div>
  );
}
