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
import { Loader2, Plus } from "lucide-react";
import { createTask } from "@/app/(app)/tasks/actions";
import type { User, Phase, Tag } from "@/types";
import type { TaskWithRelations } from "./task-board";

export function CreateTaskDialog({
  open,
  onOpenChange,
  users,
  phases,
  tags,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  users: User[];
  phases: Phase[];
  tags: Tag[];
  onCreated: (task: TaskWithRelations) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [phaseId, setPhaseId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [wbsCode, setWbsCode] = useState("");

  function resetForm() {
    setTitle("");
    setDescription("");
    setAssigneeId("");
    setPriority("MEDIUM");
    setPhaseId("");
    setDueDate("");
    setWbsCode("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.set("title", title);
    if (description) formData.set("description", description);
    if (assigneeId) formData.set("assigneeId", assigneeId);
    formData.set("priority", priority);
    if (phaseId) formData.set("phaseId", phaseId);
    if (dueDate) formData.set("dueDate", dueDate);
    if (wbsCode) formData.set("wbsCode", wbsCode);

    try {
      const task = await createTask(formData);
      const res = await fetch(`/api/tasks/${task.id}`);
      if (res.ok) {
        const fullTask = await res.json();
        onCreated(fullTask);
        resetForm();
      } else {
        setError("Error al obtener la tarea creada");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al crear la tarea";
      setError(msg);
      console.error("Error creating task:", err);
    } finally {
      setLoading(false);
    }
  }

  const selectedUser = users.find((u) => u.id === assigneeId);
  const selectedPhase = phases.find((p) => p.id === phaseId);
  const priorityLabels: Record<string, string> = {
    LOW: "Baja",
    MEDIUM: "Media",
    HIGH: "Alta",
    URGENT: "Urgente",
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-[#f9f8f5] border-[#d3cfc6]/50 w-full sm:max-w-md p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-[#d3cfc6]/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#ff7c11]/10 flex items-center justify-center">
              <Plus className="w-4 h-4 text-[#ff7c11]" />
            </div>
            <SheetTitle className="text-[#1a1c24] text-sm font-semibold">
              Nueva Tarea
            </SheetTitle>
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-80px)]">
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
            <div className="space-y-1.5">
              <Label className="text-[#535766] text-xs font-medium">Título *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Nombre de la tarea"
                className="h-10 bg-white border-[#d3cfc6] text-[#383c48] placeholder:text-[#535766]/40 text-sm focus:border-[#ff7c11] focus:ring-[#ff7c11]/20"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[#535766] text-xs font-medium">Descripción</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descripción opcional..."
                rows={3}
                className="bg-white border-[#d3cfc6] text-[#383c48] placeholder:text-[#535766]/40 text-sm resize-none focus:border-[#ff7c11] focus:ring-[#ff7c11]/20"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[#535766] text-xs font-medium">Asignar a</Label>
                <Select value={assigneeId || undefined} onValueChange={(v) => setAssigneeId(v ?? "")}>
                  <SelectTrigger className="h-10 bg-white border-[#d3cfc6] text-sm">
                    <SelectValue placeholder="Sin asignar">
                      {selectedUser?.name || "Sin asignar"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#535766] text-xs font-medium">Prioridad</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v ?? "MEDIUM")}>
                  <SelectTrigger className="h-10 bg-white border-[#d3cfc6] text-sm">
                    <SelectValue>
                      {priorityLabels[priority]}
                    </SelectValue>
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

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[#535766] text-xs font-medium">Fase</Label>
                <Select value={phaseId || undefined} onValueChange={(v) => setPhaseId(v ?? "")}>
                  <SelectTrigger className="h-10 bg-white border-[#d3cfc6] text-sm">
                    <SelectValue placeholder="Sin fase">
                      {selectedPhase ? `F${selectedPhase.number}: ${selectedPhase.name}` : "Sin fase"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {phases.map((p) => (
                      <SelectItem key={p.id} value={p.id}>F{p.number}: {p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#535766] text-xs font-medium">Fecha límite</Label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="h-10 bg-white border-[#d3cfc6] text-[#383c48] text-sm focus:border-[#ff7c11] focus:ring-[#ff7c11]/20"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[#535766] text-xs font-medium">Código WBS</Label>
              <Input
                value={wbsCode}
                onChange={(e) => setWbsCode(e.target.value)}
                placeholder="ej: 1.2.3"
                className="h-10 bg-white border-[#d3cfc6] text-[#383c48] placeholder:text-[#535766]/40 text-sm focus:border-[#ff7c11] focus:ring-[#ff7c11]/20"
              />
            </div>

            {error && (
              <p className="text-red-500 text-xs bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            <div className="flex gap-2 pt-3 border-t border-[#d3cfc6]/40">
              <Button
                type="button"
                variant="outline"
                onClick={() => { resetForm(); onOpenChange(false); }}
                className="flex-1 h-10 text-sm border-[#d3cfc6] text-[#535766] hover:bg-[#e9e7df]/50"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading || !title.trim()}
                className="flex-1 h-10 text-sm bg-[#ff7c11] hover:bg-[#ff9a3e] text-white rounded-full"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Crear tarea"}
              </Button>
            </div>
          </form>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
