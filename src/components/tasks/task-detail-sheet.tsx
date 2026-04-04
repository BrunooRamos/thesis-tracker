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
import { Textarea } from "@/components/ui/textarea";
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
import { Trash2, Send, Calendar } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { updateTask, deleteTask, addTaskComment } from "@/app/(app)/tasks/actions";
import type { TaskWithRelations } from "./task-board";
import type { User, Phase, Tag } from "@/types";

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
    // Refetch task
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
          <div className="px-6 space-y-5 pb-6">
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
                    <SelectValue />
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
                    <SelectValue />
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
                    <SelectValue />
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
                    <SelectValue />
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

            {/* Description */}
            {task.description && (
              <>
                <Separator className="bg-[#e9e7df]/80" />
                <div>
                  <label className="text-[10px] text-[#535766] uppercase tracking-wider block mb-2">
                    Descripción
                  </label>
                  <p className="text-xs text-[#535766] leading-relaxed whitespace-pre-wrap">
                    {task.description}
                  </p>
                </div>
              </>
            )}

            {/* Comments */}
            <Separator className="bg-[#e9e7df]/80" />
            <div>
              <label className="text-[10px] text-[#535766] uppercase tracking-wider block mb-3">
                Comentarios ({task.comments.length})
              </label>

              <div className="space-y-3 mb-4">
                {task.comments.map((c) => (
                  <div key={c.id} className="flex gap-2.5">
                    <Avatar className="w-6 h-6 shrink-0">
                      <AvatarFallback className="bg-[#e9e7df]/80 text-[10px] text-[#535766]">
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
            <Separator className="bg-[#e9e7df]/80" />
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
