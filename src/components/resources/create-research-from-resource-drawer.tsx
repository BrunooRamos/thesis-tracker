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
import { createResearchEntry } from "@/app/(app)/research/actions";
import type { ResourceCategory } from "@/types";
import type { ResourceWithRelations } from "./resource-detail-sheet";

const CATEGORY_TO_RESEARCH_TYPE: Record<ResourceCategory, string> = {
  PAPER: "PAPER",
  TOOL: "TOOL",
  REPO: "REPO",
  DATASET: "OTHER",
  HORIZON_DOC: "ARTICLE",
  FACULTY_DOC: "ARTICLE",
  OTHER: "OTHER",
};

export function CreateResearchFromResourceDrawer({
  resource,
  allTags,
  open,
  onOpenChange,
  onCreated,
}: {
  resource: ResourceWithRelations | null;
  allTags: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}) {
  const defaultType = resource
    ? CATEGORY_TO_RESEARCH_TYPE[resource.category] || "OTHER"
    : "PAPER";

  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState(resource?.name || "");
  const [type, setType] = useState(defaultType);
  const [url, setUrl] = useState(resource?.url || "");
  const [authors, setAuthors] = useState("");
  const [summary, setSummary] = useState("");
  const [keyFindings, setKeyFindings] = useState("");
  const [relevance, setRelevance] = useState("MEDIUM");
  const [tagsInput, setTagsInput] = useState("");

  // Re-sync defaults when resource changes
  const [prevResourceId, setPrevResourceId] = useState(resource?.id);
  if (resource && resource.id !== prevResourceId) {
    setPrevResourceId(resource.id);
    setTitle(resource.name);
    setType(CATEGORY_TO_RESEARCH_TYPE[resource.category] || "OTHER");
    setUrl(resource.url || "");
    setAuthors("");
    setSummary("");
    setKeyFindings("");
    setRelevance("MEDIUM");
    setTagsInput("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !summary.trim() || !resource) return;
    setLoading(true);

    const formData = new FormData();
    formData.set("title", title);
    formData.set("type", type);
    if (url) formData.set("url", url);
    if (authors) formData.set("authors", authors);
    formData.set("summary", summary);
    if (keyFindings) formData.set("keyFindings", keyFindings);
    formData.set("relevance", relevance);
    if (tagsInput) formData.set("tags", tagsInput);
    formData.set("resourceId", resource.id);

    try {
      await createResearchEntry(formData);
      onCreated();
      onOpenChange(false);
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
              Nuevo analisis de research
            </SheetTitle>
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-80px)]">
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
            {/* Resource badge */}
            {resource && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/60 border border-[#d3cfc6]/40">
                <BookOpen className="w-3.5 h-3.5 text-[#535766] shrink-0" />
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
                placeholder="Nombre del paper, recurso, etc."
                className="h-10 bg-white border-[#d3cfc6] text-[#383c48] placeholder:text-[#535766]/40 text-sm focus:border-[#ff7c11] focus:ring-[#ff7c11]/20"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[#535766] text-xs font-medium">
                  Tipo *
                </Label>
                <Select value={type} onValueChange={(v) => setType(v ?? "PAPER")}>
                  <SelectTrigger className="h-10 bg-white border-[#d3cfc6] text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PAPER">Paper</SelectItem>
                    <SelectItem value="ARTICLE">Articulo</SelectItem>
                    <SelectItem value="REPO">Repo</SelectItem>
                    <SelectItem value="TOOL">Herramienta</SelectItem>
                    <SelectItem value="VIDEO">Video</SelectItem>
                    <SelectItem value="OTHER">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#535766] text-xs font-medium">
                  Relevancia
                </Label>
                <Select
                  value={relevance}
                  onValueChange={(v) => setRelevance(v ?? "MEDIUM")}
                >
                  <SelectTrigger className="h-10 bg-white border-[#d3cfc6] text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CRITICAL">Critica</SelectItem>
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
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                type="url"
                placeholder="https://..."
                className="h-10 bg-white border-[#d3cfc6] text-[#383c48] placeholder:text-[#535766]/40 text-sm focus:border-[#ff7c11] focus:ring-[#ff7c11]/20"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[#535766] text-xs font-medium">
                Autores
              </Label>
              <Input
                value={authors}
                onChange={(e) => setAuthors(e.target.value)}
                placeholder="Autor 1, Autor 2, ..."
                className="h-10 bg-white border-[#d3cfc6] text-[#383c48] placeholder:text-[#535766]/40 text-sm focus:border-[#ff7c11] focus:ring-[#ff7c11]/20"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[#535766] text-xs font-medium">
                Resumen *
              </Label>
              <Textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                required
                placeholder="De que trata y por que es relevante..."
                rows={3}
                className="bg-white border-[#d3cfc6] text-[#383c48] placeholder:text-[#535766]/40 text-sm resize-none focus:border-[#ff7c11] focus:ring-[#ff7c11]/20"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[#535766] text-xs font-medium">
                Hallazgos clave
              </Label>
              <Textarea
                value={keyFindings}
                onChange={(e) => setKeyFindings(e.target.value)}
                placeholder="Que nos sirve de este recurso..."
                rows={2}
                className="bg-white border-[#d3cfc6] text-[#383c48] placeholder:text-[#535766]/40 text-sm resize-none focus:border-[#ff7c11] focus:ring-[#ff7c11]/20"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[#535766] text-xs font-medium">
                Tags (separados por coma)
              </Label>
              <Input
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="RLM, Deep Agent, Benchmark, ..."
                className="h-10 bg-white border-[#d3cfc6] text-[#383c48] placeholder:text-[#535766]/40 text-sm focus:border-[#ff7c11] focus:ring-[#ff7c11]/20"
              />
              {allTags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {allTags.map((t) => (
                    <span
                      key={t}
                      className="px-1.5 py-0.5 rounded text-[9px] bg-[#e9e7df] text-[#535766]"
                    >
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
                disabled={loading || !title.trim() || !summary.trim()}
                className="flex-1 h-10 text-sm bg-[#ff7c11] hover:bg-[#ff9a3e] text-white rounded-full"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Crear entry"
                )}
              </Button>
            </div>
          </form>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
