"use client";

import { useState } from "react";
import {
  BookOpen,
  FlaskConical,
  Calendar,
  Scale,
  CheckSquare,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import type {
  Phase,
  Milestone,
  Task,
  ResearchEntry,
  Experiment,
  MeetingNote,
  Decision,
  User,
  PhaseStatus,
  TaskStatus,
} from "@/types";

/* ------------------------------------------------------------------ */
/*  Composite types (serialized from server)                          */
/* ------------------------------------------------------------------ */

type PhaseWithMilestones = Phase & { milestones: Milestone[] };
type TaskWithRelations = Task & { assignee: User | null; phase: Phase | null };
type ResearchWithUser = ResearchEntry & { user: User };
type ExperimentWithUser = Experiment & { user: User };
type MeetingWithAuthor = MeetingNote & { author: User };
type DecisionWithUser = Decision & { madeBy: User };

interface TimelineViewProps {
  phases: PhaseWithMilestones[];
  tasks: TaskWithRelations[];
  research: ResearchWithUser[];
  experiments: ExperimentWithUser[];
  meetings: MeetingWithAuthor[];
  decisions: DecisionWithUser[];
}

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */

const PROJECT_START = new Date("2026-03-01");
const PROJECT_END = new Date("2026-12-31");
const TOTAL_MS = PROJECT_END.getTime() - PROJECT_START.getTime();

const MONTHS = [
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

type EntityType = "tasks" | "research" | "experiments" | "meetings" | "decisions";

const ENTITY_CONFIG: Record<
  EntityType,
  { label: string; color: string; icon: typeof BookOpen }
> = {
  tasks: { label: "Tareas", color: "#535766", icon: CheckSquare },
  research: { label: "Research", color: "#9a4a00", icon: BookOpen },
  experiments: { label: "Experimentos", color: "#06b6d4", icon: FlaskConical },
  meetings: { label: "Reuniones", color: "#ff7c11", icon: Calendar },
  decisions: { label: "Decisiones", color: "#f59e0b", icon: Scale },
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function dateToPercent(date: Date): number {
  const clamped = Math.max(
    PROJECT_START.getTime(),
    Math.min(PROJECT_END.getTime(), date.getTime())
  );
  return ((clamped - PROJECT_START.getTime()) / TOTAL_MS) * 100;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getPhaseBarClasses(status: PhaseStatus): string {
  switch (status) {
    case "IN_PROGRESS":
      return "bg-gradient-to-r from-[#ff7c11] to-[#ff9a3e]";
    case "COMPLETED":
      return "bg-emerald-500";
    case "NOT_STARTED":
    default:
      return "bg-[#dedad0]";
  }
}

function getPhaseForDate(
  date: Date,
  phases: PhaseWithMilestones[]
): PhaseWithMilestones | null {
  return (
    phases.find(
      (p) => date >= new Date(p.startDate) && date <= new Date(p.endDate)
    ) || null
  );
}

function getTaskStatusColor(status: TaskStatus): string {
  switch (status) {
    case "TODO":
      return "#d3cfc6";
    case "IN_PROGRESS":
      return "#ff7c11";
    case "IN_REVIEW":
      return "#f59e0b";
    case "DONE":
      return "#10b981";
    default:
      return "#d3cfc6";
  }
}

/* ------------------------------------------------------------------ */
/*  Entity dot component                                              */
/* ------------------------------------------------------------------ */

interface EntityDotProps {
  percent: number;
  color: string;
  tooltip: React.ReactNode;
}

function EntityDot({ percent, color, tooltip }: EntityDotProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="absolute top-1/2 -translate-y-1/2 -translate-x-1 cursor-pointer"
      style={{ left: `${percent}%` }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      {hovered && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-30 pointer-events-none">
          <div className="bg-[#1a1c24] text-white text-[11px] rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
            {tooltip}
          </div>
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-2 h-2 rotate-45 bg-[#1a1c24]" />
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Entity row component                                              */
/* ------------------------------------------------------------------ */

interface EntityRowProps {
  icon: typeof BookOpen;
  label: string;
  count: number;
  color: string;
  children: React.ReactNode;
}

function EntityRow({ icon: Icon, label, count, color, children }: EntityRowProps) {
  return (
    <div className="relative h-6 flex items-center">
      {/* Label */}
      <div
        className="absolute left-0 flex items-center gap-1 z-10 pr-2"
        style={{ color }}
      >
        <Icon size={10} />
        <span className="text-[9px] font-medium whitespace-nowrap">
          {label} ({count})
        </span>
      </div>
      {/* Dots area */}
      <div className="absolute inset-0">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                    */
/* ------------------------------------------------------------------ */

export function TimelineView({
  phases,
  tasks,
  research,
  experiments,
  meetings,
  decisions,
}: TimelineViewProps) {
  const [hoveredMilestone, setHoveredMilestone] = useState<string | null>(null);
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());
  const [activeFilters, setActiveFilters] = useState<Set<EntityType>>(
    new Set(["tasks", "research", "experiments", "meetings", "decisions"])
  );

  const today = new Date();
  const todayPercent = dateToPercent(today);
  const isTodayVisible = today >= PROJECT_START && today <= PROJECT_END;

  /* ---- Assign entities to phases ---- */

  function getEntitiesForPhase(phase: PhaseWithMilestones) {
    const phaseTasks = tasks.filter((t) => {
      if (t.phaseId) return t.phaseId === phase.id;
      const matchedPhase = getPhaseForDate(new Date(t.createdAt), phases);
      return matchedPhase?.id === phase.id;
    });

    const phaseResearch = research.filter(
      (r) => getPhaseForDate(new Date(r.createdAt), phases)?.id === phase.id
    );

    const phaseExperiments = experiments.filter(
      (e) => getPhaseForDate(new Date(e.createdAt), phases)?.id === phase.id
    );

    const phaseMeetings = meetings.filter(
      (m) => getPhaseForDate(new Date(m.date), phases)?.id === phase.id
    );

    const phaseDecisions = decisions.filter(
      (d) => getPhaseForDate(new Date(d.createdAt), phases)?.id === phase.id
    );

    return {
      tasks: phaseTasks,
      research: phaseResearch,
      experiments: phaseExperiments,
      meetings: phaseMeetings,
      decisions: phaseDecisions,
    };
  }

  function togglePhase(phaseId: string) {
    setExpandedPhases((prev) => {
      const next = new Set(prev);
      if (next.has(phaseId)) next.delete(phaseId);
      else next.add(phaseId);
      return next;
    });
  }

  function toggleFilter(type: EntityType) {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[#1a1c24]">Cronograma</h1>
        <p className="text-sm text-[#535766] mt-1">
          Vista de la linea de tiempo del proyecto — Marzo a Diciembre 2026
        </p>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        {(Object.entries(ENTITY_CONFIG) as [EntityType, (typeof ENTITY_CONFIG)[EntityType]][]).map(
          ([type, config]) => {
            const isActive = activeFilters.has(type);
            return (
              <button
                key={type}
                onClick={() => toggleFilter(type)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium transition-colors"
                style={
                  isActive
                    ? {
                        backgroundColor: `${config.color}15`,
                        color: config.color,
                      }
                    : {
                        backgroundColor: "#e9e7df",
                        color: "#535766",
                      }
                }
              >
                <config.icon size={12} />
                {config.label}
              </button>
            );
          }
        )}
      </div>

      {/* Timeline container */}
      <div className="rounded-2xl bg-white/60 border border-[#d3cfc6]/40 p-6 overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Month headers */}
          <div className="flex border-b border-[#d3cfc6]/40 pb-2 mb-4">
            {MONTHS.map((month) => (
              <div
                key={month}
                className="flex-1 text-center text-[10px] uppercase tracking-wider text-[#535766] font-medium"
              >
                {month}
              </div>
            ))}
          </div>

          {/* Timeline grid area */}
          <div className="relative">
            {/* Month column background stripes */}
            <div className="absolute inset-0 flex pointer-events-none">
              {MONTHS.map((month, i) => (
                <div
                  key={month}
                  className={`flex-1 ${
                    i % 2 === 0 ? "bg-white/20" : "bg-white/40"
                  }`}
                />
              ))}
            </div>

            {/* Today indicator */}
            {isTodayVisible && (
              <div
                className="absolute top-0 bottom-0 z-20 pointer-events-none"
                style={{ left: `${todayPercent}%` }}
              >
                <div className="border-l-2 border-dashed border-[#ff7c11] h-full" />
                <div className="absolute -top-5 -translate-x-1/2 text-[9px] font-semibold text-[#ff7c11] uppercase tracking-wider">
                  Hoy
                </div>
              </div>
            )}

            {/* Phase rows */}
            <div className="relative z-10 space-y-3 py-2">
              {phases.map((phase) => {
                const startPct = dateToPercent(new Date(phase.startDate));
                const endPct = dateToPercent(new Date(phase.endDate));
                const widthPct = Math.max(endPct - startPct, 1);
                const isExpanded = expandedPhases.has(phase.id);
                const phaseEntities = getEntitiesForPhase(phase);

                const totalCount =
                  phaseEntities.tasks.length +
                  phaseEntities.research.length +
                  phaseEntities.experiments.length +
                  phaseEntities.meetings.length +
                  phaseEntities.decisions.length;

                return (
                  <div key={phase.id}>
                    {/* Phase bar row */}
                    <div className="relative h-10">
                      <div
                        className={`absolute top-1 h-8 rounded-lg flex items-center px-3 gap-2 shadow-sm ${getPhaseBarClasses(
                          phase.status as PhaseStatus
                        )}`}
                        style={{
                          left: `${startPct}%`,
                          width: `${widthPct}%`,
                        }}
                      >
                        <span
                          className={`text-xs font-semibold whitespace-nowrap ${
                            phase.status === "NOT_STARTED"
                              ? "text-[#535766]"
                              : "text-white"
                          }`}
                        >
                          {phase.number}. {phase.name}
                        </span>
                      </div>
                    </div>

                    {/* Milestones row for this phase */}
                    {phase.milestones.length > 0 && (
                      <div className="relative h-7">
                        {phase.milestones.map((milestone) => {
                          const mPct = dateToPercent(
                            new Date(milestone.dueDate)
                          );
                          const isHovered = hoveredMilestone === milestone.id;

                          return (
                            <div
                              key={milestone.id}
                              className="absolute top-1 -translate-x-1.5 cursor-pointer"
                              style={{ left: `${mPct}%` }}
                              onMouseEnter={() =>
                                setHoveredMilestone(milestone.id)
                              }
                              onMouseLeave={() =>
                                setHoveredMilestone(null)
                              }
                            >
                              {/* Diamond marker */}
                              <div
                                className={`w-3 h-3 rotate-45 border-2 ${
                                  milestone.isFaculty
                                    ? "bg-[#ff7c11] border-[#ff7c11]"
                                    : "bg-transparent border-[#535766]"
                                }`}
                              />
                              {/* Label */}
                              <div className="absolute top-4 left-1/2 -translate-x-1/2 whitespace-nowrap">
                                <span className="text-[9px] text-[#535766] font-medium">
                                  {milestone.code}
                                </span>
                              </div>

                              {/* Tooltip */}
                              {isHovered && (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-30">
                                  <div className="bg-[#1a1c24] text-white text-[11px] rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
                                    <div className="font-medium">
                                      {milestone.name}
                                    </div>
                                    <div className="text-white/70 text-[10px] mt-0.5">
                                      {formatDate(new Date(milestone.dueDate))}
                                    </div>
                                    {milestone.isFaculty && (
                                      <div className="text-[#ff9a3e] text-[10px] mt-0.5">
                                        Hito facultad
                                      </div>
                                    )}
                                  </div>
                                  {/* Tooltip arrow */}
                                  <div className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-2 h-2 rotate-45 bg-[#1a1c24]" />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Expand toggle */}
                    {totalCount > 0 && (
                      <div className="pl-1 mt-0.5">
                        <button
                          onClick={() => togglePhase(phase.id)}
                          className="flex items-center gap-0.5 text-[10px] text-[#535766] hover:text-[#ff7c11] transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronDown size={10} />
                          ) : (
                            <ChevronRight size={10} />
                          )}
                          Ver items ({totalCount})
                        </button>
                      </div>
                    )}

                    {/* Expanded entity rows */}
                    {isExpanded && (
                      <div className="space-y-0 mt-1 ml-1">
                        {/* Tasks */}
                        {activeFilters.has("tasks") &&
                          phaseEntities.tasks.length > 0 && (
                            <EntityRow
                              icon={CheckSquare}
                              label="Tareas"
                              count={phaseEntities.tasks.length}
                              color={ENTITY_CONFIG.tasks.color}
                            >
                              {phaseEntities.tasks.map((task) => {
                                const taskDate = task.dueDate
                                  ? new Date(task.dueDate)
                                  : new Date(task.createdAt);
                                return (
                                  <EntityDot
                                    key={task.id}
                                    percent={dateToPercent(taskDate)}
                                    color={getTaskStatusColor(
                                      task.status as TaskStatus
                                    )}
                                    tooltip={
                                      <>
                                        <div className="font-medium">
                                          {task.title}
                                        </div>
                                        {task.assignee && (
                                          <div className="text-white/70 text-[10px]">
                                            {task.assignee.name}
                                          </div>
                                        )}
                                        <div className="text-white/50 text-[10px]">
                                          {task.status}
                                        </div>
                                      </>
                                    }
                                  />
                                );
                              })}
                            </EntityRow>
                          )}

                        {/* Research */}
                        {activeFilters.has("research") &&
                          phaseEntities.research.length > 0 && (
                            <EntityRow
                              icon={BookOpen}
                              label="Research"
                              count={phaseEntities.research.length}
                              color={ENTITY_CONFIG.research.color}
                            >
                              {phaseEntities.research.map((entry) => (
                                <EntityDot
                                  key={entry.id}
                                  percent={dateToPercent(
                                    new Date(entry.createdAt)
                                  )}
                                  color={ENTITY_CONFIG.research.color}
                                  tooltip={
                                    <>
                                      <div className="font-medium">
                                        {entry.title}
                                      </div>
                                      <div className="text-white/70 text-[10px]">
                                        {entry.type} - {entry.user.name}
                                      </div>
                                    </>
                                  }
                                />
                              ))}
                            </EntityRow>
                          )}

                        {/* Experiments */}
                        {activeFilters.has("experiments") &&
                          phaseEntities.experiments.length > 0 && (
                            <EntityRow
                              icon={FlaskConical}
                              label="Experimentos"
                              count={phaseEntities.experiments.length}
                              color={ENTITY_CONFIG.experiments.color}
                            >
                              {phaseEntities.experiments.map((exp) => (
                                <EntityDot
                                  key={exp.id}
                                  percent={dateToPercent(
                                    new Date(exp.createdAt)
                                  )}
                                  color={ENTITY_CONFIG.experiments.color}
                                  tooltip={
                                    <>
                                      <div className="font-medium">
                                        {exp.name}
                                      </div>
                                      <div className="text-white/70 text-[10px]">
                                        {exp.architecture}
                                      </div>
                                      <div className="text-white/50 text-[10px]">
                                        {exp.status}
                                      </div>
                                    </>
                                  }
                                />
                              ))}
                            </EntityRow>
                          )}

                        {/* Meetings */}
                        {activeFilters.has("meetings") &&
                          phaseEntities.meetings.length > 0 && (
                            <EntityRow
                              icon={Calendar}
                              label="Reuniones"
                              count={phaseEntities.meetings.length}
                              color={ENTITY_CONFIG.meetings.color}
                            >
                              {phaseEntities.meetings.map((meeting) => (
                                <EntityDot
                                  key={meeting.id}
                                  percent={dateToPercent(
                                    new Date(meeting.date)
                                  )}
                                  color={ENTITY_CONFIG.meetings.color}
                                  tooltip={
                                    <>
                                      <div className="font-medium">
                                        {meeting.title}
                                      </div>
                                      <div className="text-white/70 text-[10px]">
                                        {meeting.type}
                                      </div>
                                      <div className="text-white/50 text-[10px]">
                                        {formatDate(new Date(meeting.date))}
                                      </div>
                                    </>
                                  }
                                />
                              ))}
                            </EntityRow>
                          )}

                        {/* Decisions */}
                        {activeFilters.has("decisions") &&
                          phaseEntities.decisions.length > 0 && (
                            <EntityRow
                              icon={Scale}
                              label="Decisiones"
                              count={phaseEntities.decisions.length}
                              color={ENTITY_CONFIG.decisions.color}
                            >
                              {phaseEntities.decisions.map((dec) => (
                                <EntityDot
                                  key={dec.id}
                                  percent={dateToPercent(
                                    new Date(dec.createdAt)
                                  )}
                                  color={ENTITY_CONFIG.decisions.color}
                                  tooltip={
                                    <>
                                      <div className="font-medium">
                                        {dec.title}
                                      </div>
                                      <div className="text-white/50 text-[10px]">
                                        {dec.status}
                                      </div>
                                    </>
                                  }
                                />
                              ))}
                            </EntityRow>
                          )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-6 mt-6 pt-4 border-t border-[#d3cfc6]/40 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-4 h-2.5 rounded-sm bg-gradient-to-r from-[#ff7c11] to-[#ff9a3e]" />
              <span className="text-[10px] text-[#535766]">En progreso</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-2.5 rounded-sm bg-emerald-500" />
              <span className="text-[10px] text-[#535766]">Completada</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-2.5 rounded-sm bg-[#dedad0]" />
              <span className="text-[10px] text-[#535766]">No iniciada</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rotate-45 bg-[#ff7c11] border-2 border-[#ff7c11]" />
              <span className="text-[10px] text-[#535766]">Hito facultad</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rotate-45 border-2 border-[#535766]" />
              <span className="text-[10px] text-[#535766]">Hito interno</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
