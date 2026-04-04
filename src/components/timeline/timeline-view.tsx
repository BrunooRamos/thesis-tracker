"use client";

import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  BookOpen,
  FlaskConical,
  Calendar,
  Scale,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  Phase, Milestone, Task, ResearchEntry, Experiment,
  MeetingNote, Decision, User, PhaseStatus,
} from "@/types";

type PhaseWithMilestones = Phase & { milestones: Milestone[] };
type TaskWithUser = Task & { assignee: User | null };
type ResearchWithUser = ResearchEntry & { user: User };
type ExperimentWithUser = Experiment & { user: User };
type MeetingWithAuthor = MeetingNote & { author: User };
type DecisionWithUser = Decision & { madeBy: User };

interface TimelineViewProps {
  phases: PhaseWithMilestones[];
  tasks: TaskWithUser[];
  research: ResearchWithUser[];
  experiments: ExperimentWithUser[];
  meetings: MeetingWithAuthor[];
  decisions: DecisionWithUser[];
}

const PROJECT_START = new Date("2026-03-01");
const PROJECT_END = new Date("2026-12-31");
const TOTAL_MS = PROJECT_END.getTime() - PROJECT_START.getTime();
const MONTHS = ["Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

function dateToPercent(date: Date): number {
  const clamped = Math.max(PROJECT_START.getTime(), Math.min(PROJECT_END.getTime(), date.getTime()));
  return ((clamped - PROJECT_START.getTime()) / TOTAL_MS) * 100;
}

function getPhaseForDate(date: Date, phases: Phase[]): Phase | null {
  return phases.find(p => date >= new Date(p.startDate) && date <= new Date(p.endDate)) || null;
}

const statusColors: Record<string, string> = {
  TODO: "bg-[#d3cfc6]",
  IN_PROGRESS: "bg-[#ff7c11]",
  IN_REVIEW: "bg-amber-400",
  DONE: "bg-emerald-500",
};

const statusLabels: Record<string, string> = {
  TODO: "To Do",
  IN_PROGRESS: "En progreso",
  IN_REVIEW: "En revisión",
  DONE: "Done",
};

type EntityType = "tasks" | "research" | "experiments" | "meetings" | "decisions";

const entityConfig: Record<EntityType, { icon: typeof CheckSquare; color: string; label: string }> = {
  tasks: { icon: CheckSquare, color: "#ff7c11", label: "Tareas" },
  research: { icon: BookOpen, color: "#9a4a00", label: "Research" },
  experiments: { icon: FlaskConical, color: "#06b6d4", label: "Experimentos" },
  meetings: { icon: Calendar, color: "#ff7c11", label: "Reuniones" },
  decisions: { icon: Scale, color: "#f59e0b", label: "Decisiones" },
};

export function TimelineView({ phases, tasks, research, experiments, meetings, decisions }: TimelineViewProps) {
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set([phases[0]?.id].filter(Boolean)));
  const [activeFilters, setActiveFilters] = useState<Set<EntityType>>(
    new Set(["tasks", "research", "experiments", "meetings", "decisions"])
  );

  const today = new Date();
  const todayPercent = dateToPercent(today);
  const isTodayVisible = today >= PROJECT_START && today <= PROJECT_END;

  // Assign entities to phases
  function getPhaseItems(phaseId: string, phase: Phase) {
    const phaseTasks = tasks.filter(t => t.phaseId === phaseId || (!t.phaseId && getPhaseForDate(new Date(t.createdAt), phases)?.id === phaseId));
    const phaseResearch = research.filter(r => getPhaseForDate(new Date(r.createdAt), phases)?.id === phaseId);
    const phaseExperiments = experiments.filter(e => getPhaseForDate(new Date(e.createdAt), phases)?.id === phaseId);
    const phaseMeetings = meetings.filter(m => getPhaseForDate(new Date(m.date), phases)?.id === phaseId);
    const phaseDecisions = decisions.filter(d => getPhaseForDate(new Date(d.createdAt), phases)?.id === phaseId);
    return { tasks: phaseTasks, research: phaseResearch, experiments: phaseExperiments, meetings: phaseMeetings, decisions: phaseDecisions };
  }

  function togglePhase(id: string) {
    setExpandedPhases(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleFilter(type: EntityType) {
    setActiveFilters(prev => {
      const next = new Set(prev);
      next.has(type) ? next.delete(type) : next.add(type);
      return next;
    });
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-[#1a1c24]">Cronograma</h1>
        <p className="text-sm text-[#535766] mt-1">Línea de tiempo del proyecto — Marzo a Diciembre 2026</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {(Object.entries(entityConfig) as [EntityType, typeof entityConfig.tasks][]).map(([key, cfg]) => {
          const active = activeFilters.has(key);
          return (
            <button
              key={key}
              onClick={() => toggleFilter(key)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                active
                  ? "text-white shadow-sm"
                  : "bg-[#e9e7df] text-[#535766] hover:bg-[#dedad0]"
              )}
              style={active ? { backgroundColor: cfg.color } : undefined}
            >
              <cfg.icon className="w-3 h-3" />
              {cfg.label}
            </button>
          );
        })}
      </div>

      {/* Gantt chart */}
      <div className="rounded-2xl bg-white/60 border border-[#d3cfc6]/40 p-6 overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Month headers */}
          <div className="flex border-b border-[#d3cfc6]/30 pb-2 mb-4">
            {MONTHS.map(m => (
              <div key={m} className="flex-1 text-center text-[10px] uppercase tracking-wider text-[#535766] font-medium">{m}</div>
            ))}
          </div>

          {/* Timeline area */}
          <div className="relative">
            {/* Month stripes */}
            <div className="absolute inset-0 flex pointer-events-none">
              {MONTHS.map((m, i) => (
                <div key={m} className={`flex-1 ${i % 2 === 0 ? "bg-[#f2f0ea]/30" : "bg-white/30"}`} />
              ))}
            </div>

            {/* Today line */}
            {isTodayVisible && (
              <div className="absolute top-0 bottom-0 z-20 pointer-events-none" style={{ left: `${todayPercent}%` }}>
                <div className="border-l-2 border-dashed border-[#ff7c11] h-full" />
                <div className="absolute -top-5 -translate-x-1/2 text-[9px] font-bold text-[#ff7c11] uppercase tracking-wider">Hoy</div>
              </div>
            )}

            {/* Phases */}
            <div className="relative z-10 space-y-1 py-2">
              {phases.map(phase => {
                const startPct = dateToPercent(new Date(phase.startDate));
                const endPct = dateToPercent(new Date(phase.endDate));
                const widthPct = Math.max(endPct - startPct, 1);
                const expanded = expandedPhases.has(phase.id);
                const items = getPhaseItems(phase.id, phase);
                const totalItems = (activeFilters.has("tasks") ? items.tasks.length : 0)
                  + (activeFilters.has("research") ? items.research.length : 0)
                  + (activeFilters.has("experiments") ? items.experiments.length : 0)
                  + (activeFilters.has("meetings") ? items.meetings.length : 0)
                  + (activeFilters.has("decisions") ? items.decisions.length : 0);

                return (
                  <div key={phase.id}>
                    {/* Phase bar */}
                    <div className="relative h-10">
                      <div
                        className={cn(
                          "absolute top-1 h-8 rounded-lg flex items-center px-3 gap-2 shadow-sm cursor-pointer",
                          phase.status === "COMPLETED" ? "bg-emerald-500" :
                          phase.status === "IN_PROGRESS" ? "bg-gradient-to-r from-[#ff7c11] to-[#ff9a3e]" :
                          "bg-[#dedad0]"
                        )}
                        style={{ left: `${startPct}%`, width: `${widthPct}%` }}
                        onClick={() => togglePhase(phase.id)}
                      >
                        <span className={cn("text-xs font-semibold whitespace-nowrap", phase.status === "NOT_STARTED" ? "text-[#535766]" : "text-white")}>
                          {phase.number}. {phase.name}
                        </span>
                      </div>
                    </div>

                    {/* Milestones */}
                    {phase.milestones.length > 0 && (
                      <div className="relative h-8">
                        {phase.milestones.map(m => {
                          const mPct = dateToPercent(new Date(m.dueDate));
                          return (
                            <div key={m.id} className="absolute top-1 -translate-x-1/2 group" style={{ left: `${mPct}%` }}>
                              <div className={cn("w-3 h-3 rotate-45 border-2", m.isFaculty ? "bg-[#ff7c11] border-[#ff7c11]" : "bg-transparent border-[#535766]")} />
                              <span className="text-[8px] text-[#535766] absolute top-4 left-1/2 -translate-x-1/2 whitespace-nowrap">{m.code}</span>
                              {/* Tooltip */}
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-30">
                                <div className="bg-[#1a1c24] text-white text-[10px] rounded-lg px-2.5 py-1.5 whitespace-nowrap shadow-lg">
                                  <p className="font-medium">{m.name}</p>
                                  <p className="text-white/60">{format(new Date(m.dueDate), "d MMM yyyy", { locale: es })}</p>
                                  {m.isFaculty && <p className="text-[#ff9a3e]">Hito facultad</p>}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Expand toggle */}
                    <button
                      onClick={() => togglePhase(phase.id)}
                      className="flex items-center gap-1 ml-1 mb-1 text-[10px] text-[#535766] hover:text-[#ff7c11] transition-colors"
                    >
                      {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                      {totalItems} items
                    </button>

                    {/* Expanded items — as readable rows, not dots */}
                    {expanded && (
                      <div className="ml-1 mb-3 space-y-1 border-l-2 border-[#e9e7df] pl-3">
                        {/* Tasks */}
                        {activeFilters.has("tasks") && items.tasks.length > 0 && (
                          <ItemGroup label="Tareas" count={items.tasks.length} color="#ff7c11" icon={CheckSquare}>
                            {items.tasks.map(t => (
                              <div key={t.id} className="flex items-center gap-2 py-1 px-2 rounded-lg hover:bg-[#e9e7df]/40 transition-colors">
                                <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", statusColors[t.status])} />
                                <span className="text-[11px] text-[#1a1c24] truncate flex-1">{t.title}</span>
                                {t.assignee && <span className="text-[9px] text-[#535766] shrink-0">{t.assignee.name}</span>}
                                <span className="text-[9px] text-[#535766]/50 shrink-0 font-mono">
                                  {t.dueDate ? format(new Date(t.dueDate), "dd/MM") : format(new Date(t.createdAt), "dd/MM")}
                                </span>
                              </div>
                            ))}
                          </ItemGroup>
                        )}

                        {/* Research */}
                        {activeFilters.has("research") && items.research.length > 0 && (
                          <ItemGroup label="Research" count={items.research.length} color="#9a4a00" icon={BookOpen}>
                            {items.research.map(r => (
                              <div key={r.id} className="flex items-center gap-2 py-1 px-2 rounded-lg hover:bg-[#e9e7df]/40 transition-colors">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#9a4a00] shrink-0" />
                                <span className="text-[11px] text-[#1a1c24] truncate flex-1">{r.title}</span>
                                <span className="text-[9px] text-[#535766] shrink-0">{r.user.name}</span>
                                <span className="text-[9px] text-[#535766]/50 shrink-0 font-mono">{format(new Date(r.createdAt), "dd/MM")}</span>
                              </div>
                            ))}
                          </ItemGroup>
                        )}

                        {/* Experiments */}
                        {activeFilters.has("experiments") && items.experiments.length > 0 && (
                          <ItemGroup label="Experimentos" count={items.experiments.length} color="#06b6d4" icon={FlaskConical}>
                            {items.experiments.map(e => (
                              <div key={e.id} className="flex items-center gap-2 py-1 px-2 rounded-lg hover:bg-[#e9e7df]/40 transition-colors">
                                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 shrink-0" />
                                <span className="text-[11px] text-[#1a1c24] truncate flex-1">{e.name}</span>
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-50 text-cyan-600 shrink-0">{e.architecture}</span>
                                <span className="text-[9px] text-[#535766]/50 shrink-0 font-mono">{format(new Date(e.createdAt), "dd/MM")}</span>
                              </div>
                            ))}
                          </ItemGroup>
                        )}

                        {/* Meetings */}
                        {activeFilters.has("meetings") && items.meetings.length > 0 && (
                          <ItemGroup label="Reuniones" count={items.meetings.length} color="#ff7c11" icon={Calendar}>
                            {items.meetings.map(m => (
                              <div key={m.id} className="flex items-center gap-2 py-1 px-2 rounded-lg hover:bg-[#e9e7df]/40 transition-colors">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#ff7c11] shrink-0" />
                                <span className="text-[11px] text-[#1a1c24] truncate flex-1">{m.title}</span>
                                <span className="text-[9px] text-[#535766] shrink-0">{m.author.name}</span>
                                <span className="text-[9px] text-[#535766]/50 shrink-0 font-mono">{format(new Date(m.date), "dd/MM")}</span>
                              </div>
                            ))}
                          </ItemGroup>
                        )}

                        {/* Decisions */}
                        {activeFilters.has("decisions") && items.decisions.length > 0 && (
                          <ItemGroup label="Decisiones" count={items.decisions.length} color="#f59e0b" icon={Scale}>
                            {items.decisions.map(d => (
                              <div key={d.id} className="flex items-center gap-2 py-1 px-2 rounded-lg hover:bg-[#e9e7df]/40 transition-colors">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                                <span className="text-[11px] text-[#1a1c24] truncate flex-1">{d.title}</span>
                                <span className={cn("text-[9px] px-1.5 py-0.5 rounded shrink-0",
                                  d.status === "ACCEPTED" ? "bg-emerald-50 text-emerald-600" :
                                  d.status === "REVISITED" ? "bg-orange-50 text-orange-600" :
                                  "bg-amber-50 text-amber-600"
                                )}>{d.status === "PROPOSED" ? "Propuesta" : d.status === "ACCEPTED" ? "Aceptada" : "Revisada"}</span>
                                <span className="text-[9px] text-[#535766]/50 shrink-0 font-mono">{format(new Date(d.createdAt), "dd/MM")}</span>
                              </div>
                            ))}
                          </ItemGroup>
                        )}

                        {totalItems === 0 && (
                          <p className="text-[10px] text-[#535766]/50 italic py-2">Sin items en esta fase</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 mt-4 pt-3 border-t border-[#d3cfc6]/30">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-2 rounded-sm bg-gradient-to-r from-[#ff7c11] to-[#ff9a3e]" />
              <span className="text-[9px] text-[#535766]">En progreso</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-2 rounded-sm bg-emerald-500" />
              <span className="text-[9px] text-[#535766]">Completada</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-2 rounded-sm bg-[#dedad0]" />
              <span className="text-[9px] text-[#535766]">No iniciada</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rotate-45 bg-[#ff7c11]" />
              <span className="text-[9px] text-[#535766]">Hito facultad</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rotate-45 border-[1.5px] border-[#535766]" />
              <span className="text-[9px] text-[#535766]">Hito interno</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ItemGroup({ label, count, color, icon: Icon, children }: {
  label: string;
  count: number;
  color: string;
  icon: typeof CheckSquare;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-0.5">
        <Icon className="w-3 h-3" style={{ color }} />
        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color }}>{label}</span>
        <span className="text-[9px] text-[#535766] bg-[#e9e7df] px-1.5 py-0.5 rounded font-mono">{count}</span>
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}
