"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Loader2, ListTodo } from "lucide-react";
import { createTask } from "@/app/(app)/tasks/actions";
import type { User, Phase, Tag } from "@/types";
import type { ResourceWithRelations } from "./resource-detail-sheet";

export function CreateTaskFromResourceDrawer({
  resource,
  users,
  phases,
  tags,
  open,
  onOpenChange,
  onCreated,
}: {
  resource: ResourceWithRelations | null;
  users: User[];
  phases: Phase[];
  tags: Tag[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}) {
  const resourceUrl = resource?.url || resource?.fileUrl || "";
  const defaultTitle = resource ? `Estudiar: ${resource.name}` : "";
  const defaultDescription = resource
    ? `**Recurso:** [${resource.name}](${resourceUrl})\n\nNotas del estudio:\n\n`
    : "";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [title, setTitle] = useState(defaultTitle);
  const [description, setDescription] = useState(defaultDescription);
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [priority, setPriority] = useState("MEDIUM");
  const [phaseId, setPhaseId] = useState("");
  const [dueDate, setDueDate] = useState("");

  // Re-sync defaults when resource changes
  const [prevResourceId, setPrevResourceId] = useState(resource?.id);
  if (resource && resource.id !== prevResourceId) {
    setPrevResourceId(resource.id);
    const url = resource.url || resource.fileUrl || "";
    setTitle(`Estudiar: ${resource.name}`);
    setDescription(
      `**Recurso:** [${resource.name}](${url})\n\nNotas del estudio:\n\n`
    );
    setAssigneeIds([]);
    setPriority("MEDIUM");
    setPhaseId("");
    setDueDate("");
    setError("");
  }

  const selectedPhase = phases.find((p) => p.id === phaseId);

  function toggleAssignee(userId: string) {
    setAssigneeIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  }
  const priorityLabels: Record<string, string> = {
    LOW: "Baja",
    MEDIUM: "Media",
    HIGH: "Alta",
    URGENT: "Urgente",
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !resource) return;
    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.set("title", title);
    if (description) formData.set("description", description);
    if (assigneeIds.length > 0) formData.set("assigneeIds", assigneeIds.join(","));
    formData.set("priority", priority);
    if (phaseId) formData.set("phaseId", phaseId);
    if (dueDate) formData.set("dueDate", dueDate);
    formData.set("resourceId", resource.id);

    try {
      await createTask(formData);
      onCreated();
      onOpenChange(false);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Error al crear la tarea";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-[#f9f8f5] border-[#d3cfc6]/50 w-full sm:max-w-2xl p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-[#d3cfc6]/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#ff7c11]/10 flex items-center justify-center">
              <ListTodo className="w-4 h-4 text-[#ff7c11]" />
            </div>
            <SheetTitle className="text-[#1a1c24] text-sm font-semibold">
              Crear tarea de estudio
            </SheetTitle>
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-80px)]">
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
            {/* Resource badge */}
            {resource && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/60 border border-[#d3cfc6]/40">
                <ListTodo className="w-3.5 h-3.5 text-[#535766] shrink-0" />
                <span className="text-[10px] text-[#535766]">Recurso:</span>
                <span className="text-xs text-[#383c48] font-medium truncate">
                  {resource.name}
                </span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-[#535766] text-xs font-medium">
                Titulo *
              </Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Nombre de la tarea"
                className="h-10 bg-white border-[#d3cfc6] text-[#383c48] placeholder:text-[#535766]/40 text-sm focus:border-[#ff7c11] focus:ring-[#ff7c11]/20"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-[#535766] text-xs font-medium">
                  Descripcion
                </Label>
                <span className="text-[9px] text-[#535766]/50">
                  Soporta Markdown
                </span>
              </div>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={
                  "# Titulo\n## Subtitulo\n**negrita**, *italica*\n- lista\n`codigo`"
                }
                rows={5}
                className="bg-white border-[#d3cfc6] text-[#383c48] placeholder:text-[#535766]/40 text-sm font-mono focus:border-[#ff7c11] focus:ring-[#ff7c11]/20"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[#535766] text-xs font-medium">
                  Asignar a
                </Label>
                <div className="space-y-1 rounded-lg border border-[#d3cfc6] bg-white p-1.5 max-h-[120px] overflow-y-auto">
                  {users.map(u => (
                    <label key={u.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[#e9e7df]/50 cursor-pointer">
                      <input type="checkbox" checked={assigneeIds.includes(u.id)} onChange={() => toggleAssignee(u.id)} className="rounded border-[#d3cfc6]" />
                      <UserAvatar user={u} size="xs" />
                      <span className="text-xs text-[#383c48]">{u.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#535766] text-xs font-medium">
                  Prioridad
                </Label>
                <Select
                  value={priority}
                  onValueChange={(v) => setPriority(v ?? "MEDIUM")}
                >
                  <SelectTrigger className="h-10 bg-white border-[#d3cfc6] text-sm">
                    <SelectValue>{priorityLabels[priority]}</SelectValue>
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

            <div className="space-y-1.5">
              <Label className="text-[#535766] text-xs font-medium">Fase</Label>
              <Select
                value={phaseId || undefined}
                onValueChange={(v) => setPhaseId(v ?? "")}
              >
                <SelectTrigger className="h-10 bg-white border-[#d3cfc6] text-sm">
                  <SelectValue placeholder="Sin fase">
                    {selectedPhase
                      ? `F${selectedPhase.number}: ${selectedPhase.name}`
                      : "Sin fase"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {phases.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      F{p.number}: {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[#535766] text-xs font-medium">
                Fecha limite
              </Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="h-10 bg-white border-[#d3cfc6] text-[#383c48] text-sm focus:border-[#ff7c11] focus:ring-[#ff7c11]/20"
              />
            </div>

            {error && (
              <p className="text-red-500 text-xs bg-red-50 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <div className="flex gap-2 pt-3 border-t border-[#d3cfc6]/40">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1 h-10 text-sm border-[#d3cfc6] text-[#535766] hover:bg-[#e9e7df]/50"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading || !title.trim()}
                className="flex-1 h-10 text-sm bg-[#ff7c11] hover:bg-[#ff9a3e] text-white rounded-full"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Crear tarea"
                )}
              </Button>
            </div>
          </form>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
