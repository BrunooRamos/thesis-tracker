"use client";

import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
  Plus,
  CheckCircle2,
  Play,
  BookOpen,
  FlaskConical,
  MessageSquare,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ActivityLog } from "@/types";

const actionConfig: Record<string, { icon: typeof Plus; color: string }> = {
  created_task: { icon: Plus, color: "text-[#ff7c11] bg-[#ff7c11]/10" },
  completed_task: { icon: CheckCircle2, color: "text-emerald-500 bg-emerald-50" },
  started_task: { icon: Play, color: "text-amber-500 bg-amber-50" },
  added_research: { icon: BookOpen, color: "text-[#9a4a00] bg-[#9a4a00]/10" },
  completed_experiment: { icon: FlaskConical, color: "text-cyan-500 bg-cyan-50" },
  added_comment: { icon: MessageSquare, color: "text-[#535766] bg-[#e9e7df]" },
};

const actionLabels: Record<string, string> = {
  created_task: "creó tarea",
  completed_task: "completó",
  started_task: "empezó",
  added_research: "agregó research",
  completed_experiment: "completó experimento",
  added_comment: "comentó en",
};

export function ActivityFeed({ activities }: { activities: ActivityLog[] }) {
  return (
    <div className="rounded-2xl bg-white/60 border border-[#d3cfc6]/40 p-5">
      <h3 className="text-[10px] uppercase tracking-widest text-[#535766] mb-4">
        Actividad Reciente
      </h3>
      <ScrollArea className="h-[280px]">
        <div className="space-y-1">
          {activities.length === 0 ? (
            <p className="text-xs text-[#535766] text-center py-8">
              Sin actividad reciente
            </p>
          ) : (
            activities.map((activity) => {
              const config = actionConfig[activity.action] || {
                icon: Plus,
                color: "text-[#535766] bg-[#e9e7df]",
              };
              const Icon = config.icon;
              const label = actionLabels[activity.action] || activity.action;

              return (
                <div
                  key={activity.id}
                  className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-[#e9e7df]/50 transition-colors"
                >
                  <div
                    className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${config.color}`}
                  >
                    <Icon className="w-3 h-3" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[#383c48] leading-relaxed">
                      <span className="font-semibold text-[#1a1c24]">
                        {activity.userName}
                      </span>{" "}
                      {label}{" "}
                      <span className="text-[#535766]">
                        {activity.entityTitle}
                      </span>
                    </p>
                    <p className="text-[10px] text-[#535766]/60 mt-0.5">
                      {formatDistanceToNow(activity.createdAt, {
                        addSuffix: true,
                        locale: es,
                      })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
