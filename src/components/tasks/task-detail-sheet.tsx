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
import { Markdown } from "@/components/ui/markdown";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Trash2, Send, Calendar, FileText, ExternalLink, BookOpen, Scale, Pencil, Check } from "lucide-react";
import { toast } from "sonner";
import { getFileViewUrl } from "@/lib/file-url";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { deleteTask, addTaskComment } from "@/app/(app)/tasks/actions";
import type { TaskWithRelations } from "./task-board";
import type { User, Phase, Tag, Decision } from "@/types";

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
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [editingDesc, setEditingDesc] = useState(false);
  const [descDraft, setDescDraft] = useState("");
  const [editingWbs, setEditingWbs] = useState(false);
  const [wbsDraft, setWbsDraft] = useState("");

  if (!task) return null;

  const assigneeNames = task.assignees.length > 0 ? task.assignees.map(a => a.name).join(", ") : "Sin asignar";
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

  async function handleAssigneesChange(userId: string) {
    if (!task) return;
    const currentIds = task.assignees.map(a => a.id);
    const newIds = currentIds.includes(userId)
      ? currentIds.filter(id => id !== userId)
      : [...currentIds, userId];
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assigneeIds: newIds }),
    });
    if (res.ok) {
      const updated = await res.json();
      onUpdated(updated);
    }
  }

  async function handleDelete() {
    if (!task) return;
    if (!confirm("Eliminar esta tarea?")) return;
    try {
      await deleteTask(task.id);
      onDeleted(task.id);
      toast.success("Tarea eliminada");
    } catch {
      toast.error("Error al eliminar tarea");
    }
  }

  async function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim() || !task) return;
    setSendingComment(true);
    try {
      await addTaskComment(task.id, comment);
      const res = await fetch(`/api/tasks/${task.id}`);
      if (res.ok) {
        const updated = await res.json();
        onUpdated(updated);
      }
      setComment("");
      toast.success("Comentario agregado");
    } catch {
      toast.error("Error al agregar comentario");
    } finally {
      setSendingComment(false);
    }
  }

  return (
    <Sheet open={!!task} onOpenChange={() => onClose()}>
      <SheetContent className="bg-[#f9f8f5] border-[#d3cfc6]/50 w-full sm:max-w-2xl p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-[#d3cfc6]/40">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              {/* Editable WBS */}
              <div className="flex items-center gap-1 mb-1 group/wbs">
                {editingWbs ? (
                  <form onSubmit={(e) => { e.preventDefault(); handleFieldChange("wbsCode", wbsDraft || null); setEditingWbs(false); }} className="flex items-center gap-1">
                    <input value={wbsDraft} onChange={(e) => setWbsDraft(e.target.value)} placeholder="1.2.3" autoFocus className="text-[10px] font-mono text-[#535766] bg-white border border-[#d3cfc6] rounded px-1.5 py-0.5 w-20 focus:border-[#ff7c11] focus:outline-none" onBlur={() => { handleFieldChange("wbsCode", wbsDraft || null); setEditingWbs(false); }} />
                  </form>
                ) : (
                  <button onClick={() => { setWbsDraft(task.wbsCode || ""); setEditingWbs(true); }} className="text-[10px] font-mono text-[#535766] hover:text-[#ff7c11] transition-colors">
                    {task.wbsCode || "Sin WBS"} <Pencil className="w-2 h-2 inline ml-0.5 opacity-0 group-hover/wbs:opacity-100" />
                  </button>
                )}
              </div>
              {/* Editable title */}
              {editingTitle ? (
                <form onSubmit={(e) => { e.preventDefault(); if (titleDraft.trim()) handleFieldChange("title", titleDraft); setEditingTitle(false); }}>
                  <input
                    value={titleDraft}
                    onChange={(e) => setTitleDraft(e.target.value)}
                    autoFocus
                    className="text-base font-semibold text-[#1a1c24] bg-white border border-[#d3cfc6] rounded-lg px-2 py-1 w-full focus:border-[#ff7c11] focus:outline-none focus:ring-1 focus:ring-[#ff7c11]/20"
                    onBlur={() => { if (titleDraft.trim()) handleFieldChange("title", titleDraft); setEditingTitle(false); }}
                  />
                </form>
              ) : (
                <SheetTitle
                  className="text-[#1a1c24] text-base font-semibold leading-snug cursor-pointer hover:text-[#ff7c11] transition-colors group/title"
                  onClick={() => { setTitleDraft(task.title); setEditingTitle(true); }}
                >
                  {task.title}
                  <Pencil className="w-3 h-3 inline ml-1.5 opacity-0 group-hover/title:opacity-100 text-[#535766]" />
                </SheetTitle>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="text-[#535766] hover:text-red-400 hover:bg-red-400/10 -mt-1 shrink-0"
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

            {/* Assignees & Phase */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-[#535766] uppercase tracking-wider block mb-1.5">
                  Asignados
                </label>
                <div className="space-y-1 rounded-lg border border-[#d3cfc6] bg-white p-1.5 max-h-[140px] overflow-y-auto">
                  {users.map(u => (
                    <label key={u.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[#e9e7df]/50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={task.assignees.some(a => a.id === u.id)}
                        onChange={() => handleAssigneesChange(u.id)}
                        className="rounded border-[#d3cfc6]"
                      />
                      <UserAvatar user={u} size="xs" />
                      <span className="text-xs text-[#383c48]">{u.name}</span>
                    </label>
                  ))}
                </div>
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

            {/* Due date — editable */}
            <div className="flex items-center gap-2 text-xs">
              <Calendar className="w-3.5 h-3.5 text-[#535766]" />
              <span className="text-[#535766]">Fecha límite:</span>
              <input
                type="date"
                value={task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : ""}
                onChange={(e) => handleFieldChange("dueDate", e.target.value || null)}
                className="text-xs bg-transparent border-none text-[#1a1c24] focus:outline-none cursor-pointer hover:text-[#ff7c11] transition-colors"
              />
            </div>
            {!task.dueDate && (
              <div className="flex items-center gap-2 text-xs text-[#535766]/50">
                <Calendar className="w-3.5 h-3.5" />
                <span>Sin fecha límite — click para agregar</span>
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

            {/* Linked Decision */}
            {task.decision && (
              <div className="rounded-xl bg-amber-50/60 border border-amber-200/60 p-3">
                <label className="text-[9px] text-amber-600 uppercase tracking-wider font-semibold block mb-1.5">
                  Decision vinculada
                </label>
                <div className="flex items-center gap-2">
                  <Scale className="w-3.5 h-3.5 text-amber-600" />
                  <span className="text-[11px] font-medium text-[#1a1c24]">
                    {task.decision.title}
                  </span>
                </div>
                <div className="mt-1.5 ml-5.5">
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${
                    task.decision.status === "ACCEPTED" ? "bg-emerald-100 text-emerald-700" :
                    task.decision.status === "REVISITED" ? "bg-orange-100 text-orange-700" :
                    "bg-amber-100 text-amber-700"
                  }`}>
                    {task.decision.status}
                  </span>
                </div>
              </div>
            )}

            {/* Description — editable, renders Markdown */}
            <Separator className="bg-[#d3cfc6]/40" />
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] text-[#535766] uppercase tracking-wider">
                  Descripción
                </label>
                <button
                  onClick={() => { setDescDraft(task.description || ""); setEditingDesc(!editingDesc); }}
                  className="text-[9px] text-[#535766] hover:text-[#ff7c11] transition-colors flex items-center gap-1"
                >
                  {editingDesc ? <><Check className="w-2.5 h-2.5" /> Listo</> : <><Pencil className="w-2.5 h-2.5" /> Editar</>}
                </button>
              </div>
              {editingDesc ? (
                <textarea
                  value={descDraft}
                  onChange={(e) => setDescDraft(e.target.value)}
                  onBlur={() => { handleFieldChange("description", descDraft || null); setEditingDesc(false); }}
                  rows={8}
                  autoFocus
                  placeholder={"# Título\n## Subtítulo\n**negrita**, *itálica*\n- lista"}
                  className="w-full rounded-xl bg-white border border-[#d3cfc6] p-4 text-sm font-mono text-[#383c48] placeholder:text-[#535766]/30 focus:border-[#ff7c11] focus:outline-none focus:ring-1 focus:ring-[#ff7c11]/20 resize-y"
                />
              ) : task.description ? (
                <div
                  className="rounded-xl bg-white border border-[#d3cfc6]/30 p-4 cursor-pointer hover:border-[#d3cfc6] transition-colors"
                  onClick={() => { setDescDraft(task.description || ""); setEditingDesc(true); }}
                >
                  <Markdown content={task.description} />
                </div>
              ) : (
                <button
                  onClick={() => { setDescDraft(""); setEditingDesc(true); }}
                  className="w-full rounded-xl border border-dashed border-[#d3cfc6] p-4 text-xs text-[#535766]/50 hover:border-[#ff7c11]/50 hover:text-[#ff7c11] transition-colors text-center"
                >
                  Click para agregar descripción (soporta Markdown)
                </button>
              )}
            </div>

            {/* Comments */}
            <Separator className="bg-[#d3cfc6]/40" />
            <div>
              <label className="text-[10px] text-[#535766] uppercase tracking-wider block mb-3">
                Comentarios ({task.comments.length})
              </label>

              <div className="space-y-3 mb-4">
                {task.comments.map((c) => (
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
