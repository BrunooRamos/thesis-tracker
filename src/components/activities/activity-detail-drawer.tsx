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
import { getFileViewUrl } from "@/lib/file-url";
import {
  Trash2,
  Send,
  Plus,
  Pencil,
  Loader2,
  Upload,
  X,
  Download,
  Check,
  Link as LinkIcon,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import {
  deleteActivity,
  addDeliverable,
  deleteDeliverable,
  addCriterion,
  toggleCriterion,
  updateCriterionText,
  deleteCriterion,
  linkTaskToActivity,
  addActivityComment,
} from "@/app/(app)/actividades/actions";
import type { ActivityWithRelations } from "./activities-page";
import { statusLabel } from "./activities-page";
import type { User, Phase, Task } from "@/types";

const statusBadge: Record<string, string> = {
  NOT_STARTED: "bg-[#e9e7df] text-[#535766] border-[#d3cfc6]/60",
  IN_PROGRESS: "bg-[#ff7c11]/10 text-[#ff7c11] border-[#ff7c11]/20",
  BLOCKED: "bg-red-50 text-red-600 border-red-200/60",
  DONE: "bg-emerald-50 text-emerald-600 border-emerald-200/60",
};

const taskStatusIcon: Record<string, React.ReactNode> = {
  DONE: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />,
  IN_PROGRESS: <Circle className="w-3.5 h-3.5 text-blue-500 fill-blue-100" />,
  IN_REVIEW: (
    <Circle className="w-3.5 h-3.5 text-purple-500 fill-purple-100" />
  ),
  TODO: <Circle className="w-3.5 h-3.5 text-[#535766]" />,
};

export function ActivityDetailDrawer({
  activity,
  onClose,
  users: _users,
  phases: _phases,
  onUpdated,
  onDeleted,
  onEdit,
}: {
  activity: ActivityWithRelations | null;
  onClose: () => void;
  users: User[];
  phases: Phase[];
  onUpdated: (activity: ActivityWithRelations) => void;
  onDeleted: (id: string) => void;
  onEdit: (activity: ActivityWithRelations) => void;
}) {
  const [comment, setComment] = useState("");
  const [sendingComment, setSendingComment] = useState(false);

  // Deliverable form
  const [showDeliverableForm, setShowDeliverableForm] = useState(false);
  const [delivTitle, setDelivTitle] = useState("");
  const [delivDesc, setDelivDesc] = useState("");
  const [delivFile, setDelivFile] = useState<File | null>(null);
  const [savingDeliverable, setSavingDeliverable] = useState(false);

  // Criterion
  const [newCriterion, setNewCriterion] = useState("");
  const [addingCriterion, setAddingCriterion] = useState(false);
  const [editingCriterionId, setEditingCriterionId] = useState<string | null>(
    null
  );
  const [editingCriterionText, setEditingCriterionText] = useState("");

  // Task linking
  const [linkingTaskId, setLinkingTaskId] = useState("");
  const [linkingAvailable, setLinkingAvailable] = useState<Task[] | null>(null);
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);

  void _users;
  void _phases;

  if (!activity) return null;

  async function refresh() {
    if (!activity) return;
    const res = await fetch(`/api/activities/${activity.id}`);
    if (res.ok) {
      const full = await res.json();
      onUpdated(full);
    }
  }

  async function handleStatusChange(value: string) {
    if (!activity) return;
    const res = await fetch(`/api/activities/${activity.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: value }),
    });
    if (res.ok) {
      const updated = await res.json();
      onUpdated(updated);
      toast.success("Estado actualizado");
    } else {
      toast.error("No se pudo actualizar el estado");
    }
  }

  async function handleDelete() {
    if (!activity) return;
    if (!confirm("¿Eliminar esta actividad?")) return;
    try {
      await deleteActivity(activity.id);
      onDeleted(activity.id);
    } catch {
      toast.error("Error al eliminar");
    }
  }

  async function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim() || !activity) return;
    setSendingComment(true);
    try {
      await addActivityComment(activity.id, comment);
      await refresh();
      setComment("");
      toast.success("Comentario agregado");
    } catch {
      toast.error("Error al agregar comentario");
    } finally {
      setSendingComment(false);
    }
  }

  async function handleAddDeliverable(e: React.FormEvent) {
    e.preventDefault();
    if (!activity || !delivTitle.trim()) return;
    setSavingDeliverable(true);
    try {
      let fileUrl: string | undefined;
      let fileName: string | undefined;
      let fileType: string | undefined;

      if (delivFile) {
        const fd = new FormData();
        fd.set("file", delivFile);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Error al subir archivo");
        }
        const data = await res.json();
        fileUrl = data.url;
        fileName = data.fileName;
        fileType = data.fileType;
      }

      await addDeliverable(activity.id, {
        title: delivTitle,
        description: delivDesc || null,
        fileUrl: fileUrl || null,
        fileName: fileName || null,
        fileType: fileType || null,
      });
      await refresh();
      setDelivTitle("");
      setDelivDesc("");
      setDelivFile(null);
      setShowDeliverableForm(false);
      toast.success("Entregable agregado");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Error al agregar entregable"
      );
    } finally {
      setSavingDeliverable(false);
    }
  }

  async function handleDeleteDeliverable(id: string) {
    try {
      await deleteDeliverable(id);
      await refresh();
      toast.success("Entregable eliminado");
    } catch {
      toast.error("Error al eliminar");
    }
  }

  async function handleAddCriterion(e: React.FormEvent) {
    e.preventDefault();
    if (!activity || !newCriterion.trim()) return;
    setAddingCriterion(true);
    try {
      await addCriterion(activity.id, newCriterion);
      await refresh();
      setNewCriterion("");
    } catch {
      toast.error("Error al agregar criterio");
    } finally {
      setAddingCriterion(false);
    }
  }

  async function handleToggleCriterion(id: string, done: boolean) {
    try {
      await toggleCriterion(id, done);
      await refresh();
    } catch {
      toast.error("Error al actualizar criterio");
    }
  }

  async function handleSaveCriterionEdit(id: string) {
    if (!editingCriterionText.trim()) {
      setEditingCriterionId(null);
      return;
    }
    try {
      await updateCriterionText(id, editingCriterionText);
      await refresh();
      setEditingCriterionId(null);
      setEditingCriterionText("");
    } catch {
      toast.error("Error al editar");
    }
  }

  async function handleDeleteCriterion(id: string) {
    try {
      await deleteCriterion(id);
      await refresh();
    } catch {
      toast.error("Error al eliminar criterio");
    }
  }

  async function openLinkForm() {
    setShowLinkForm(true);
    if (linkingAvailable === null) {
      setLoadingTasks(true);
      try {
        const res = await fetch("/api/tasks?unlinked=1");
        if (res.ok) {
          const all = await res.json();
          setLinkingAvailable(all as Task[]);
        } else {
          setLinkingAvailable([]);
        }
      } catch {
        setLinkingAvailable([]);
      } finally {
        setLoadingTasks(false);
      }
    }
  }

  async function handleLinkTask() {
    if (!activity || !linkingTaskId) return;
    try {
      await linkTaskToActivity(linkingTaskId, activity.id);
      await refresh();
      setLinkingTaskId("");
      setShowLinkForm(false);
      setLinkingAvailable(null); // refresh list next time
      toast.success("Tarea vinculada");
    } catch {
      toast.error("Error al vincular tarea");
    }
  }

  async function handleUnlinkTask(taskId: string) {
    try {
      await linkTaskToActivity(taskId, null);
      await refresh();
      setLinkingAvailable(null);
      toast.success("Tarea desvinculada");
    } catch {
      toast.error("Error al desvincular");
    }
  }

  const critTotal = activity.acceptanceCriteria.length;
  const critDone = activity.acceptanceCriteria.filter((c) => c.done).length;
  const critPct = critTotal > 0 ? (critDone / critTotal) * 100 : 0;

  const comments = activity.comments ?? [];

  return (
    <Sheet open={!!activity} onOpenChange={() => onClose()}>
      <SheetContent className="bg-[#f9f8f5] border-[#d3cfc6]/50 w-full sm:max-w-2xl p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-[#d3cfc6]/40">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono bg-[#e9e7df] text-[#535766] px-1.5 py-0.5 rounded border border-[#d3cfc6]/40">
                  {activity.wbsCode}
                </span>
                <Badge
                  variant="outline"
                  className={`text-[10px] ${statusBadge[activity.status]}`}
                >
                  {statusLabel[activity.status]}
                </Badge>
              </div>
              <SheetTitle className="text-[#1a1c24] text-base font-semibold leading-snug">
                {activity.name}
              </SheetTitle>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(activity)}
                className="text-[#535766] hover:text-[#ff7c11] hover:bg-[#ff7c11]/10 -mt-1"
              >
                <Pencil className="w-3.5 h-3.5" />
              </Button>
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
            {/* Meta row */}
            <div className="pt-5 grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-[#535766] uppercase tracking-wider block mb-1.5">
                  Estado
                </label>
                <Select
                  value={activity.status}
                  onValueChange={(v) => handleStatusChange(v ?? "")}
                >
                  <SelectTrigger className="h-8 text-xs bg-white border-[#d3cfc6]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NOT_STARTED">Sin iniciar</SelectItem>
                    <SelectItem value="IN_PROGRESS">En curso</SelectItem>
                    <SelectItem value="BLOCKED">Bloqueada</SelectItem>
                    <SelectItem value="DONE">Completada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[10px] text-[#535766] uppercase tracking-wider block mb-1.5">
                  Fase
                </label>
                <div className="h-8 flex items-center text-xs text-[#383c48]">
                  Fase {activity.phase.number} · {activity.phase.name}
                </div>
              </div>
              <div>
                <label className="text-[10px] text-[#535766] uppercase tracking-wider block mb-1.5">
                  Fechas
                </label>
                <div className="h-8 flex items-center text-xs text-[#383c48]">
                  {activity.startDate
                    ? format(new Date(activity.startDate), "d MMM", {
                        locale: es,
                      })
                    : "—"}
                  {" → "}
                  {activity.endDate
                    ? format(new Date(activity.endDate), "d MMM yyyy", {
                        locale: es,
                      })
                    : "—"}
                </div>
              </div>
              <div>
                <label className="text-[10px] text-[#535766] uppercase tracking-wider block mb-1.5">
                  Responsables
                </label>
                <div className="h-8 flex items-center">
                  {activity.owners.length === 0 ? (
                    <span className="text-xs text-[#535766]/60">
                      Sin responsable
                    </span>
                  ) : (
                    <div className="flex -space-x-2">
                      {activity.owners.map((o) => (
                        <UserAvatar
                          key={o.id}
                          user={o}
                          size="xs"
                          className="ring-2 ring-[#f9f8f5]"
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            <Separator className="bg-[#e9e7df]/80" />
            <div>
              <label className="text-[10px] text-[#535766] uppercase tracking-wider block mb-2">
                Descripción
              </label>
              {activity.description ? (
                <div className="text-xs text-[#535766] leading-relaxed">
                  <Markdown content={activity.description} />
                </div>
              ) : (
                <div className="border border-dashed border-[#d3cfc6]/60 rounded-lg px-3 py-4 text-center text-[10px] text-[#535766]/60">
                  Sin descripción
                </div>
              )}
            </div>

            {/* Deliverables */}
            <Separator className="bg-[#e9e7df]/80" />
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-[10px] text-[#535766] uppercase tracking-wider">
                  Entregables ({activity.deliverables.length})
                </label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDeliverableForm(!showDeliverableForm)}
                  className="h-6 px-2 text-[10px] text-[#ff7c11] hover:text-[#ff7c11] hover:bg-[#ff7c11]/10"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Agregar entregable
                </Button>
              </div>

              {showDeliverableForm && (
                <form
                  onSubmit={handleAddDeliverable}
                  className="mb-3 p-3 bg-white rounded-lg border border-[#d3cfc6]/40 space-y-2.5"
                >
                  <Input
                    value={delivTitle}
                    onChange={(e) => setDelivTitle(e.target.value)}
                    placeholder="Título del entregable..."
                    required
                    className="h-8 text-xs bg-white border-[#d3cfc6] text-[#383c48] placeholder:text-[#535766]/50 focus:border-[#ff7c11]"
                  />
                  <Input
                    value={delivDesc}
                    onChange={(e) => setDelivDesc(e.target.value)}
                    placeholder="Descripción (opcional)"
                    className="h-8 text-xs bg-white border-[#d3cfc6] text-[#383c48] placeholder:text-[#535766]/50 focus:border-[#ff7c11]"
                  />
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 text-[10px] text-[#535766] cursor-pointer border border-[#d3cfc6] rounded-md px-2.5 py-1.5 hover:bg-[#f9f8f5]">
                      <Upload className="w-3 h-3" />
                      {delivFile ? delivFile.name : "Adjuntar archivo"}
                      <input
                        type="file"
                        onChange={(e) =>
                          setDelivFile(e.target.files?.[0] || null)
                        }
                        className="hidden"
                      />
                    </label>
                    {delivFile && (
                      <button
                        type="button"
                        onClick={() => setDelivFile(null)}
                        className="text-[#535766] hover:text-red-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      size="sm"
                      disabled={!delivTitle.trim() || savingDeliverable}
                      className="h-7 px-3 text-[10px] bg-[#ff7c11] hover:bg-[#ff9a3e] text-white"
                    >
                      {savingDeliverable ? (
                        <Loader2 className="w-3 h-3 animate-spin mr-1" />
                      ) : null}
                      Guardar
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowDeliverableForm(false)}
                      className="h-7 px-3 text-[10px] text-[#535766]"
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              )}

              {activity.deliverables.length === 0 ? (
                !showDeliverableForm && (
                  <p className="text-[10px] text-[#535766]/60">
                    No hay entregables registrados
                  </p>
                )
              ) : (
                <div className="space-y-1.5">
                  {activity.deliverables.map((d) => (
                    <div
                      key={d.id}
                      className="flex items-start gap-2.5 rounded-lg bg-white/60 border border-[#d3cfc6]/30 px-3 py-2"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-[#1a1c24] font-medium">
                          {d.title}
                        </p>
                        {d.description && (
                          <p className="text-[10px] text-[#535766] mt-0.5">
                            {d.description}
                          </p>
                        )}
                        {d.fileUrl && (
                          <a
                            href={getFileViewUrl(d.fileUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 inline-flex items-center gap-1 text-[10px] text-[#ff7c11] hover:underline"
                          >
                            <Download className="w-3 h-3" />
                            {d.fileName || "Descargar"}
                          </a>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteDeliverable(d.id)}
                        className="text-[#535766] hover:text-red-500 shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Acceptance criteria */}
            <Separator className="bg-[#e9e7df]/80" />
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] text-[#535766] uppercase tracking-wider">
                  Criterios de aceptación
                </label>
                <span className="text-[10px] text-[#535766]">
                  {critDone}/{critTotal} completados
                </span>
              </div>
              {critTotal > 0 && (
                <div className="h-1 bg-[#e9e7df] rounded-full overflow-hidden mb-3">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${critPct}%` }}
                  />
                </div>
              )}

              <div className="space-y-1.5 mb-2">
                {activity.acceptanceCriteria.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-start gap-2 rounded-lg bg-white/60 border border-[#d3cfc6]/30 px-3 py-2"
                  >
                    <input
                      type="checkbox"
                      checked={c.done}
                      onChange={(e) =>
                        handleToggleCriterion(c.id, e.target.checked)
                      }
                      className="mt-0.5 w-3.5 h-3.5 accent-[#ff7c11]"
                    />
                    <div className="flex-1 min-w-0">
                      {editingCriterionId === c.id ? (
                        <div className="flex items-center gap-1.5">
                          <Input
                            value={editingCriterionText}
                            onChange={(e) =>
                              setEditingCriterionText(e.target.value)
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleSaveCriterionEdit(c.id);
                              }
                              if (e.key === "Escape") {
                                setEditingCriterionId(null);
                              }
                            }}
                            autoFocus
                            className="h-7 text-xs bg-white border-[#d3cfc6]"
                          />
                          <button
                            onClick={() => handleSaveCriterionEdit(c.id)}
                            className="text-emerald-600 hover:text-emerald-700"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingCriterionId(c.id);
                            setEditingCriterionText(c.text);
                          }}
                          className={`text-left text-xs w-full ${
                            c.done
                              ? "line-through text-[#535766]/60"
                              : "text-[#383c48]"
                          }`}
                        >
                          {c.text}
                        </button>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteCriterion(c.id)}
                      className="text-[#535766] hover:text-red-500 shrink-0"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddCriterion} className="flex gap-2">
                <Input
                  value={newCriterion}
                  onChange={(e) => setNewCriterion(e.target.value)}
                  placeholder="Agregar criterio..."
                  className="flex-1 h-8 text-xs bg-white border-[#d3cfc6] text-[#383c48] placeholder:text-[#535766]/50 focus:border-[#ff7c11]"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={!newCriterion.trim() || addingCriterion}
                  className="h-8 px-3 text-[10px] bg-[#ff7c11] hover:bg-[#ff9a3e] text-white"
                >
                  {addingCriterion ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Plus className="w-3 h-3" />
                  )}
                </Button>
              </form>
            </div>

            {/* Linked tasks */}
            <Separator className="bg-[#e9e7df]/80" />
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-[10px] text-[#535766] uppercase tracking-wider">
                  Tareas vinculadas ({activity.tasks.length})
                </label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (showLinkForm) setShowLinkForm(false);
                    else openLinkForm();
                  }}
                  className="h-6 px-2 text-[10px] text-[#ff7c11] hover:text-[#ff7c11] hover:bg-[#ff7c11]/10"
                >
                  <LinkIcon className="w-3 h-3 mr-1" />
                  Vincular tarea
                </Button>
              </div>

              {showLinkForm && (
                <div className="mb-3 p-3 bg-white rounded-lg border border-[#d3cfc6]/40 space-y-2">
                  {loadingTasks ? (
                    <div className="flex items-center gap-2 text-[10px] text-[#535766]">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Cargando tareas...
                    </div>
                  ) : linkingAvailable && linkingAvailable.length > 0 ? (
                    <div className="flex gap-2">
                      <Select
                        value={linkingTaskId}
                        onValueChange={(v) => setLinkingTaskId(v ?? "")}
                      >
                        <SelectTrigger className="h-8 text-xs bg-white border-[#d3cfc6] flex-1">
                          <SelectValue placeholder="Seleccionar tarea..." />
                        </SelectTrigger>
                        <SelectContent>
                          {linkingAvailable.map((t) => (
                            <SelectItem key={t.id} value={t.id}>
                              {t.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        size="sm"
                        disabled={!linkingTaskId}
                        onClick={handleLinkTask}
                        className="h-8 px-3 text-[10px] bg-[#ff7c11] hover:bg-[#ff9a3e] text-white"
                      >
                        Vincular
                      </Button>
                    </div>
                  ) : (
                    <p className="text-[10px] text-[#535766]/60">
                      No hay tareas libres disponibles.
                    </p>
                  )}
                </div>
              )}

              {activity.tasks.length === 0 ? (
                <p className="text-[10px] text-[#535766]/60">
                  No hay tareas vinculadas.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {activity.tasks.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center gap-2.5 rounded-lg bg-white/60 border border-[#d3cfc6]/30 px-3 py-2"
                    >
                      {taskStatusIcon[t.status] || taskStatusIcon.TODO}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-[#1a1c24] truncate">
                          {t.title}
                        </p>
                      </div>
                      {t.assignees && t.assignees.length > 0 && (
                        <div className="flex -space-x-1.5 shrink-0">
                          {t.assignees.map((a) => (
                            <UserAvatar
                              key={a.id}
                              user={a}
                              size="xs"
                              className="ring-2 ring-white"
                            />
                          ))}
                        </div>
                      )}
                      <button
                        onClick={() => handleUnlinkTask(t.id)}
                        className="text-[#535766] hover:text-red-500 shrink-0"
                        title="Desvincular"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Comments */}
            <Separator className="bg-[#e9e7df]/80" />
            <div>
              <label className="text-[10px] text-[#535766] uppercase tracking-wider block mb-3">
                Comentarios ({comments.length})
              </label>

              <div className="space-y-3 mb-4">
                {comments.map((c) => (
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
              <p>
                Creado{" "}
                {format(new Date(activity.createdAt), "dd/MM/yyyy HH:mm")}
              </p>
              <p>
                Actualizado{" "}
                {format(new Date(activity.updatedAt), "dd/MM/yyyy HH:mm")}
              </p>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
