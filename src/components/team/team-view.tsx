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
  Users,
} from "lucide-react";
import Link from "next/link";
import { UserAvatar } from "@/components/ui/user-avatar";
import type {
  User,
  Task,
  Phase,
  Tag,
  ResearchEntry,
  Experiment,
  ActivityLog,
  Priority,
  TaskStatus,
} from "@/types";

// ---- Types ----

type TeamUser = User & {
  assignedTasks: (Task & { phase: Phase | null; tags: Tag[] })[];
  researchEntries: ResearchEntry[];
  experiments: Experiment[];
  _count: {
    assignedTasks: number;
    researchEntries: number;
    experiments: number;
    comments: number;
  };
};

interface TeamViewProps {
  users: TeamUser[];
  activitiesByUser: Record<string, ActivityLog[]>;
}

// ---- Config ----

const statusBadge: Record<string, string> = {
  TODO: "bg-[#e9e7df] text-[#535766]",
  IN_PROGRESS: "bg-[#ff7c11]/10 text-[#ff7c11]",
  IN_REVIEW: "bg-amber-50 text-amber-600",
  DONE: "bg-emerald-50 text-emerald-600",
};

const statusLabel: Record<string, string> = {
  TODO: "Por hacer",
  IN_PROGRESS: "En progreso",
  IN_REVIEW: "En revisi\u00f3n",
  DONE: "Completada",
};

const priorityColor: Record<string, string> = {
  URGENT: "bg-red-500",
  HIGH: "bg-amber-500",
  MEDIUM: "bg-[#ff7c11]",
  LOW: "bg-gray-400",
};

const priorityBarColor: Record<string, string> = {
  URGENT: "bg-red-500",
  HIGH: "bg-amber-500",
  MEDIUM: "bg-[#ff7c11]",
  LOW: "bg-gray-300",
};

const priorityLabel: Record<string, string> = {
  URGENT: "Urgente",
  HIGH: "Alta",
  MEDIUM: "Media",
  LOW: "Baja",
};

const actionConfig: Record<string, { icon: typeof Plus; color: string }> = {
  created_task: { icon: Plus, color: "text-blue-500 bg-blue-50" },
  completed_task: {
    icon: CheckCircle2,
    color: "text-emerald-500 bg-emerald-50",
  },
  started_task: { icon: Play, color: "text-amber-500 bg-amber-50" },
  added_research: { icon: BookOpen, color: "text-[#9a4a00] bg-[#9a4a00]/10" },
  completed_experiment: {
    icon: FlaskConical,
    color: "text-cyan-500 bg-cyan-50",
  },
  added_comment: { icon: MessageSquare, color: "text-[#535766] bg-[#e9e7df]" },
};

const actionLabels: Record<string, string> = {
  created_task: "cre\u00f3 tarea",
  completed_task: "complet\u00f3",
  started_task: "empez\u00f3",
  added_research: "agreg\u00f3 research",
  completed_experiment: "complet\u00f3 experimento",
  added_comment: "coment\u00f3 en",
};

// ---- Component ----

export function TeamView({ users, activitiesByUser }: TeamViewProps) {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#ff7c11]/10 flex items-center justify-center">
          <Users className="w-4.5 h-4.5 text-[#ff7c11]" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-[#1a1c24]">Equipo</h1>
          <p className="text-xs text-[#535766]">
            {users.length} miembros del equipo
          </p>
        </div>
      </div>

      {/* Member cards */}
      <div className="space-y-6">
        {users.map((user) => {
          const activeTasks = user.assignedTasks.filter(
            (t) => t.status !== "DONE"
          );
          const doneTasks = user.assignedTasks.filter(
            (t) => t.status === "DONE"
          );
          const userActivities = (activitiesByUser[user.id] || []).slice(0, 5);

          // Priority breakdown for workload bar
          const priorityCounts: Record<string, number> = {
            URGENT: 0,
            HIGH: 0,
            MEDIUM: 0,
            LOW: 0,
          };
          for (const t of activeTasks) {
            if (t.priority && priorityCounts[t.priority] !== undefined) {
              priorityCounts[t.priority]++;
            }
          }
          const totalActive = activeTasks.length;

          return (
            <div
              key={user.id}
              className="rounded-2xl bg-white/60 border border-[#d3cfc6]/40 p-6"
            >
              {/* Header */}
              <div className="flex items-center gap-4 mb-5">
                <UserAvatar user={user} size="lg" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-base font-semibold text-[#1a1c24]">
                      {user.name}
                    </h2>
                    {user.role && (
                      <span className="text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full bg-[#ff7c11]/10 text-[#ff7c11]">
                        {user.role}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#535766] mt-0.5">{user.email}</p>
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                <StatCard
                  label="Tareas activas"
                  value={activeTasks.length}
                  accent="text-[#ff7c11]"
                />
                <StatCard
                  label="Tareas completadas"
                  value={doneTasks.length}
                  accent="text-emerald-500"
                />
                <StatCard
                  label="Research entries"
                  value={user._count.researchEntries}
                  accent="text-[#9a4a00]"
                />
                <StatCard
                  label="Experimentos"
                  value={user._count.experiments}
                  accent="text-cyan-600"
                />
              </div>

              {/* Workload bar */}
              {totalActive > 0 && (
                <div className="mb-5">
                  <h3 className="text-[10px] uppercase tracking-widest text-[#535766] mb-2">
                    Carga de trabajo
                  </h3>
                  <div className="flex h-7 rounded-lg overflow-hidden">
                    {(
                      ["URGENT", "HIGH", "MEDIUM", "LOW"] as Priority[]
                    ).map((priority) => {
                      const count = priorityCounts[priority];
                      if (count === 0) return null;
                      const pct = (count / totalActive) * 100;
                      return (
                        <div
                          key={priority}
                          className={`${priorityBarColor[priority]} flex items-center justify-center min-w-[28px] transition-all`}
                          style={{ width: `${pct}%` }}
                          title={`${priorityLabel[priority]}: ${count}`}
                        >
                          <span className="text-[10px] font-medium text-white drop-shadow-sm">
                            {count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex gap-4 mt-1.5">
                    {(
                      ["URGENT", "HIGH", "MEDIUM", "LOW"] as Priority[]
                    ).map((priority) => {
                      const count = priorityCounts[priority];
                      if (count === 0) return null;
                      return (
                        <div
                          key={priority}
                          className="flex items-center gap-1.5"
                        >
                          <div
                            className={`w-2 h-2 rounded-full ${priorityColor[priority]}`}
                          />
                          <span className="text-[10px] text-[#535766]">
                            {priorityLabel[priority]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Active tasks list */}
              {activeTasks.length > 0 && (
                <div className="mb-5">
                  <h3 className="text-[10px] uppercase tracking-widest text-[#535766] mb-2">
                    Tareas activas
                  </h3>
                  <div className="space-y-1.5">
                    {activeTasks.slice(0, 5).map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#f2f0ea]/80 border border-[#d3cfc6]/30 hover:border-[#d3cfc6]/60 transition-colors"
                      >
                        <div
                          className={`w-2 h-2 rounded-full shrink-0 ${priorityColor[task.priority] || "bg-gray-300"}`}
                        />
                        <span className="text-sm text-[#1a1c24] flex-1 min-w-0 truncate">
                          {task.title}
                        </span>
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${statusBadge[task.status] || statusBadge.TODO}`}
                        >
                          {statusLabel[task.status] || task.status}
                        </span>
                        {task.phase && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#e9e7df] text-[#535766] shrink-0 hidden sm:inline-block">
                            {task.phase.name}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                  {activeTasks.length > 5 && (
                    <Link
                      href="/tasks"
                      className="inline-block mt-2 text-xs text-[#ff7c11] hover:underline"
                    >
                      ver m\u00e1s ({activeTasks.length - 5} restantes)
                    </Link>
                  )}
                </div>
              )}

              {/* Recent activity */}
              {userActivities.length > 0 && (
                <div>
                  <h3 className="text-[10px] uppercase tracking-widest text-[#535766] mb-2">
                    Actividad reciente
                  </h3>
                  <div className="space-y-1">
                    {userActivities.map((activity) => {
                      const config = actionConfig[activity.action] || {
                        icon: Plus,
                        color: "text-[#535766] bg-[#e9e7df]",
                      };
                      const Icon = config.icon;
                      const label =
                        actionLabels[activity.action] || activity.action;

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
                              {label}{" "}
                              <span className="text-[#535766]">
                                {activity.entityTitle}
                              </span>
                            </p>
                            <p className="text-[10px] text-[#535766]/60 mt-0.5">
                              {formatDistanceToNow(
                                new Date(activity.createdAt),
                                {
                                  addSuffix: true,
                                  locale: es,
                                }
                              )}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---- Sub-components ----

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div className="rounded-xl bg-[#f2f0ea]/80 border border-[#d3cfc6]/30 p-3">
      <p className="text-[10px] text-[#535766] mb-1">{label}</p>
      <p className={`text-xl font-semibold font-mono ${accent}`}>{value}</p>
    </div>
  );
}
