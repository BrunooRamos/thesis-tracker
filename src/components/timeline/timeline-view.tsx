"use client";

import { useState } from "react";
import type { Phase, Milestone, Task, PhaseStatus } from "@/types";

type PhaseWithMilestones = Phase & { milestones: Milestone[] };
type TaskWithPhase = Task & { phase: Phase | null };

interface TimelineViewProps {
  phases: PhaseWithMilestones[];
  tasks: TaskWithPhase[];
}

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

export function TimelineView({ phases, tasks }: TimelineViewProps) {
  const [hoveredMilestone, setHoveredMilestone] = useState<string | null>(null);

  const today = new Date();
  const todayPercent = dateToPercent(today);
  const isTodayVisible =
    today >= PROJECT_START && today <= PROJECT_END;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[#1a1c24]">
          Cronograma
        </h1>
        <p className="text-sm text-[#535766] mt-1">
          Vista de la linea de tiempo del proyecto — Marzo a Diciembre 2026
        </p>
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
                          const isHovered =
                            hoveredMilestone === milestone.id;

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
                                      {formatDate(
                                        new Date(milestone.dueDate)
                                      )}
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
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-6 mt-6 pt-4 border-t border-[#d3cfc6]/40">
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
              <span className="text-[10px] text-[#535766]">
                Hito facultad
              </span>
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
