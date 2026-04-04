import { cn } from "@/lib/utils";
import type { Phase, Milestone } from "@/types";

type PhaseWithMilestones = Phase & { milestones: Milestone[] };

export function PhaseProgress({ phases }: { phases: PhaseWithMilestones[] }) {
  return (
    <div className="rounded-2xl bg-white/60 border border-[#d3cfc6]/40 p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-semibold text-[#1a1c24]">
          Progreso del Proyecto
        </h2>
        <span className="text-[10px] text-[#535766] font-mono">
          Mar — Dic 2026
        </span>
      </div>

      <div className="flex gap-2">
        {phases.map((phase) => (
          <div key={phase.id} className="flex-1">
            {/* Bar */}
            <div className="relative h-2 rounded-full bg-[#e9e7df] overflow-hidden mb-3">
              <div
                className={cn(
                  "absolute inset-y-0 left-0 rounded-full transition-all duration-700",
                  phase.status === "COMPLETED"
                    ? "bg-emerald-500"
                    : phase.status === "IN_PROGRESS"
                    ? "bg-gradient-to-r from-[#ff7c11] to-[#ff9a3e]"
                    : "bg-[#dedad0]"
                )}
                style={{ width: `${Math.max(phase.progress, 2)}%` }}
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "inline-flex items-center justify-center w-5 h-5 rounded-md text-[10px] font-bold",
                    phase.status === "COMPLETED"
                      ? "bg-emerald-100 text-emerald-600"
                      : phase.status === "IN_PROGRESS"
                      ? "bg-[#ff7c11]/10 text-[#ff7c11]"
                      : "bg-[#e9e7df] text-[#535766]"
                  )}
                >
                  {phase.number}
                </span>
                <span
                  className={cn(
                    "text-[11px] font-medium truncate",
                    phase.status === "IN_PROGRESS"
                      ? "text-[#1a1c24]"
                      : phase.status === "COMPLETED"
                      ? "text-emerald-600"
                      : "text-[#535766]"
                  )}
                >
                  {phase.name}
                </span>
              </div>
              <p className="text-[10px] text-[#535766] pl-[26px] font-mono">
                {phase.progress}%
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
