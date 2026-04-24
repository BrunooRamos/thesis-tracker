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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  createActivity,
  updateActivity,
} from "@/app/(app)/actividades/actions";
import type { ActivityWithRelations } from "./activities-page";
import type { User, Phase, ActivityStatus } from "@/types";

const MAX_OWNERS = 3;

export function CreateActivityDrawer({
  open,
  onOpenChange,
  users,
  phases,
  onCreated,
  editingItem,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  users: User[];
  phases: Phase[];
  onCreated: (activity: ActivityWithRelations) => void;
  editingItem?: ActivityWithRelations | null;
}) {
  const isEditing = !!editingItem;
  const [loading, setLoading] = useState(false);

  const toDateInput = (d: Date | string | null | undefined) => {
    if (!d) return "";
    const date = typeof d === "string" ? new Date(d) : d;
    if (isNaN(date.getTime())) return "";
    return date.toISOString().slice(0, 10);
  };

  const [wbsCode, setWbsCode] = useState(editingItem?.wbsCode || "");
  const [name, setName] = useState(editingItem?.name || "");
  const [description, setDescription] = useState(
    editingItem?.description || ""
  );
  const [phaseId, setPhaseId] = useState(editingItem?.phaseId || "");
  const [status, setStatus] = useState<ActivityStatus>(
    (editingItem?.status as ActivityStatus) || "NOT_STARTED"
  );
  const [startDate, setStartDate] = useState(
    toDateInput(editingItem?.startDate)
  );
  const [endDate, setEndDate] = useState(toDateInput(editingItem?.endDate));
  const [ownerIds, setOwnerIds] = useState<string[]>(
    editingItem?.owners.map((o) => o.id) || []
  );

  const [prevEditId, setPrevEditId] = useState(editingItem?.id);
  if (editingItem && editingItem.id !== prevEditId) {
    setPrevEditId(editingItem.id);
    setWbsCode(editingItem.wbsCode);
    setName(editingItem.name);
    setDescription(editingItem.description || "");
    setPhaseId(editingItem.phaseId);
    setStatus(editingItem.status as ActivityStatus);
    setStartDate(toDateInput(editingItem.startDate));
    setEndDate(toDateInput(editingItem.endDate));
    setOwnerIds(editingItem.owners.map((o) => o.id));
  }

  function resetForm() {
    setWbsCode("");
    setName("");
    setDescription("");
    setPhaseId("");
    setStatus("NOT_STARTED");
    setStartDate("");
    setEndDate("");
    setOwnerIds([]);
  }

  function toggleOwner(userId: string) {
    setOwnerIds((prev) => {
      if (prev.includes(userId)) return prev.filter((id) => id !== userId);
      if (prev.length >= MAX_OWNERS) return prev;
      return [...prev, userId];
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEditing && editingItem) {
        await updateActivity(editingItem.id, {
          wbsCode,
          name,
          description: description || null,
          phaseId,
          status,
          startDate: startDate || null,
          endDate: endDate || null,
          ownerIds,
        });
        const res = await fetch(`/api/activities/${editingItem.id}`);
        if (res.ok) {
          const full = await res.json();
          onCreated(full);
          toast.success("Actividad actualizada");
        }
      } else {
        const formData = new FormData();
        formData.set("wbsCode", wbsCode);
        formData.set("name", name);
        if (description) formData.set("description", description);
        formData.set("phaseId", phaseId);
        formData.set("status", status);
        if (startDate) formData.set("startDate", startDate);
        if (endDate) formData.set("endDate", endDate);
        if (ownerIds.length > 0)
          formData.set("ownerIds", ownerIds.join(","));

        const created = await createActivity(formData);
        const res = await fetch(`/api/activities/${created.id}`);
        if (res.ok) {
          const full = await res.json();
          onCreated(full);
          toast.success("Actividad creada");
          resetForm();
        } else {
          onOpenChange(false);
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setLoading(false);
    }
  }

  const ownersFull = ownerIds.length >= MAX_OWNERS;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-[#f9f8f5] border-[#d3cfc6]/50 w-full sm:max-w-2xl p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-[#d3cfc6]/40">
          <SheetTitle className="text-[#1a1c24] text-base font-semibold">
            {isEditing ? "Editar actividad" : "Nueva actividad"}
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-100px)]">
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            <div className="grid grid-cols-[120px_1fr] gap-3">
              <div>
                <Label className="text-[10px] text-[#535766] uppercase tracking-wider">
                  Código WBS *
                </Label>
                <Input
                  value={wbsCode}
                  onChange={(e) => setWbsCode(e.target.value)}
                  required
                  placeholder="1.1.1"
                  className="mt-1.5 h-9 text-xs font-mono bg-white border-[#d3cfc6] text-[#383c48] placeholder:text-[#535766]/50 focus:border-[#ff7c11]"
                />
              </div>
              <div>
                <Label className="text-[10px] text-[#535766] uppercase tracking-wider">
                  Nombre *
                </Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Nombre de la actividad"
                  className="mt-1.5 h-9 text-xs bg-white border-[#d3cfc6] text-[#383c48] placeholder:text-[#535766]/50 focus:border-[#ff7c11]"
                />
              </div>
            </div>

            <div>
              <Label className="text-[10px] text-[#535766] uppercase tracking-wider">
                Descripción
              </Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Describe la actividad..."
                className="mt-1.5 text-xs font-mono bg-white border-[#d3cfc6] text-[#383c48] placeholder:text-[#535766]/50 focus:border-[#ff7c11] resize-none"
              />
              <p className="text-[10px] text-[#535766]/60 mt-1">
                Soporta Markdown
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[10px] text-[#535766] uppercase tracking-wider">
                  Fase *
                </Label>
                <Select
                  value={phaseId}
                  onValueChange={(v) => setPhaseId(v ?? "")}
                >
                  <SelectTrigger className="mt-1.5 h-9 text-xs bg-white border-[#d3cfc6] text-[#383c48] focus:border-[#ff7c11]">
                    <SelectValue placeholder="Seleccionar fase..." />
                  </SelectTrigger>
                  <SelectContent>
                    {phases.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        Fase {p.number} · {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[10px] text-[#535766] uppercase tracking-wider">
                  Estado
                </Label>
                <Select
                  value={status}
                  onValueChange={(v) =>
                    setStatus((v ?? "NOT_STARTED") as ActivityStatus)
                  }
                >
                  <SelectTrigger className="mt-1.5 h-9 text-xs bg-white border-[#d3cfc6] text-[#383c48] focus:border-[#ff7c11]">
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
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[10px] text-[#535766] uppercase tracking-wider">
                  Fecha inicio
                </Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1.5 h-9 text-xs bg-white border-[#d3cfc6] text-[#383c48] focus:border-[#ff7c11]"
                />
              </div>
              <div>
                <Label className="text-[10px] text-[#535766] uppercase tracking-wider">
                  Fecha fin
                </Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1.5 h-9 text-xs bg-white border-[#d3cfc6] text-[#383c48] focus:border-[#ff7c11]"
                />
              </div>
            </div>

            <div>
              <Label className="text-[10px] text-[#535766] uppercase tracking-wider">
                Responsables ({ownerIds.length}/{MAX_OWNERS})
              </Label>
              <div className="mt-1.5 rounded-lg border border-[#d3cfc6] bg-white divide-y divide-[#d3cfc6]/40">
                {users.map((u) => {
                  const checked = ownerIds.includes(u.id);
                  const disabled = !checked && ownersFull;
                  return (
                    <label
                      key={u.id}
                      className={`flex items-center gap-2.5 px-3 py-2 text-xs cursor-pointer hover:bg-[#f9f8f5] ${
                        disabled ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={disabled}
                        onChange={() => toggleOwner(u.id)}
                        className="w-3.5 h-3.5 accent-[#ff7c11]"
                      />
                      <UserAvatar user={u} size="xs" />
                      <span className="text-[#383c48]">{u.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#ff7c11] hover:bg-[#ff9a3e] text-white rounded-full"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                {isEditing ? "Guardar cambios" : "Crear actividad"}
              </Button>
            </div>
          </form>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
