"use client";

import { useState, useCallback } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import {
  Plus,
  Filter,
  List,
  LayoutGrid,
  Users as UsersIcon,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { updateTaskStatus } from "@/app/(app)/tasks/actions";
import { TaskCard } from "./task-card";
import { CreateTaskDialog } from "./create-task-dialog";
import { TaskDetailSheet } from "./task-detail-sheet";
import { TaskFilters } from "./task-filters";
import type { Task, User, Phase, Tag, Comment } from "@/types";

export type TaskWithRelations = Task & {
  assignee: User | null;
  creator: User;
  tags: Tag[];
  phase: Phase | null;
  comments: (Comment & { user: User })[];
};

type ViewMode = "kanban" | "list" | "person";

const columns = [
  { id: "TODO", label: "To Do", color: "text-[#535766]" },
  { id: "IN_PROGRESS", label: "In Progress", color: "text-[#ff7c11]" },
  { id: "IN_REVIEW", label: "In Review", color: "text-amber-600" },
  { id: "DONE", label: "Done", color: "text-emerald-600" },
] as const;

export function TaskBoard({
  initialTasks,
  users,
  phases,
  tags,
}: {
  initialTasks: TaskWithRelations[];
  users: User[];
  phases: Phase[];
  tags: Tag[];
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [showCreate, setShowCreate] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskWithRelations | null>(null);
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    assigneeId: "",
    phaseId: "",
    priority: "",
    tagId: "",
  });

  const filteredTasks = tasks.filter((t) => {
    if (search && !t.title.toLowerCase().includes(search.toLowerCase()))
      return false;
    if (filters.assigneeId && t.assigneeId !== filters.assigneeId) return false;
    if (filters.phaseId && t.phaseId !== filters.phaseId) return false;
    if (filters.priority && t.priority !== filters.priority) return false;
    if (filters.tagId && !t.tags.some((tag) => tag.id === filters.tagId))
      return false;
    return true;
  });

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const onDragEnd = useCallback(
    async (result: DropResult) => {
      if (!result.destination) return;
      const { draggableId, destination } = result;
      const newStatus = destination.droppableId as Task["status"];

      setTasks((prev) =>
        prev.map((t) => (t.id === draggableId ? { ...t, status: newStatus } : t))
      );

      await updateTaskStatus(draggableId, newStatus);
    },
    []
  );

  const handleTaskCreated = (task: TaskWithRelations) => {
    setTasks((prev) => [task, ...prev]);
    setShowCreate(false);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#535766]" />
          <Input
            placeholder="Buscar tareas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 bg-[#f2f0ea]/60 border-[#d3cfc6] text-[#1a1c24] placeholder:text-[#535766]/50 text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Filter toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "h-9 text-xs border-[#d3cfc6] bg-white/40",
              showFilters && "bg-[#e9e7df]/80 border-[#d3cfc6]"
            )}
          >
            <Filter className="w-3.5 h-3.5 mr-1.5" />
            Filtros
            {activeFilterCount > 0 && (
              <Badge
                variant="secondary"
                className="ml-1.5 h-4 px-1.5 text-[10px] bg-[#ff7c11]/15 text-[#ff7c11]"
              >
                {activeFilterCount}
              </Badge>
            )}
          </Button>

          {/* View toggles */}
          <div className="flex items-center rounded-lg border border-[#d3cfc6] overflow-hidden">
            {[
              { mode: "kanban" as const, icon: LayoutGrid },
              { mode: "list" as const, icon: List },
              { mode: "person" as const, icon: UsersIcon },
            ].map(({ mode, icon: Icon }) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  "p-2 transition-colors",
                  viewMode === mode
                    ? "bg-[#e9e7df] text-[#1a1c24]"
                    : "text-[#535766] hover:text-[#535766]"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
              </button>
            ))}
          </div>

          {/* Create */}
          <Button
            size="sm"
            onClick={() => setShowCreate(true)}
            className="h-9 text-xs bg-[#ff7c11] hover:bg-[#ff9a3e] text-white"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Nueva tarea
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <TaskFilters
          filters={filters}
          onChange={setFilters}
          users={users}
          phases={phases}
          tags={tags}
        />
      )}

      {/* Content */}
      {viewMode === "kanban" && (
        <KanbanView
          tasks={filteredTasks}
          onDragEnd={onDragEnd}
          onSelectTask={setSelectedTask}
        />
      )}
      {viewMode === "list" && (
        <ListView tasks={filteredTasks} onSelectTask={setSelectedTask} />
      )}
      {viewMode === "person" && (
        <PersonView
          tasks={filteredTasks}
          users={users}
          onSelectTask={setSelectedTask}
        />
      )}

      {/* Create Dialog */}
      <CreateTaskDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        users={users}
        phases={phases}
        tags={tags}
        onCreated={handleTaskCreated}
      />

      {/* Detail Sheet */}
      <TaskDetailSheet
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        users={users}
        phases={phases}
        tags={tags}
        onUpdated={(updated) => {
          setTasks((prev) =>
            prev.map((t) => (t.id === updated.id ? updated : t))
          );
          setSelectedTask(updated);
        }}
        onDeleted={(id) => {
          setTasks((prev) => prev.filter((t) => t.id !== id));
          setSelectedTask(null);
        }}
      />
    </div>
  );
}

function KanbanView({
  tasks,
  onDragEnd,
  onSelectTask,
}: {
  tasks: TaskWithRelations[];
  onDragEnd: (result: DropResult) => void;
  onSelectTask: (task: TaskWithRelations) => void;
}) {
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {columns.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id);
          return (
            <div
              key={col.id}
              className="rounded-xl border border-[#d3cfc6]/40 bg-white/30 min-h-[200px]"
            >
              <div className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium ${col.color}`}>
                    {col.label}
                  </span>
                  <span className="text-[10px] text-[#535766] font-mono bg-[#e9e7df]/50 px-1.5 py-0.5 rounded">
                    {colTasks.length}
                  </span>
                </div>
              </div>
              <Droppable droppableId={col.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      "px-2 pb-2 space-y-2 min-h-[100px] transition-colors rounded-b-xl",
                      snapshot.isDraggingOver && "bg-white/40"
                    )}
                  >
                    {colTasks.map((task, index) => (
                      <Draggable
                        key={task.id}
                        draggableId={task.id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            onClick={() => onSelectTask(task)}
                          >
                            <TaskCard
                              task={task}
                              isDragging={snapshot.isDragging}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}

function ListView({
  tasks,
  onSelectTask,
}: {
  tasks: TaskWithRelations[];
  onSelectTask: (task: TaskWithRelations) => void;
}) {
  const priorityOrder = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  const sorted = [...tasks].sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
  );

  return (
    <div className="rounded-xl border border-[#d3cfc6]/50 overflow-hidden">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-[#d3cfc6]/50 bg-white/40">
            <th className="text-left px-4 py-3 text-[#535766] uppercase tracking-wider font-medium">
              Tarea
            </th>
            <th className="text-left px-4 py-3 text-[#535766] uppercase tracking-wider font-medium hidden sm:table-cell">
              Estado
            </th>
            <th className="text-left px-4 py-3 text-[#535766] uppercase tracking-wider font-medium hidden md:table-cell">
              Prioridad
            </th>
            <th className="text-left px-4 py-3 text-[#535766] uppercase tracking-wider font-medium hidden md:table-cell">
              Asignado
            </th>
            <th className="text-left px-4 py-3 text-[#535766] uppercase tracking-wider font-medium hidden lg:table-cell">
              Fase
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((task) => (
            <tr
              key={task.id}
              onClick={() => onSelectTask(task)}
              className="border-b border-[#d3cfc6]/40 hover:bg-white/40 cursor-pointer transition-colors"
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  {task.wbsCode && (
                    <span className="text-[10px] font-mono text-[#535766]">
                      {task.wbsCode}
                    </span>
                  )}
                  <span className="text-[#383c48] truncate max-w-xs">
                    {task.title}
                  </span>
                  {task.tags.length > 0 && (
                    <div className="flex gap-1 hidden lg:flex">
                      {task.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag.id}
                          className="px-1.5 py-0.5 rounded text-[9px]"
                          style={{
                            backgroundColor: tag.color + "20",
                            color: tag.color,
                          }}
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </td>
              <td className="px-4 py-3 hidden sm:table-cell">
                <StatusBadge status={task.status} />
              </td>
              <td className="px-4 py-3 hidden md:table-cell">
                <PriorityBadge priority={task.priority} />
              </td>
              <td className="px-4 py-3 text-[#535766] hidden md:table-cell">
                {task.assignee?.name || "—"}
              </td>
              <td className="px-4 py-3 text-[#535766] hidden lg:table-cell">
                {task.phase ? `F${task.phase.number}` : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PersonView({
  tasks,
  users,
  onSelectTask,
}: {
  tasks: TaskWithRelations[];
  users: User[];
  onSelectTask: (task: TaskWithRelations) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {users.map((user) => {
        const userTasks = tasks.filter((t) => t.assigneeId === user.id);
        return (
          <div
            key={user.id}
            className="rounded-xl border border-[#d3cfc6]/50 bg-white/40"
          >
            <div className="px-4 py-3 border-b border-[#d3cfc6]/40 flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-600/30 to-violet-600/30 flex items-center justify-center text-[10px] text-[#1a1c24] font-medium">
                {user.name[0]}
              </div>
              <span className="text-xs font-medium text-[#1a1c24]">
                {user.name}
              </span>
              <span className="text-[10px] text-[#535766] font-mono ml-auto">
                {userTasks.length}
              </span>
            </div>
            <div className="p-2 space-y-2">
              {userTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => onSelectTask(task)}
                  className="cursor-pointer"
                >
                  <TaskCard task={task} isDragging={false} />
                </div>
              ))}
              {userTasks.length === 0 && (
                <p className="text-[10px] text-[#535766] text-center py-4">
                  Sin tareas asignadas
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, string> = {
    TODO: "bg-zinc-500/10 text-[#535766]",
    IN_PROGRESS: "bg-blue-500/10 text-blue-400",
    IN_REVIEW: "bg-amber-500/10 text-amber-400",
    DONE: "bg-emerald-500/10 text-emerald-400",
  };
  const labels: Record<string, string> = {
    TODO: "To Do",
    IN_PROGRESS: "In Progress",
    IN_REVIEW: "In Review",
    DONE: "Done",
  };
  return (
    <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${config[status]}`}>
      {labels[status]}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const config: Record<string, string> = {
    LOW: "text-[#535766]",
    MEDIUM: "text-blue-400",
    HIGH: "text-amber-400",
    URGENT: "text-red-400",
  };
  return (
    <span className={`text-[10px] font-medium uppercase ${config[priority]}`}>
      {priority}
    </span>
  );
}
