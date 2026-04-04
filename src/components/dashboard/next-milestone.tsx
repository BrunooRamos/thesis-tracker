"use client";

import { differenceInDays, format } from "date-fns";
import { es } from "date-fns/locale";
import { Target, GraduationCap } from "lucide-react";
import type { Milestone, Phase } from "@/types";

type MilestoneWithPhase = Milestone & { phase: Phase };

export function NextMilestone({
  milestone,
}: {
  milestone: MilestoneWithPhase | null;
}) {
  if (!milestone) {
    return (
      <div className="rounded-2xl bg-white/60 border border-[#d3cfc6]/40 p-6">
        <p className="text-sm text-[#535766]">No hay hitos pendientes</p>
      </div>
    );
  }

  const daysLeft = differenceInDays(milestone.dueDate, new Date());
  const isUrgent = daysLeft <= 14;
  const isFaculty = milestone.isFaculty;

  return (
    <div className="relative rounded-2xl bg-white/60 border border-[#d3cfc6]/40 p-6 overflow-hidden">
      {/* Subtle gradient accent */}
      <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-gradient-to-bl from-[#ff7c11]/[0.06] to-transparent blur-[40px]" />

      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            {isFaculty ? (
              <div className="w-8 h-8 rounded-lg bg-[#1a1c24]/5 flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-[#1a1c24]" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-lg bg-[#ff7c11]/10 flex items-center justify-center">
                <Target className="w-4 h-4 text-[#ff7c11]" />
              </div>
            )}
            <div>
              <p className="text-[10px] uppercase tracking-widest text-[#535766]">
                Próximo hito
              </p>
              <p className="text-xs text-[#535766]">{milestone.code}</p>
            </div>
          </div>

          {isFaculty && (
            <span className="px-2 py-1 rounded-full bg-[#1a1c24] text-white text-[9px] uppercase tracking-wider font-medium">
              Facultad
            </span>
          )}
        </div>

        <h3 className="text-lg font-semibold text-[#1a1c24] mb-2">
          {milestone.name}
        </h3>

        <div className="flex items-center gap-3">
          <p className="text-xs text-[#535766]">
            {format(milestone.dueDate, "d 'de' MMMM, yyyy", { locale: es })}
          </p>
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium ${
              isUrgent
                ? "bg-red-50 text-red-500"
                : "bg-[#ff7c11]/10 text-[#ff7c11]"
            }`}
          >
            <span className="relative flex h-1.5 w-1.5">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isUrgent ? "bg-red-400" : "bg-[#ff7c11]"
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
                  isUrgent ? "bg-red-400" : "bg-[#ff7c11]"
                }`}
              />
            </span>
            {daysLeft} días
          </div>
        </div>

        <p className="text-[11px] text-[#535766] mt-2">
          Fase {milestone.phase.number}: {milestone.phase.name}
        </p>
      </div>
    </div>
  );
}
