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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Markdown } from "@/components/ui/markdown";
import { Trash2, Send, Calendar, FileText, ExternalLink, BookOpen } from "lucide-react";
import { getFileViewUrl } from "@/lib/file-url";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { deleteTask, addTaskComment } from "@/app/(app)/tasks/actions";
import type { TaskWithRelations } from "./task-board";
import type { User, Phase, Tag } from "@/types";

const statusLabels: Record<string, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  IN_REVIEW: "In Review",
  DONE: "Done",
};
const priorityLabels: Record<string, string> = {
  LOW: "Baja",
  MEDIUM: "Media",
  HIGH: "Alta",
  URGENT: "Urgente",
};

export function TaskDetailSheet({
  task,
  onClose,
  users,
  phases,
  onUpdated,
  onDeleted,
}: {
  task: TaskWithRelations | null;
  onClose: () => void;
  users: User[];
  phases: Phase[];
  tags: Tag[];
  onUpdated: (task: TaskWithRelations) => void;
  onDeleted: (id: string) => void;
}) {
  const [comment, setComment] = useState("");
  const [sendingComment, setSendingComment] = useState(false);

  if (!task) return null;

  const assigneeName = task.assignee?.name || users.find((u) => u.id === task.assigneeId)?.name || "Sin asignar";
  const phaseName = task.phase
    ? `F${task.phase.number}: ${task.phase.name}`
    : phases.find((p) => p.id === task.phaseId)
      ? `F${phases.find((p) => p.id === task.phaseId)!.number}: ${phases.find((p) => p.id === task.phaseId)!.name}`
      : "Sin fase";

  async function handleFieldChange(field: string, value: string | null) {
    if (!task) return;
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    if (res.ok) {
      const updated = await res.json();
      onUpdated(updated);
    }
  }

  async function handleDelete() {
    if (!task) return;
    if (!confirm("Eliminar esta tarea?")) return;
    await deleteTask(task.id);
    onDeleted(task.id);
  }

  async function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim() || !task) return;
    setSendingComment(true);
    await addTaskComment(task.id, comment);
    const res = await fetch(`/api/tasks/${task.id}`);
    if (res.ok) {
      const updated = await res.json();
      onUpdated(updated);
    }
    setComment("");
    setSendingComment(false);
  }

  return (
    <Sheet open={!!task} onOpenChange={() => onClose()}>
      <SheetContent className="bg-[#f9f8f5] border-[#d3cfc6]/50 w-full sm:max-w-lg p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-[#d3cfc6]/40">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {task.wbsCode && (
                <p className="text-[10px] font-mono text-[#535766] mb-1">
                  {task.wbsCode}
                </p>
              )}
              <SheetTitle className="text-[#1a1c24] text-base font-semibold leading-snug">
                {task.title}
              </SheetTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="text-[#535766] hover:text-red-400 hover:bg-red-400/10 -mt-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-100px)]">
          <div className="px-6 space-y-5 pb-6 pt-5">
            {/* Status & Priority */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-[#535766] uppercase tracking-wider block mb-1.5">
                  Estado
                </label>
                <Select
                  value={task.status}
                  onValueChange={(v) => handleFieldChange("status", v)}
                >
                  <SelectTrigger className="h-8 text-xs bg-white border-[#d3cfc6]">
                    <SelectValue>{statusLabels[task.status]}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODO">To Do</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="IN_REVIEW">In Review</SelectItem>
                    <SelectItem value="DONE">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[10px] text-[#535766] uppercase tracking-wider block mb-1.5">
                  Prioridad
                </label>
                <Select
                  value={task.priority}
                  onValueChange={(v) => handleFieldChange("priority", v)}
                >
                  <SelectTrigger className="h-8 text-xs bg-white border-[#d3cfc6]">
                    <SelectValue>{priorityLabels[task.priority]}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Baja</SelectItem>
                    <SelectItem value="MEDIUM">Media</SelectItem>
                    <SelectItem value="HIGH">Alta</SelectItem>
                    <SelectItem value="URGENT">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Assignee & Phase */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-[#535766] uppercase tracking-wider block mb-1.5">
                  Asignado a
                </label>
                <Select
                  value={task.assigneeId || "none"}
                  onValueChange={(v) =>
                    handleFieldChange("assigneeId", v === "none" ? null : v)
                  }
                >
                  <SelectTrigger className="h-8 text-xs bg-white border-[#d3cfc6]">
                    <SelectValue>{assigneeName}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin asignar</SelectItem>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[10px] text-[#535766] uppercase tracking-wider block mb-1.5">
                  Fase
                </label>
                <Select
                  value={task.phaseId || "none"}
                  onValueChange={(v) =>
                    handleFieldChange("phaseId", v === "none" ? null : v)
                  }
                >
                  <SelectTrigger className="h-8 text-xs bg-white border-[#d3cfc6]">
                    <SelectValue>{phaseName}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin fase</SelectItem>
                    {phases.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        F{p.number}: {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Due date */}
            {task.dueDate && (
              <div className="flex items-center gap-2 text-xs text-[#535766]">
                <Calendar className="w-3.5 h-3.5" />
                <span>
                  Fecha límite:{" "}
                  {format(new Date(task.dueDate), "d 'de' MMMM, yyyy", {
                    locale: es,
                  })}
                </span>
              </div>
            )}

            {/* Tags */}
            {task.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {task.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="px-2 py-0.5 rounded-md text-[10px] font-medium"
                    style={{
                      backgroundColor: tag.color + "15",
                      color: tag.color,
                    }}
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            )}

            {/* Linked Resource */}
            {task.resource && (
              <div className="rounded-xl bg-[#ff7c11]/[0.04] border border-[#ff7c11]/20 p-3">
                <label className="text-[9px] text-[#ff7c11] uppercase tracking-wider font-semibold block mb-1.5">
                  Recurso vinculado
                </label>
                <div className="flex items-center gap-2">
                  {task.resource.fileUrl ? (
                    <FileText className="w-3.5 h-3.5 text-[#ff7c11]" />
                  ) : (
                    <ExternalLink className="w-3.5 h-3.5 text-[#ff7c11]" />
                  )}
                  <a
                    href={task.resource.url || (task.resource.fileUrl ? getFileViewUrl(task.resource.fileUrl) : "#")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-[#1a1c24] hover:text-[#ff7c11] transition-colors"
                  >
                    {task.resource.name}
                  </a>
                </div>
              </div>
            )}

            {/* Linked Research */}
            {task.researchEntry && (
              <div className="rounded-xl bg-[#9a4a00]/[0.04] border border-[#9a4a00]/20 p-3">
                <label className="text-[9px] text-[#9a4a00] uppercase tracking-wider font-semibold block mb-1.5">
                  Research vinculado
                </label>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5 text-[#9a4a00]" />
                  <span className="text-xs font-medium text-[#1a1c24]">
                    {task.researchEntry.title}
                  </span>
                </div>
                {task.researchEntry.user && (
                  <p className="text-[9px] text-[#535766] mt-1 ml-5.5">
                    por {task.researchEntry.user.name}
                  </p>
                )}
              </div>
            )}

            {/* Description — rendered as Markdown */}
            {task.description && (
              <>
                <Separator className="bg-[#d3cfc6]/40" />
                <div>
                  <label className="text-[10px] text-[#535766] uppercase tracking-wider block mb-2">
                    Descripción
                  </label>
                  <div className="rounded-xl bg-white border border-[#d3cfc6]/30 p-4">
                    <Markdown content={task.description} />
                  </div>
                </div>
              </>
            )}

            {/* Comments */}
            <Separator className="bg-[#d3cfc6]/40" />
            <div>
              <label className="text-[10px] text-[#535766] uppercase tracking-wider block mb-3">
                Comentarios ({task.comments.length})
              </label>

              <div className="space-y-3 mb-4">
                {task.comments.map((c) => (
                  <div key={c.id} className="flex gap-2.5">
                    <Avatar className="w-6 h-6 shrink-0">
                      <AvatarFallback className="bg-[#e9e7df] text-[10px] text-[#535766]">
                        {c.user.name[0]}
                      </AvatarFallback>
                    </Avatar>
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
                  className="flex-1 h-8 text-xs bg-white border-[#d3cfc6] text-[#383c48] placeholder:text-[#535766]/50"
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
            <Separator className="bg-[#d3cfc6]/40" />
            <div className="text-[10px] text-[#535766] space-y-1">
              <p>Creado por {task.creator.name}</p>
              <p>
                Creado{" "}
                {format(new Date(task.createdAt), "dd/MM/yyyy HH:mm")}
              </p>
              <p>
                Actualizado{" "}
                {format(new Date(task.updatedAt), "dd/MM/yyyy HH:mm")}
              </p>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
