"use client";

import { formatDistanceToNow, format, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import {
  CheckCircle2,
  BookOpen,
  FlaskConical,
  ListTodo,
  Target,
  GraduationCap,
  Calendar,
  Clock,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Scale,
  MessageSquare,
  Plus,
  Play,
  FileText,
  Users,
  Zap,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserAvatar } from "@/components/ui/user-avatar";
import { cn } from "@/lib/utils";
import type { Phase, Milestone, User, Task, ActivityLog, ResearchEntry, Decision } from "@/types";

type DashboardData = {
  phases: (Phase & { milestones: Milestone[] })[];
  nextMilestones: (Milestone & { phase: Phase })[];
  allMilestones: (Milestone & { phase: Phase })[];
  users: (User & { assignedTasks: Task[]; _count: { assignedTasks: number; researchEntries: number; experiments: number } })[];
  tasks: (Task & { assignees: User[]; phase: Phase | null })[];
  activities: ActivityLog[];
  stats: {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    researchCount: number;
    experimentCount: number;
    decisionCount: number;
    meetingCount: number;
    overallProgress: number;
    timeProgress: number;
    elapsedDays: number;
    remainingDays: number;
    totalDays: number;
    tasksByStatus: { TODO: number; IN_PROGRESS: number; IN_REVIEW: number; DONE: number };
  };
  overdueTasks: Task[];
  unassignedTasks: Task[];
  recentResearch: (ResearchEntry & { user: User })[];
  recentDecisions: (Decision & { madeBy: User })[];
};

export function DashboardClient({ data }: { data: DashboardData }) {
  const { phases, nextMilestones, users, tasks, activities, stats, overdueTasks, unassignedTasks, recentResearch, recentDecisions } = data;

  return (
    <div className="space-y-5">
      {/* Row 1: Project overview + Time */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Overall progress — big card */}
        <div className="lg:col-span-2 rounded-2xl bg-gradient-to-br from-[#1a1c24] to-[#2a2c34] p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#ff7c11]/[0.08] rounded-full blur-[60px]" />
          <div className="relative">
            <p className="text-[10px] uppercase tracking-widest text-[#7a7d87] mb-1">Progreso General</p>
            <div className="flex items-end gap-3 mb-4">
              <span className="text-4xl font-bold text-white font-mono tracking-tight">{stats.overallProgress}%</span>
              <span className="text-xs text-[#7a7d87] mb-1.5">del proyecto</span>
            </div>

            {/* Phase mini-bars */}
            <div className="flex gap-1.5 mb-4">
              {phases.map((phase) => (
                <div key={phase.id} className="flex-1">
                  <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-700",
                        phase.status === "COMPLETED" ? "bg-emerald-400" :
                        phase.status === "IN_PROGRESS" ? "bg-gradient-to-r from-[#ff7c11] to-[#ff9a3e]" :
                        "bg-white/[0.06]"
                      )}
                      style={{ width: `${Math.max(phase.progress, 2)}%` }}
                    />
                  </div>
                  <p className={cn(
                    "text-[9px] mt-1 font-medium",
                    phase.status === "IN_PROGRESS" ? "text-[#ff9a3e]" :
                    phase.status === "COMPLETED" ? "text-emerald-400" :
                    "text-[#535766]"
                  )}>
                    F{phase.number}
                  </p>
                </div>
              ))}
            </div>

            {/* Time vs progress */}
            <div className="flex items-center gap-4 text-[10px]">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-[#ff7c11]" />
                <span className="text-[#c5c0b6]">Día {stats.elapsedDays} de {stats.totalDays}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <TrendingUp className="w-3 h-3 text-[#7a7d87]" />
                <span className="text-[#7a7d87]">Tiempo: {stats.timeProgress}%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3 h-3 text-[#7a7d87]" />
                <span className="text-[#7a7d87]">{stats.remainingDays} días restantes</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick stat cards */}
        <StatCard icon={ListTodo} label="Tareas" value={`${stats.completedTasks}/${stats.totalTasks}`} sub={`${stats.inProgressTasks} en progreso`} color="orange" href="/tasks" />
        <StatCard icon={BookOpen} label="Research" value={stats.researchCount.toString()} sub={`${stats.experimentCount} experimentos`} color="brown" href="/research" />
      </div>

      {/* Row 2: Next milestones + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Upcoming milestones */}
        <div className="lg:col-span-2 rounded-2xl bg-white/60 border border-[#d3cfc6]/40 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-semibold text-[#1a1c24] uppercase tracking-wider">Próximos Hitos</h3>
            <Link href="/timeline" className="text-[10px] text-[#ff7c11] hover:text-[#9a4a00] flex items-center gap-1 transition-colors">
              Ver timeline <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {nextMilestones.length === 0 ? (
            <p className="text-xs text-[#535766] py-4">No hay hitos pendientes</p>
          ) : (
            <div className="space-y-2.5">
              {nextMilestones.map((m, i) => {
                const daysLeft = differenceInDays(new Date(m.dueDate), new Date());
                const isUrgent = daysLeft <= 14;
                return (
                  <div key={m.id} className={cn(
                    "flex items-center gap-3 p-3 rounded-xl transition-colors",
                    i === 0 ? "bg-[#ff7c11]/[0.04] border border-[#ff7c11]/20" : "bg-[#f2f0ea]/50"
                  )}>
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                      m.isFaculty ? "bg-[#1a1c24]/10" : "bg-[#ff7c11]/10"
                    )}>
                      {m.isFaculty ? <GraduationCap className="w-4 h-4 text-[#1a1c24]" /> : <Target className="w-4 h-4 text-[#ff7c11]" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-[#ff7c11] font-bold">{m.code}</span>
                        {m.isFaculty && <span className="px-1.5 py-0.5 rounded text-[8px] bg-[#1a1c24] text-white uppercase tracking-wider">Facultad</span>}
                      </div>
                      <p className="text-sm font-medium text-[#1a1c24] truncate">{m.name}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={cn(
                        "text-sm font-mono font-bold",
                        isUrgent ? "text-red-500" : "text-[#ff7c11]"
                      )}>
                        {daysLeft}d
                      </p>
                      <p className="text-[9px] text-[#535766]">
                        {format(new Date(m.dueDate), "dd MMM", { locale: es })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Alerts column */}
        <div className="space-y-4">
          {overdueTasks.length > 0 && (
            <div className="rounded-2xl border border-red-200 bg-red-50/60 p-4">
              <div className="flex items-center gap-2 mb-2.5">
                <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                <h3 className="text-[10px] font-semibold text-red-600 uppercase tracking-wider">
                  Vencidas ({overdueTasks.length})
                </h3>
              </div>
              {overdueTasks.slice(0, 3).map((t) => (
                <div key={t.id} className="flex items-center justify-between py-1">
                  <span className="text-[11px] text-red-700 truncate max-w-[70%]">{t.title}</span>
                  <span className="text-[9px] text-red-400 font-mono">
                    {t.dueDate && formatDistanceToNow(new Date(t.dueDate), { locale: es })}
                  </span>
                </div>
              ))}
            </div>
          )}
          {unassignedTasks.length > 0 && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
              <div className="flex items-center gap-2 mb-2.5">
                <Users className="w-3.5 h-3.5 text-amber-600" />
                <h3 className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider">
                  Sin asignar ({unassignedTasks.length})
                </h3>
              </div>
              {unassignedTasks.slice(0, 3).map((t) => (
                <p key={t.id} className="text-[11px] text-amber-700 truncate py-0.5">{t.title}</p>
              ))}
              {unassignedTasks.length > 3 && (
                <Link href="/tasks" className="text-[10px] text-amber-600 hover:text-amber-800 mt-1 inline-block">
                  +{unassignedTasks.length - 3} más
                </Link>
              )}
            </div>
          )}
          {/* Quick counters */}
          <div className="grid grid-cols-2 gap-2">
            <MiniStat icon={Scale} label="Decisiones" value={stats.decisionCount} href="/decisions" />
            <MiniStat icon={MessageSquare} label="Reuniones" value={stats.meetingCount} href="/meetings" />
          </div>
        </div>
      </div>

      {/* Row 3: Task distribution + Team */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Task distribution */}
        <div className="rounded-2xl bg-white/60 border border-[#d3cfc6]/40 p-5">
          <h3 className="text-xs font-semibold text-[#1a1c24] uppercase tracking-wider mb-4">Distribución de Tareas</h3>

          {/* Status bar */}
          {stats.totalTasks > 0 ? (
            <>
              <div className="flex h-3 rounded-full overflow-hidden mb-3 bg-[#e9e7df]">
                {stats.tasksByStatus.DONE > 0 && (
                  <div className="bg-emerald-500 transition-all" style={{ width: `${(stats.tasksByStatus.DONE / stats.totalTasks) * 100}%` }} />
                )}
                {stats.tasksByStatus.IN_REVIEW > 0 && (
                  <div className="bg-amber-400 transition-all" style={{ width: `${(stats.tasksByStatus.IN_REVIEW / stats.totalTasks) * 100}%` }} />
                )}
                {stats.tasksByStatus.IN_PROGRESS > 0 && (
                  <div className="bg-[#ff7c11] transition-all" style={{ width: `${(stats.tasksByStatus.IN_PROGRESS / stats.totalTasks) * 100}%` }} />
                )}
                {stats.tasksByStatus.TODO > 0 && (
                  <div className="bg-[#d3cfc6] transition-all" style={{ width: `${(stats.tasksByStatus.TODO / stats.totalTasks) * 100}%` }} />
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Done", count: stats.tasksByStatus.DONE, color: "bg-emerald-500" },
                  { label: "In Review", count: stats.tasksByStatus.IN_REVIEW, color: "bg-amber-400" },
                  { label: "In Progress", count: stats.tasksByStatus.IN_PROGRESS, color: "bg-[#ff7c11]" },
                  { label: "To Do", count: stats.tasksByStatus.TODO, color: "bg-[#d3cfc6]" },
                ].map((s) => (
                  <div key={s.label} className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${s.color}`} />
                    <span className="text-[10px] text-[#535766]">{s.label}</span>
                    <span className="text-[10px] font-mono font-bold text-[#1a1c24] ml-auto">{s.count}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-6">
              <ListTodo className="w-6 h-6 text-[#d3cfc6] mx-auto mb-2" />
              <p className="text-xs text-[#535766]">Sin tareas aún</p>
              <Link href="/tasks" className="text-[10px] text-[#ff7c11] hover:text-[#9a4a00] mt-1 inline-flex items-center gap-1">
                Crear primera tarea <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          )}
        </div>

        {/* Team workload */}
        <div className="lg:col-span-2 rounded-2xl bg-white/60 border border-[#d3cfc6]/40 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-semibold text-[#1a1c24] uppercase tracking-wider">Equipo</h3>
            <Link href="/team" className="text-[10px] text-[#ff7c11] hover:text-[#9a4a00] flex items-center gap-1 transition-colors">
              Ver detalle <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {users.map((user, i) => {
              const activeTasks = user.assignedTasks.filter((t) => t.status !== "DONE");
              const doneTasks = user.assignedTasks.filter((t) => t.status === "DONE");
              return (
                <div key={user.id} className="rounded-xl bg-[#f2f0ea]/60 border border-[#d3cfc6]/30 p-4">
                  <div className="flex items-center gap-2.5 mb-3">
                    <UserAvatar user={user} size="md" />
                    <div>
                      <p className="text-sm font-medium text-[#1a1c24]">{user.name}</p>
                      <p className="text-[9px] text-[#535766]">{user._count.researchEntries} research · {user._count.experiments} exp.</p>
                    </div>
                  </div>
                  {/* Mini task bar */}
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="flex-1 h-1.5 rounded-full bg-[#e9e7df] overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full"
                        style={{ width: user.assignedTasks.length > 0 ? `${(doneTasks.length / user.assignedTasks.length) * 100}%` : "0%" }}
                      />
                    </div>
                    <span className="text-[9px] font-mono text-[#535766]">
                      {doneTasks.length}/{user.assignedTasks.length}
                    </span>
                  </div>
                  <div className="flex gap-3 text-[10px]">
                    <span className="text-[#ff7c11] font-medium">{activeTasks.filter(t => t.status === "IN_PROGRESS").length} activas</span>
                    <span className="text-[#535766]">{activeTasks.filter(t => t.status === "TODO").length} pendientes</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row 4: Activity + Recent items */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Activity feed */}
        <div className="lg:col-span-2 rounded-2xl bg-white/60 border border-[#d3cfc6]/40 p-5">
          <h3 className="text-xs font-semibold text-[#1a1c24] uppercase tracking-wider mb-4">Actividad Reciente</h3>
          <ScrollArea className="h-[260px]">
            {activities.length === 0 ? (
              <div className="text-center py-8">
                <Zap className="w-6 h-6 text-[#d3cfc6] mx-auto mb-2" />
                <p className="text-xs text-[#535766]">Sin actividad aún</p>
                <p className="text-[10px] text-[#535766]/60 mt-0.5">Las acciones del equipo aparecerán acá</p>
              </div>
            ) : (
              <div className="space-y-0.5">
                {activities.map((a) => (
                  <ActivityRow key={a.id} activity={a} />
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Recent research + decisions sidebar */}
        <div className="space-y-4">
          {/* Recent research */}
          <div className="rounded-2xl bg-white/60 border border-[#d3cfc6]/40 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[10px] font-semibold text-[#1a1c24] uppercase tracking-wider">Research Reciente</h3>
              <Link href="/research" className="text-[9px] text-[#ff7c11]">Ver todo</Link>
            </div>
            {recentResearch.length === 0 ? (
              <p className="text-[11px] text-[#535766] py-3 text-center">Sin entries aún</p>
            ) : (
              <div className="space-y-2">
                {recentResearch.map((r) => (
                  <div key={r.id} className="flex items-start gap-2 py-1.5">
                    <BookOpen className="w-3 h-3 text-[#9a4a00] mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[11px] text-[#1a1c24] font-medium truncate">{r.title}</p>
                      <p className="text-[9px] text-[#535766]">{r.user.name} · {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true, locale: es })}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent decisions */}
          <div className="rounded-2xl bg-white/60 border border-[#d3cfc6]/40 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[10px] font-semibold text-[#1a1c24] uppercase tracking-wider">Decisiones Recientes</h3>
              <Link href="/decisions" className="text-[9px] text-[#ff7c11]">Ver todo</Link>
            </div>
            {recentDecisions.length === 0 ? (
              <p className="text-[11px] text-[#535766] py-3 text-center">Sin decisiones aún</p>
            ) : (
              <div className="space-y-2">
                {recentDecisions.map((d) => (
                  <div key={d.id} className="flex items-start gap-2 py-1.5">
                    <Scale className="w-3 h-3 text-[#ff7c11] mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[11px] text-[#1a1c24] font-medium truncate">{d.title}</p>
                      <div className="flex items-center gap-1.5">
                        <span className={cn(
                          "px-1 py-0.5 rounded text-[8px] font-medium",
                          d.status === "ACCEPTED" ? "bg-emerald-50 text-emerald-600" :
                          d.status === "REVISITED" ? "bg-[#ff7c11]/10 text-[#ff7c11]" :
                          "bg-amber-50 text-amber-600"
                        )}>
                          {d.status === "PROPOSED" ? "Propuesta" : d.status === "ACCEPTED" ? "Aceptada" : "Revisada"}
                        </span>
                        <span className="text-[9px] text-[#535766]">{d.madeBy.name}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Sub-components ---

function StatCard({ icon: Icon, label, value, sub, color, href }: {
  icon: typeof ListTodo;
  label: string;
  value: string;
  sub: string;
  color: "orange" | "brown";
  href: string;
}) {
  return (
    <Link href={href} className="rounded-2xl bg-white/60 border border-[#d3cfc6]/40 p-5 hover:border-[#d3cfc6] transition-colors group">
      <div className={cn(
        "w-9 h-9 rounded-xl flex items-center justify-center mb-3",
        color === "orange" ? "bg-[#ff7c11]/10" : "bg-[#9a4a00]/10"
      )}>
        <Icon className={cn("w-4.5 h-4.5", color === "orange" ? "text-[#ff7c11]" : "text-[#9a4a00]")} />
      </div>
      <p className="text-2xl font-bold text-[#1a1c24] font-mono tracking-tight">{value}</p>
      <p className="text-[10px] text-[#535766] uppercase tracking-wider mt-0.5">{label}</p>
      <p className="text-[10px] text-[#535766]/60 mt-1">{sub}</p>
      <span className="text-[9px] text-[#ff7c11] opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 mt-2">
        Ver más <ArrowRight className="w-2.5 h-2.5" />
      </span>
    </Link>
  );
}

function MiniStat({ icon: Icon, label, value, href }: {
  icon: typeof Scale;
  label: string;
  value: number;
  href: string;
}) {
  return (
    <Link href={href} className="rounded-xl bg-white/60 border border-[#d3cfc6]/40 p-3 hover:border-[#d3cfc6] transition-colors">
      <div className="flex items-center gap-2">
        <Icon className="w-3.5 h-3.5 text-[#535766]" />
        <span className="text-lg font-bold font-mono text-[#1a1c24]">{value}</span>
      </div>
      <p className="text-[9px] text-[#535766] uppercase tracking-wider mt-0.5">{label}</p>
    </Link>
  );
}

const actionIcons: Record<string, { icon: typeof Plus; color: string }> = {
  created_task: { icon: Plus, color: "text-[#ff7c11] bg-[#ff7c11]/10" },
  completed_task: { icon: CheckCircle2, color: "text-emerald-500 bg-emerald-50" },
  started_task: { icon: Play, color: "text-amber-500 bg-amber-50" },
  added_research: { icon: BookOpen, color: "text-[#9a4a00] bg-[#9a4a00]/10" },
  completed_experiment: { icon: FlaskConical, color: "text-cyan-600 bg-cyan-50" },
  added_comment: { icon: MessageSquare, color: "text-[#535766] bg-[#e9e7df]" },
  created_decision: { icon: Scale, color: "text-[#ff7c11] bg-[#ff7c11]/10" },
  created_meeting: { icon: Calendar, color: "text-emerald-600 bg-emerald-50" },
  deleted_task: { icon: AlertTriangle, color: "text-red-500 bg-red-50" },
  updated_task: { icon: FileText, color: "text-[#535766] bg-[#e9e7df]" },
};

const actionLabels: Record<string, string> = {
  created_task: "creó",
  completed_task: "completó",
  started_task: "empezó",
  added_research: "agregó research",
  completed_experiment: "completó experimento",
  added_comment: "comentó en",
  created_decision: "registró decisión",
  created_meeting: "agregó reunión",
  deleted_task: "eliminó",
  updated_task: "actualizó",
};

function ActivityRow({ activity }: { activity: ActivityLog }) {
  const config = actionIcons[activity.action] || { icon: Zap, color: "text-[#535766] bg-[#e9e7df]" };
  const Icon = config.icon;
  const label = actionLabels[activity.action] || activity.action;

  return (
    <div className="flex items-start gap-2.5 px-2 py-2 rounded-lg hover:bg-[#e9e7df]/30 transition-colors">
      <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${config.color}`}>
        <Icon className="w-3 h-3" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-[#383c48] leading-relaxed">
          <span className="font-semibold text-[#1a1c24]">{activity.userName}</span>{" "}
          {label}{" "}
          <span className="text-[#535766]">{activity.entityTitle}</span>
        </p>
        <p className="text-[9px] text-[#535766]/50 mt-0.5">
          {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true, locale: es })}
        </p>
      </div>
    </div>
  );
}
