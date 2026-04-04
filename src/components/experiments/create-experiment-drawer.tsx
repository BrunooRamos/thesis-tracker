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
import { Loader2, FlaskConical } from "lucide-react";
import { createExperiment, updateExperiment } from "@/app/(app)/experiments/actions";
import type { ExperimentWithRelations } from "./experiment-lab";

const ARCHITECTURES = ["RLM", "Deep Agent", "ReAct", "RAG", "CoT", "Custom"];

export function CreateExperimentDrawer({
  open,
  onOpenChange,
  onCreated,
  editingItem,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (experiment: ExperimentWithRelations) => void;
  editingItem?: ExperimentWithRelations | null;
}) {
  const isEditing = !!editingItem;
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      if (isEditing && editingItem) {
        const configRaw = formData.get("configuration") as string | null;
        let configuration: unknown = undefined;
        if (configRaw) {
          try { configuration = JSON.parse(configRaw); } catch { configuration = undefined; }
        }
        await updateExperiment(editingItem.id, {
          name: formData.get("name") as string,
          hypothesis: (formData.get("hypothesis") as string) || null,
          architecture: formData.get("architecture") as string,
          status: formData.get("status") as "PLANNED" | "RUNNING" | "COMPLETED" | "FAILED",
          dataset: (formData.get("dataset") as string) || null,
          ...(configuration !== undefined ? { configuration: configuration as Record<string, unknown> } : {}),
        } as Parameters<typeof updateExperiment>[1]);
        const res = await fetch(`/api/experiments/${editingItem.id}`);
        if (res.ok) {
          const full = await res.json();
          onCreated(full);
        }
      } else {
        const experiment = await createExperiment(formData);
        const res = await fetch(`/api/experiments/${experiment.id}`);
        if (res.ok) {
          const full = await res.json();
          onCreated(full);
        } else {
          onOpenChange(false);
        }
      }
    } catch {
      // Error handling
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-[#f9f8f5] border-[#d3cfc6]/50 w-full sm:max-w-md p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-[#d3cfc6]/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#ff7c11]/10 flex items-center justify-center">
              <FlaskConical className="w-4 h-4 text-[#ff7c11]" />
            </div>
            <SheetTitle className="text-[#1a1c24] text-sm font-semibold">
              {isEditing ? "Editar Experimento" : "Nuevo Experimento"}
            </SheetTitle>
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-80px)]">
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
            <div className="space-y-1.5">
              <Label className="text-[#535766] text-xs font-medium">Nombre *</Label>
              <Input
                name="name"
                required
                defaultValue={editingItem?.name || ""}
                placeholder="Nombre del experimento"
                className="h-10 bg-white border-[#d3cfc6] text-[#383c48] placeholder:text-[#535766]/40 text-sm focus:border-[#ff7c11] focus:ring-[#ff7c11]/20"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[#535766] text-xs font-medium">Hipotesis</Label>
              <Textarea
                name="hypothesis"
                defaultValue={editingItem?.hypothesis || ""}
                placeholder="Describe la hipotesis del experimento..."
                rows={3}
                className="bg-white border-[#d3cfc6] text-[#383c48] placeholder:text-[#535766]/40 text-sm resize-none focus:border-[#ff7c11] focus:ring-[#ff7c11]/20"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[#535766] text-xs font-medium">Arquitectura *</Label>
                <Select name="architecture" required defaultValue={editingItem?.architecture || "RAG"}>
                  <SelectTrigger className="h-10 bg-white border-[#d3cfc6] text-sm">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {ARCHITECTURES.map((a) => (
                      <SelectItem key={a} value={a}>{a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#535766] text-xs font-medium">Estado</Label>
                <Select name="status" defaultValue={editingItem?.status || "PLANNED"}>
                  <SelectTrigger className="h-10 bg-white border-[#d3cfc6] text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PLANNED">Planned</SelectItem>
                    <SelectItem value="RUNNING">Running</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="FAILED">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[#535766] text-xs font-medium">Configuracion (JSON)</Label>
              <Textarea
                name="configuration"
                defaultValue={editingItem?.configuration ? JSON.stringify(editingItem.configuration, null, 2) : ""}
                placeholder='{"model": "gpt-4", "temperature": 0.7}'
                rows={4}
                className="bg-white border-[#d3cfc6] text-[#383c48] placeholder:text-[#535766]/40 text-sm resize-none font-mono text-xs focus:border-[#ff7c11] focus:ring-[#ff7c11]/20"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[#535766] text-xs font-medium">Dataset</Label>
              <Input
                name="dataset"
                defaultValue={editingItem?.dataset || ""}
                placeholder="Nombre o ruta del dataset"
                className="h-10 bg-white border-[#d3cfc6] text-[#383c48] placeholder:text-[#535766]/40 text-sm focus:border-[#ff7c11] focus:ring-[#ff7c11]/20"
              />
            </div>

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
                disabled={loading}
                className="flex-1 h-10 text-sm bg-[#ff7c11] hover:bg-[#ff9a3e] text-white rounded-full"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : isEditing ? "Guardar cambios" : "Crear experimento"}
              </Button>
            </div>
          </form>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
