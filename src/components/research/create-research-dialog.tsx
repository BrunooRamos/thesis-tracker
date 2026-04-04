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
import { Loader2, BookOpen } from "lucide-react";
import { createResearchEntry, updateResearchEntry } from "@/app/(app)/research/actions";
import type { ResearchEntryWithRelations } from "./research-hub";

export function CreateResearchDialog({
  open,
  onOpenChange,
  allTags,
  onCreated,
  editingItem,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allTags: string[];
  onCreated: (entry: ResearchEntryWithRelations) => void;
  editingItem?: ResearchEntryWithRelations | null;
}) {
  const isEditing = !!editingItem;
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      if (isEditing && editingItem) {
        const tagsStr = formData.get("tags") as string | null;
        const tags = tagsStr ? tagsStr.split(",").map(t => t.trim()).filter(Boolean) : [];
        const updated = await updateResearchEntry(editingItem.id, {
          title: formData.get("title") as string,
          type: formData.get("type") as "PAPER" | "ARTICLE" | "REPO" | "TOOL" | "VIDEO" | "OTHER",
          url: (formData.get("url") as string) || null,
          authors: (formData.get("authors") as string) || null,
          summary: formData.get("summary") as string,
          keyFindings: (formData.get("keyFindings") as string) || null,
          relevance: formData.get("relevance") as "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
          tags,
        });
        onCreated(updated as unknown as ResearchEntryWithRelations);
      } else {
        const entry = (await createResearchEntry(formData)) as unknown as ResearchEntryWithRelations;
        onCreated(entry);
      }
    } catch {
      // Error handling
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
              <BookOpen className="w-4 h-4 text-[#ff7c11]" />
            </div>
            <SheetTitle className="text-[#1a1c24] text-sm font-semibold">
              {isEditing ? "Editar Research Entry" : "Nuevo Research Entry"}
            </SheetTitle>
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-80px)]">
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
            <div className="space-y-1.5">
              <Label className="text-[#535766] text-xs font-medium">Título *</Label>
              <Input
                name="title"
                required
                defaultValue={editingItem?.title || ""}
                placeholder="Nombre del paper, recurso, etc."
                className="h-10 bg-white border-[#d3cfc6] text-[#383c48] placeholder:text-[#535766]/40 text-sm focus:border-[#ff7c11] focus:ring-[#ff7c11]/20"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[#535766] text-xs font-medium">Tipo *</Label>
                <Select name="type" defaultValue={editingItem?.type || "PAPER"}>
                  <SelectTrigger className="h-10 bg-white border-[#d3cfc6] text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PAPER">Paper</SelectItem>
                    <SelectItem value="ARTICLE">Artículo</SelectItem>
                    <SelectItem value="REPO">Repo</SelectItem>
                    <SelectItem value="TOOL">Herramienta</SelectItem>
                    <SelectItem value="VIDEO">Video</SelectItem>
                    <SelectItem value="OTHER">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#535766] text-xs font-medium">Relevancia</Label>
                <Select name="relevance" defaultValue={editingItem?.relevance || "MEDIUM"}>
                  <SelectTrigger className="h-10 bg-white border-[#d3cfc6] text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CRITICAL">Crítica</SelectItem>
                    <SelectItem value="HIGH">Alta</SelectItem>
                    <SelectItem value="MEDIUM">Media</SelectItem>
                    <SelectItem value="LOW">Baja</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[#535766] text-xs font-medium">URL</Label>
              <Input
                name="url"
                type="url"
                defaultValue={editingItem?.url || ""}
                placeholder="https://..."
                className="h-10 bg-white border-[#d3cfc6] text-[#383c48] placeholder:text-[#535766]/40 text-sm focus:border-[#ff7c11] focus:ring-[#ff7c11]/20"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[#535766] text-xs font-medium">Autores</Label>
              <Input
                name="authors"
                defaultValue={editingItem?.authors || ""}
                placeholder="Autor 1, Autor 2, ..."
                className="h-10 bg-white border-[#d3cfc6] text-[#383c48] placeholder:text-[#535766]/40 text-sm focus:border-[#ff7c11] focus:ring-[#ff7c11]/20"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[#535766] text-xs font-medium">Resumen *</Label>
              <Textarea
                name="summary"
                required
                defaultValue={editingItem?.summary || ""}
                placeholder="De qué trata y por qué es relevante..."
                rows={3}
                className="bg-white border-[#d3cfc6] text-[#383c48] placeholder:text-[#535766]/40 text-sm resize-none focus:border-[#ff7c11] focus:ring-[#ff7c11]/20"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[#535766] text-xs font-medium">Hallazgos clave</Label>
              <Textarea
                name="keyFindings"
                defaultValue={editingItem?.keyFindings || ""}
                placeholder="Qué nos sirve de este recurso..."
                rows={2}
                className="bg-white border-[#d3cfc6] text-[#383c48] placeholder:text-[#535766]/40 text-sm resize-none focus:border-[#ff7c11] focus:ring-[#ff7c11]/20"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[#535766] text-xs font-medium">
                Tags (separados por coma)
              </Label>
              <Input
                name="tags"
                defaultValue={editingItem?.tags?.join(", ") || ""}
                placeholder="RLM, Deep Agent, Benchmark, ..."
                className="h-10 bg-white border-[#d3cfc6] text-[#383c48] placeholder:text-[#535766]/40 text-sm focus:border-[#ff7c11] focus:ring-[#ff7c11]/20"
              />
              {allTags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {allTags.map((t) => (
                    <span key={t} className="px-1.5 py-0.5 rounded text-[9px] bg-[#e9e7df] text-[#535766]">
                      {t}
                    </span>
                  ))}
                </div>
              )}
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
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : isEditing ? "Guardar cambios" : "Crear entry"}
              </Button>
            </div>
          </form>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
