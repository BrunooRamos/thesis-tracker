"use client";

import { useMemo, useState } from "react";
import { Plus, Search, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/ui/user-avatar";
import { toast } from "sonner";
import { CreateActivityDrawer } from "./create-activity-drawer";
import { ActivityDetailDrawer } from "./activity-detail-drawer";
import type {
  Activity,
  User,
  Phase,
  Task,
  Deliverable,
  AcceptanceCriterion,
  Comment,
  ActivityStatus,
} from "@/types";

export type ActivityWithRelations = Activity & {
  phase: Phase;
  owners: User[];
  tasks: (Task & { assignees: User[] })[];
  deliverables: Deliverable[];
  acceptanceCriteria: AcceptanceCriterion[];
  comments?: (Comment & { user: User })[];
};

const statusFilters = [
  { value: "ALL", label: "Todas" },
  { value: "NOT_STARTED", label: "Sin iniciar" },
  { value: "IN_PROGRESS", label: "En curso" },
  { value: "BLOCKED", label: "Bloqueada" },
  { value: "DONE", label: "Completada" },
] as const;

const statusBadge: Record<string, string> = {
  NOT_STARTED: "bg-[#e9e7df] text-[#535766] border-[#d3cfc6]/60",
  IN_PROGRESS: "bg-[#ff7c11]/10 text-[#ff7c11] border-[#ff7c11]/20",
  BLOCKED: "bg-red-50 text-red-600 border-red-200/60",
  DONE: "bg-emerald-50 text-emerald-600 border-emerald-200/60",
};

export const statusLabel: Record<string, string> = {
  NOT_STARTED: "Sin iniciar",
  IN_PROGRESS: "En curso",
  BLOCKED: "Bloqueada",
  DONE: "Completada",
};

const views = [
  { value: "MINE", label: "Mi vista" },
  { value: "BY_PERSON", label: "Por persona" },
  { value: "BY_PHASE", label: "Por fase" },
] as const;

type ViewMode = (typeof views)[number]["value"];

function ActivityCard({
  activity,
  onClick,
}: {
  activity: ActivityWithRelations;
  onClick: () => void;
}) {
  const tasksTotal = activity.tasks.length;
  const tasksDone = activity.tasks.filter((t) => t.status === "DONE").length;
  const critTotal = activity.acceptanceCriteria.length;
  const critDone = activity.acceptanceCriteria.filter((c) => c.done).length;

  const tasksPct = tasksTotal > 0 ? (tasksDone / tasksTotal) * 100 : 0;
  const critPct = critTotal > 0 ? (critDone / critTotal) * 100 : 0;

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white/60 border border-[#d3cfc6]/40 rounded-xl p-4 hover:border-[#ff7c11]/30 hover:bg-white/80 transition-all group"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-mono bg-[#e9e7df] text-[#535766] px-1.5 py-0.5 rounded border border-[#d3cfc6]/40 shrink-0">
              {activity.wbsCode}
            </span>
            <h3 className="text-sm font-medium text-[#1a1c24] truncate group-hover:text-[#ff7c11] transition-colors">
              {activity.name}
            </h3>
            <Badge
              variant="outline"
              className={`text-[10px] shrink-0 ${statusBadge[activity.status]}`}
            >
              {statusLabel[activity.status]}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2">
            <div className="flex items-center gap-1.5 min-w-[110px]">
              <span className="text-[10px] text-[#535766] whitespace-nowrap">
                {tasksDone}/{tasksTotal} tareas
              </span>
              <div className="h-1 flex-1 bg-[#e9e7df] rounded-full overflow-hidden min-w-[40px]">
                <div
                  className="h-full bg-[#ff7c11] rounded-full"
                  style={{ width: `${tasksPct}%` }}
                />
              </div>
            </div>
            <div className="flex items-center gap-1.5 min-w-[110px]">
              <span className="text-[10px] text-[#535766] whitespace-nowrap">
                {critDone}/{critTotal} criterios
              </span>
              <div className="h-1 flex-1 bg-[#e9e7df] rounded-full overflow-hidden min-w-[40px]">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${critPct}%` }}
                />
              </div>
            </div>
            <Badge
              variant="outline"
              className="text-[10px] border-[#d3cfc6]/40 text-[#535766] bg-white/60"
            >
              Fase {activity.phase.number}
            </Badge>
          </div>
        </div>

        <div className="flex -space-x-2 shrink-0">
          {activity.owners.length === 0 ? (
            <span className="text-[10px] text-[#535766]/60">sin owner</span>
          ) : (
            activity.owners.map((o) => (
              <UserAvatar
                key={o.id}
                user={o}
                size="xs"
                className="ring-2 ring-white"
              />
            ))
          )}
        </div>
      </div>
    </button>
  );
}

export function ActivitiesPage({
  initialActivities,
  users,
  phases,
  currentUserId,
}: {
  initialActivities: ActivityWithRelations[];
  users: User[];
  phases: Phase[];
  currentUserId: string;
}) {
  const [activities, setActivities] = useState(initialActivities);
  const [view, setView] = useState<ViewMode>("MINE");
  const [statusFilter, setStatusFilter] = useState<"ALL" | ActivityStatus>(
    "ALL"
  );
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState<ActivityWithRelations | null>(null);
  const [editing, setEditing] = useState<ActivityWithRelations | null>(null);

  const filtered = useMemo(() => {
    return activities.filter((a) => {
      if (statusFilter !== "ALL" && a.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          a.wbsCode.toLowerCase().includes(q) ||
          a.name.toLowerCase().includes(q) ||
          (a.description ?? "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [activities, statusFilter, search]);

  function handleCreated(activity: ActivityWithRelations) {
    setActivities((prev) => {
      const exists = prev.some((a) => a.id === activity.id);
      if (exists) return prev.map((a) => (a.id === activity.id ? activity : a));
      return [activity, ...prev];
    });
    setShowCreate(false);
    setEditing(null);
  }

  function handleUpdated(updated: ActivityWithRelations) {
    setActivities((prev) =>
      prev.map((a) => (a.id === updated.id ? updated : a))
    );
    setSelected(updated);
  }

  function handleDeleted(id: string) {
    setActivities((prev) => prev.filter((a) => a.id !== id));
    setSelected(null);
    toast.success("Actividad eliminada");
  }

  // Grouping
  const mineActivities = filtered.filter((a) =>
    a.owners.some((o) => o.id === currentUserId)
  );

  const byPerson = useMemo(() => {
    const map = new Map<string, ActivityWithRelations[]>();
    users.forEach((u) => map.set(u.id, []));
    filtered.forEach((a) => {
      a.owners.forEach((o) => {
        const list = map.get(o.id);
        if (list) list.push(a);
      });
    });
    return map;
  }, [filtered, users]);

  const byPhase = useMemo(() => {
    const map = new Map<string, ActivityWithRelations[]>();
    phases.forEach((p) => map.set(p.id, []));
    filtered.forEach((a) => {
      const list = map.get(a.phaseId);
      if (list) list.push(a);
    });
    return map;
  }, [filtered, phases]);

  const showEmpty = activities.length === 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#1a1c24]">Actividades</h1>
          <p className="text-sm text-[#535766] mt-0.5">
            Work packages del WBS y sus entregables
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setShowCreate(true);
          }}
          className="bg-[#ff7c11] hover:bg-[#ff9a3e] text-white rounded-full gap-2"
        >
          <Plus className="w-4 h-4" />
          Nueva actividad
        </Button>
      </div>

      {/* View tabs */}
      <div className="flex items-center gap-1.5 bg-white/60 border border-[#d3cfc6]/40 rounded-lg p-1 w-fit">
        {views.map((v) => (
          <button
            key={v.value}
            onClick={() => setView(v.value)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              view === v.value
                ? "bg-[#ff7c11] text-white"
                : "text-[#535766] hover:text-[#1a1c24] hover:bg-white/80"
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-1.5 bg-white/60 border border-[#d3cfc6]/40 rounded-lg p-1 flex-wrap">
          {statusFilters.map((sf) => (
            <button
              key={sf.value}
              onClick={() =>
                setStatusFilter(sf.value as "ALL" | ActivityStatus)
              }
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
            placeholder="Buscar por WBS, nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs bg-white border-[#d3cfc6] text-[#383c48] placeholder:text-[#535766]/50 focus:border-[#ff7c11]"
          />
        </div>
      </div>

      {/* Empty state */}
      {showEmpty ? (
        <div className="text-center py-16">
          <ListChecks className="w-12 h-12 text-[#d3cfc6] mx-auto mb-3" />
          <h3 className="text-sm font-medium text-[#1a1c24] mb-1">
            Sin actividades
          </h3>
          <p className="text-xs text-[#535766] mb-4">
            Crea tu primera actividad o pre-carga desde el plan del proyecto.
          </p>
          <Button
            onClick={() => {
              setEditing(null);
              setShowCreate(true);
            }}
            className="bg-[#ff7c11] hover:bg-[#ff9a3e] text-white rounded-full text-xs"
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> Crear primera actividad
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <ListChecks className="w-12 h-12 text-[#d3cfc6] mx-auto mb-3" />
          <h3 className="text-sm font-medium text-[#1a1c24] mb-1">
            No se encontraron actividades
          </h3>
          <p className="text-xs text-[#535766]">
            Ajusta los filtros o la búsqueda.
          </p>
        </div>
      ) : view === "MINE" ? (
        mineActivities.length === 0 ? (
          <div className="text-center py-16">
            <ListChecks className="w-12 h-12 text-[#d3cfc6] mx-auto mb-3" />
            <h3 className="text-sm font-medium text-[#1a1c24] mb-1">
              No tienes actividades asignadas
            </h3>
            <p className="text-xs text-[#535766]">
              Cambia a otra vista o asígnate una actividad.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {mineActivities.map((a) => (
              <ActivityCard
                key={a.id}
                activity={a}
                onClick={() => setSelected(a)}
              />
            ))}
          </div>
        )
      ) : view === "BY_PERSON" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((u) => {
            const list = byPerson.get(u.id) || [];
            return (
              <div
                key={u.id}
                className="bg-white/40 border border-[#d3cfc6]/30 rounded-xl p-3"
              >
                <div className="flex items-center gap-2 mb-3">
                  <UserAvatar user={u} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[#1a1c24] truncate">
                      {u.name}
                    </p>
                    <p className="text-[10px] text-[#535766]">
                      {list.length} actividad{list.length !== 1 ? "es" : ""}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  {list.length === 0 ? (
                    <p className="text-[10px] text-[#535766]/60 italic">
                      Sin actividades
                    </p>
                  ) : (
                    list.map((a) => (
                      <ActivityCard
                        key={a.id}
                        activity={a}
                        onClick={() => setSelected(a)}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-6">
          {phases.map((p) => {
            const list = byPhase.get(p.id) || [];
            if (list.length === 0) return null;
            return (
              <div key={p.id}>
                <div className="flex items-center gap-2 mb-3">
                  <Badge
                    variant="outline"
                    className="text-[10px] border-[#ff7c11]/20 bg-[#ff7c11]/10 text-[#ff7c11]"
                  >
                    Fase {p.number}
                  </Badge>
                  <h2 className="text-sm font-medium text-[#1a1c24]">
                    {p.name}
                  </h2>
                  <span className="text-[10px] text-[#535766]">
                    ({list.length})
                  </span>
                </div>
                <div className="space-y-3">
                  {list.map((a) => (
                    <ActivityCard
                      key={a.id}
                      activity={a}
                      onClick={() => setSelected(a)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Drawers */}
      <CreateActivityDrawer
        open={showCreate}
        onOpenChange={(o) => {
          setShowCreate(o);
          if (!o) setEditing(null);
        }}
        users={users}
        phases={phases}
        onCreated={handleCreated}
        editingItem={editing}
      />

      <ActivityDetailDrawer
        activity={selected}
        onClose={() => setSelected(null)}
        users={users}
        phases={phases}
        onUpdated={handleUpdated}
        onDeleted={handleDeleted}
        onEdit={(a) => {
          setSelected(null);
          setEditing(a);
          setShowCreate(true);
        }}
      />
    </div>
  );
}
