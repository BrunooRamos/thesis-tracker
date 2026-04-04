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
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Trash2,
  Send,
  ExternalLink,
  FileText,
  BookOpen,
  GitBranch,
  Wrench,
  Video,
  HelpCircle,
  Scale,
} from "lucide-react";
import { getFileViewUrl } from "@/lib/file-url";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { deleteResearchEntry, addResearchComment } from "@/app/(app)/research/actions";
import type { ResearchEntryWithRelations } from "./research-hub";

const typeIcons: Record<string, typeof BookOpen> = {
  PAPER: BookOpen,
  ARTICLE: FileText,
  REPO: GitBranch,
  TOOL: Wrench,
  VIDEO: Video,
  OTHER: HelpCircle,
};

const typeLabels: Record<string, string> = {
  PAPER: "Paper",
  ARTICLE: "Artículo",
  REPO: "Repo",
  TOOL: "Herramienta",
  VIDEO: "Video",
  OTHER: "Otro",
};

const relevanceConfig: Record<string, { color: string; label: string }> = {
  CRITICAL: { color: "bg-red-500/10 text-red-400", label: "Crítico" },
  HIGH: { color: "bg-amber-500/10 text-amber-400", label: "Alta" },
  MEDIUM: { color: "bg-[#ff7c11]/10 text-[#ff7c11]", label: "Media" },
  LOW: { color: "bg-[#535766]/10 text-[#535766]", label: "Baja" },
};

export function ResearchDetailSheet({
  entry,
  onClose,
  onUpdated,
  onDeleted,
}: {
  entry: ResearchEntryWithRelations | null;
  onClose: () => void;
  onUpdated: (entry: ResearchEntryWithRelations) => void;
  onDeleted: (id: string) => void;
}) {
  const [comment, setComment] = useState("");
  const [sendingComment, setSendingComment] = useState(false);

  if (!entry) return null;

  const TypeIcon = typeIcons[entry.type] || HelpCircle;
  const rel = relevanceConfig[entry.relevance];

  async function handleDelete() {
    if (!entry) return;
    if (!confirm("Eliminar este research entry?")) return;
    await deleteResearchEntry(entry.id);
    onDeleted(entry.id);
  }

  async function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim() || !entry) return;
    setSendingComment(true);
    const newComment = await addResearchComment(entry.id, comment);
    onUpdated({
      ...entry,
      comments: [...entry.comments, newComment as ResearchEntryWithRelations["comments"][0]],
    });
    setComment("");
    setSendingComment(false);
  }

  return (
    <Sheet open={!!entry} onOpenChange={() => onClose()}>
      <SheetContent className="bg-[#f9f8f5] border-[#d3cfc6]/50 w-full sm:max-w-lg p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-[#d3cfc6]/40">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-[#e9e7df]/50 flex items-center justify-center">
                <TypeIcon className="w-3.5 h-3.5 text-[#535766]" />
              </div>
              <span className="text-[10px] text-[#535766] uppercase tracking-wider">
                {typeLabels[entry.type]}
              </span>
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${rel.color}`}>
                {rel.label}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="text-[#535766] hover:text-red-400 hover:bg-red-400/10"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
          <SheetTitle className="text-[#1a1c24] text-base font-semibold leading-snug text-left">
            {entry.title}
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-140px)]">
          <div className="px-6 space-y-4 pb-6">
            {/* Authors */}
            {entry.authors && (
              <p className="text-xs text-[#535766]">{entry.authors}</p>
            )}

            {/* URL */}
            {entry.url && (
              <a
                href={entry.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                {entry.url.replace(/https?:\/\//, "").split("/")[0]}
              </a>
            )}

            {/* Tags */}
            {entry.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {entry.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-[#e9e7df]/50 text-[#535766]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Linked Resource */}
            {entry.resource && (
              <div className="rounded-xl bg-[#ff7c11]/[0.04] border border-[#ff7c11]/20 p-3">
                <label className="text-[9px] text-[#ff7c11] uppercase tracking-wider font-semibold block mb-1.5">
                  Recurso origen
                </label>
                <div className="flex items-center gap-2">
                  {entry.resource.fileUrl ? (
                    <FileText className="w-3.5 h-3.5 text-[#ff7c11]" />
                  ) : (
                    <ExternalLink className="w-3.5 h-3.5 text-[#ff7c11]" />
                  )}
                  <a
                    href={entry.resource.url || (entry.resource.fileUrl ? getFileViewUrl(entry.resource.fileUrl) : "#")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-[#1a1c24] hover:text-[#ff7c11] transition-colors"
                  >
                    {entry.resource.name}
                  </a>
                </div>
              </div>
            )}

            {/* Linked Tasks */}
            {entry.tasks && entry.tasks.length > 0 && (
              <div className="rounded-xl bg-[#e9e7df]/50 border border-[#d3cfc6]/30 p-3">
                <label className="text-[9px] text-[#535766] uppercase tracking-wider font-semibold block mb-1.5">
                  Tareas vinculadas ({entry.tasks.length})
                </label>
                <div className="space-y-1.5">
                  {entry.tasks.map((t) => (
                    <div key={t.id} className="flex items-center gap-2 text-xs">
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        t.status === "DONE" ? "bg-emerald-500" :
                        t.status === "IN_PROGRESS" ? "bg-[#ff7c11]" :
                        t.status === "IN_REVIEW" ? "bg-amber-500" : "bg-[#d3cfc6]"
                      }`} />
                      <span className="text-[#1a1c24] truncate">{t.title}</span>
                      {t.assignee && (
                        <span className="text-[9px] text-[#535766] ml-auto shrink-0">{t.assignee.name}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Linked Decisions */}
            {entry.decisions && entry.decisions.length > 0 && (
              <div className="rounded-xl bg-amber-50/60 border border-amber-200/60 p-3">
                <label className="text-[9px] text-amber-600 uppercase tracking-wider font-semibold block mb-1.5">
                  Decisiones vinculadas ({entry.decisions.length})
                </label>
                <div className="space-y-1.5">
                  {entry.decisions.map((d) => (
                    <div key={d.id} className="flex items-center gap-2 text-xs">
                      <Scale className="w-3 h-3 text-amber-600 shrink-0" />
                      <span className="text-[11px] text-[#1a1c24] truncate">{d.title}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium shrink-0 ${
                        d.status === "ACCEPTED" ? "bg-emerald-100 text-emerald-700" :
                        d.status === "REVISITED" ? "bg-orange-100 text-orange-700" :
                        "bg-amber-100 text-amber-700"
                      }`}>
                        {d.status}
                      </span>
                      {d.madeBy && (
                        <span className="text-[9px] text-[#535766] ml-auto shrink-0">
                          {d.madeBy.name}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Separator className="bg-[#e9e7df]/80" />

            {/* Summary */}
            <div>
              <label className="text-[10px] text-[#535766] uppercase tracking-wider block mb-2">
                Resumen
              </label>
              <p className="text-xs text-[#383c48] leading-relaxed whitespace-pre-wrap">
                {entry.summary}
              </p>
            </div>

            {/* Key Findings */}
            {entry.keyFindings && (
              <div>
                <label className="text-[10px] text-[#535766] uppercase tracking-wider block mb-2">
                  Hallazgos clave
                </label>
                <p className="text-xs text-[#535766] leading-relaxed whitespace-pre-wrap">
                  {entry.keyFindings}
                </p>
              </div>
            )}

            {/* Comments */}
            <Separator className="bg-[#e9e7df]/80" />
            <div>
              <label className="text-[10px] text-[#535766] uppercase tracking-wider block mb-3">
                Comentarios ({entry.comments.length})
              </label>

              <div className="space-y-3 mb-4">
                {entry.comments.map((c) => (
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
              <p>Agregado por {entry.user.name}</p>
              <p>
                {format(new Date(entry.createdAt), "dd/MM/yyyy HH:mm", {
                  locale: es,
                })}
              </p>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
