"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Markdown } from "@/components/ui/markdown";
import { UserAvatar } from "@/components/ui/user-avatar";
import {
  Trash2,
  Send,
  Plus,
  Calendar,
  BookOpen,
  FlaskConical,
  CheckCircle2,
  Circle,
  Loader2,
  Pencil,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  deleteDecision,
  addDecisionComment,
  createTaskFromDecision,
} from "@/app/(app)/decisions/actions";
import type { DecisionWithRelations } from "./decision-log";
import type { User, Phase, Tag } from "@/types";

const statusBadge: Record<string, string> = {
  PROPOSED: "bg-amber-50 text-amber-600 border-amber-200/60",
  ACCEPTED: "bg-emerald-50 text-emerald-600 border-emerald-200/60",
  REVISITED: "bg-[#ff7c11]/10 text-[#ff7c11] border-[#ff7c11]/20",
};

const statusLabel: Record<string, string> = {
  PROPOSED: "Propuesta",
  ACCEPTED: "Aceptada",
  REVISITED: "Revisada",
};

const taskStatusIcon: Record<string, React.ReactNode> = {
  DONE: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />,
  IN_PROGRESS: <Circle className="w-3.5 h-3.5 text-blue-500 fill-blue-100" />,
  IN_REVIEW: <Circle className="w-3.5 h-3.5 text-purple-500 fill-purple-100" />,
  TODO: <Circle className="w-3.5 h-3.5 text-[#535766]" />,
};

const taskStatusLabel: Record<string, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  IN_REVIEW: "In Review",
  DONE: "Done",
};

export function DecisionDetailDrawer({
  decision,
  onClose,
  users,
  phases,
  tags,
  onUpdated,
  onDeleted,
  onEdit,
}: {
  decision: DecisionWithRelations | null;
  onClose: () => void;
  users: User[];
  phases: Phase[];
  tags: Tag[];
  onUpdated: (decision: DecisionWithRelations) => void;
  onDeleted: (id: string) => void;
  onEdit?: (decision: DecisionWithRelations) => void;
}) {
  const [comment, setComment] = useState("");
  const [sendingComment, setSendingComment] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskAssigneeId, setTaskAssigneeId] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [creatingTask, setCreatingTask] = useState(false);

  if (!decision) return null;

  async function handleStatusChange(value: string) {
    if (!decision) return;
    const res = await fetch(`/api/decisions/${decision.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: value }),
    });
    if (res.ok) {
      const updated = await res.json();
      onUpdated(updated);
    }
  }

  async function handleDelete() {
    if (!decision) return;
    if (!confirm("Eliminar esta decision?")) return;
    await deleteDecision(decision.id);
    onDeleted(decision.id);
  }

  async function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim() || !decision) return;
    setSendingComment(true);
    await addDecisionComment(decision.id, comment);
    const res = await fetch(`/api/decisions/${decision.id}`);
    if (res.ok) {
      const updated = await res.json();
      onUpdated(updated);
    }
    setComment("");
    setSendingComment(false);
  }

  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault();
    if (!taskTitle.trim() || !decision) return;
    setCreatingTask(true);
    try {
      await createTaskFromDecision(decision.id, {
        title: taskTitle,
        assigneeId: taskAssigneeId || undefined,
        dueDate: taskDueDate || undefined,
      });
      // Refetch decision to get updated tasks
      const res = await fetch(`/api/decisions/${decision.id}`);
      if (res.ok) {
        const updated = await res.json();
        onUpdated(updated);
      }
      setTaskTitle("");
      setTaskAssigneeId("");
      setTaskDueDate("");
      setShowTaskForm(false);
    } catch {
      // Error handling
    } finally {
      setCreatingTask(false);
    }
  }

  const hasOrigin = decision.meetingNote || decision.researchEntry || decision.experiment;

  return (
    <Sheet open={!!decision} onOpenChange={() => onClose()}>
      <SheetContent className="bg-[#f9f8f5] border-[#d3cfc6]/50 w-full sm:max-w-2xl p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-[#d3cfc6]/40">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <SheetTitle className="text-[#1a1c24] text-base font-semibold leading-snug">
                {decision.title}
              </SheetTitle>
            </div>
            <div className="flex items-center gap-1">
              {onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { onClose(); onEdit(decision); }}
                  className="text-[#535766] hover:text-[#ff7c11] hover:bg-[#ff7c11]/10 -mt-1"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="text-[#535766] hover:text-red-400 hover:bg-red-400/10 -mt-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-100px)]">
          <div className="px-6 space-y-5 pb-6">
            {/* Status */}
            <div>
              <label className="text-[10px] text-[#535766] uppercase tracking-wider block mb-1.5">
                Estado
              </label>
              <Select
                value={decision.status}
                onValueChange={(v) => handleStatusChange(v ?? "")}
              >
                <SelectTrigger className="h-8 text-xs bg-white border-[#d3cfc6] w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PROPOSED">Propuesta</SelectItem>
                  <SelectItem value="ACCEPTED">Aceptada</SelectItem>
                  <SelectItem value="REVISITED">Revisada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Origin section */}
            {hasOrigin && (
              <>
                <Separator className="bg-[#e9e7df]/80" />
                <div>
                  <label className="text-[10px] text-[#535766] uppercase tracking-wider block mb-2">
                    Origen
                  </label>
                  <div className="space-y-2">
                    {decision.meetingNote && (
                      <div className="flex items-center gap-2.5 rounded-lg border border-[#ff7c11]/20 bg-[#ff7c11]/[0.04] px-3 py-2.5">
                        <Calendar className="w-4 h-4 text-[#ff7c11] shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-[#1a1c24] truncate">
                            {decision.meetingNote.title}
                          </p>
                          <p className="text-[10px] text-[#535766]">
                            {format(new Date(decision.meetingNote.date), "d MMM yyyy", {
                              locale: es,
                            })}
                          </p>
                        </div>
                      </div>
                    )}

                    {decision.researchEntry && (
                      <div className="flex items-center gap-2.5 rounded-lg border border-[#9a4a00]/20 bg-[#9a4a00]/[0.04] px-3 py-2.5">
                        <BookOpen className="w-4 h-4 text-[#9a4a00] shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-[#1a1c24] truncate">
                            {decision.researchEntry.title}
                          </p>
                          <p className="text-[10px] text-[#535766]">
                            {decision.researchEntry.user.name}
                          </p>
                        </div>
                      </div>
                    )}

                    {decision.experiment && (
                      <div className="flex items-center gap-2.5 rounded-lg border border-cyan-200/60 bg-cyan-50 px-3 py-2.5">
                        <FlaskConical className="w-4 h-4 text-cyan-600 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-[#1a1c24] truncate">
                            {decision.experiment.name}
                          </p>
                          <p className="text-[10px] text-[#535766]">
                            {decision.experiment.status}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Context */}
            <Separator className="bg-[#e9e7df]/80" />
            <div>
              <label className="text-[10px] text-[#535766] uppercase tracking-wider block mb-2">
                Contexto
              </label>
              <div className="text-xs text-[#535766] leading-relaxed">
                <Markdown content={decision.context} />
              </div>
            </div>

            {/* Decision */}
            <div>
              <label className="text-[10px] text-[#535766] uppercase tracking-wider block mb-2">
                Decision
              </label>
              <div className="text-xs text-[#1a1c24] leading-relaxed font-medium">
                <Markdown content={decision.decision} />
              </div>
            </div>

            {/* Rationale */}
            <div>
              <label className="text-[10px] text-[#535766] uppercase tracking-wider block mb-2">
                Justificacion
              </label>
              <div className="text-xs text-[#535766] leading-relaxed">
                <Markdown content={decision.rationale} />
              </div>
            </div>

            {/* Alternatives */}
            {decision.alternatives && (
              <div>
                <label className="text-[10px] text-[#535766] uppercase tracking-wider block mb-2">
                  Alternativas consideradas
                </label>
                <div className="text-xs text-[#535766] leading-relaxed">
                  <Markdown content={decision.alternatives} />
                </div>
              </div>
            )}

            {/* Impact */}
            {decision.impact && (
              <div>
                <label className="text-[10px] text-[#535766] uppercase tracking-wider block mb-2">
                  Impacto
                </label>
                <div className="text-xs text-[#535766] leading-relaxed">
                  <Markdown content={decision.impact} />
                </div>
              </div>
            )}

            {/* Tasks from this decision */}
            <Separator className="bg-[#e9e7df]/80" />
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-[10px] text-[#535766] uppercase tracking-wider">
                  Tareas de esta decision ({decision.tasks?.length || 0})
                </label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTaskForm(!showTaskForm)}
                  className="h-6 px-2 text-[10px] text-[#ff7c11] hover:text-[#ff7c11] hover:bg-[#ff7c11]/10"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Crear tarea
                </Button>
              </div>

              {/* Inline task creation form */}
              {showTaskForm && (
                <form onSubmit={handleCreateTask} className="mb-3 p-3 bg-white rounded-lg border border-[#d3cfc6]/40 space-y-2.5">
                  <Input
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    placeholder="Titulo de la tarea..."
                    required
                    className="h-8 text-xs bg-white border-[#d3cfc6] text-[#383c48] placeholder:text-[#535766]/50 focus:border-[#ff7c11]"
                  />
                  <div className="flex gap-2">
                    <Select
                      value={taskAssigneeId}
                      onValueChange={(v) => setTaskAssigneeId(v ?? "")}
                    >
                      <SelectTrigger className="h-8 text-xs bg-white border-[#d3cfc6] flex-1">
                        <SelectValue placeholder="Asignar a..." />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="date"
                      value={taskDueDate}
                      onChange={(e) => setTaskDueDate(e.target.value)}
                      className="h-8 text-xs bg-white border-[#d3cfc6] w-36 text-[#383c48] focus:border-[#ff7c11]"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      size="sm"
                      disabled={!taskTitle.trim() || creatingTask}
                      className="h-7 px-3 text-[10px] bg-[#ff7c11] hover:bg-[#ff9a3e] text-white"
                    >
                      {creatingTask ? (
                        <Loader2 className="w-3 h-3 animate-spin mr-1" />
                      ) : null}
                      Crear
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowTaskForm(false)}
                      className="h-7 px-3 text-[10px] text-[#535766]"
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              )}

              {/* Task list */}
              {decision.tasks && decision.tasks.length > 0 ? (
                <div className="space-y-1.5">
                  {decision.tasks.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center gap-2.5 rounded-lg bg-white/60 border border-[#d3cfc6]/30 px-3 py-2"
                    >
                      {taskStatusIcon[t.status] || taskStatusIcon.TODO}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-[#1a1c24] truncate">{t.title}</p>
                        {t.assignees && t.assignees.length > 0 && (
                          <p className="text-[10px] text-[#535766]">{t.assignees.map((a: { name: string }) => a.name).join(", ")}</p>
                        )}
                      </div>
                      <Badge
                        variant="outline"
                        className="text-[9px] shrink-0 border-[#d3cfc6]/40 text-[#535766]"
                      >
                        {taskStatusLabel[t.status] || t.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                !showTaskForm && (
                  <p className="text-[10px] text-[#535766]/60">
                    No hay tareas vinculadas a esta decision
                  </p>
                )
              )}
            </div>

            {/* Comments */}
            <Separator className="bg-[#e9e7df]/80" />
            <div>
              <label className="text-[10px] text-[#535766] uppercase tracking-wider block mb-3">
                Comentarios ({decision.comments.length})
              </label>

              <div className="space-y-3 mb-4">
                {decision.comments.map((c) => (
                  <div key={c.id} className="flex gap-2.5">
                    <UserAvatar user={c.user} size="sm" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-medium text-[#383c48]">
                          {c.user.name}
                        </span>
                        <span className="text-[10px] text-[#535766]">
                          {format(new Date(c.createdAt), "dd/MM HH:mm")}
                        </span>
                      </div>
                      <p className="text-xs text-[#535766] mt-0.5 leading-relaxed">
                        {c.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add comment */}
              <form onSubmit={handleComment} className="flex gap-2">
                <Input
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Agregar comentario..."
                  className="flex-1 h-8 text-xs bg-white border-[#d3cfc6] text-[#383c48] placeholder:text-[#535766]/50 focus:border-[#ff7c11]"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={!comment.trim() || sendingComment}
                  className="h-8 px-3 bg-[#ff7c11] hover:bg-[#ff9a3e] text-white"
                >
                  <Send className="w-3 h-3" />
                </Button>
              </form>
            </div>

            {/* Metadata */}
            <Separator className="bg-[#e9e7df]/80" />
            <div className="text-[10px] text-[#535766] space-y-1">
              <p>Creado por {decision.madeBy.name}</p>
              <p>
                Creado{" "}
                {format(new Date(decision.createdAt), "dd/MM/yyyy HH:mm")}
              </p>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
