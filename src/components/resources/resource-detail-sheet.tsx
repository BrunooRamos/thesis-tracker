"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Markdown } from "@/components/ui/markdown";
import { getFileViewUrl } from "@/lib/file-url";
import {
  Trash2,
  ExternalLink,
  Pin,
  FileText,
  Link,
  BookOpen,
  ListTodo,
  Download,
  Image as ImageIcon,
  Plus,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { deleteResource } from "@/app/(app)/resources/actions";
import type { Resource, User, ResearchEntry, Task, ResourceCategory } from "@/types";

export type ResourceWithRelations = Resource & {
  addedBy: User;
  researchEntries: (ResearchEntry & { user: User })[];
  tasks: (Task & { assignee: User | null })[];
};

const CATEGORY_LABELS: Record<ResourceCategory, string> = {
  PAPER: "Paper",
  TOOL: "Herramienta",
  DATASET: "Dataset",
  HORIZON_DOC: "Horizon",
  REPO: "Repo",
  FACULTY_DOC: "Facultad",
  OTHER: "Otro",
};

const CATEGORY_BADGE_CLASSES: Record<ResourceCategory, string> = {
  PAPER: "bg-blue-50 text-blue-600",
  TOOL: "bg-violet-50 text-violet-600",
  DATASET: "bg-emerald-50 text-emerald-600",
  HORIZON_DOC: "bg-[#ff7c11]/10 text-[#ff7c11]",
  REPO: "bg-[#1a1c24]/10 text-[#1a1c24]",
  FACULTY_DOC: "bg-amber-50 text-amber-600",
  OTHER: "bg-[#e9e7df] text-[#535766]",
};

const RELEVANCE_CONFIG: Record<string, { color: string; label: string }> = {
  CRITICAL: { color: "bg-red-500/10 text-red-500", label: "Critico" },
  HIGH: { color: "bg-amber-500/10 text-amber-500", label: "Alta" },
  MEDIUM: { color: "bg-[#ff7c11]/10 text-[#ff7c11]", label: "Media" },
  LOW: { color: "bg-[#535766]/10 text-[#535766]", label: "Baja" },
};

const TASK_STATUS_LABELS: Record<string, { color: string; label: string }> = {
  TODO: { color: "bg-[#e9e7df] text-[#535766]", label: "Por hacer" },
  IN_PROGRESS: { color: "bg-blue-50 text-blue-600", label: "En progreso" },
  IN_REVIEW: { color: "bg-violet-50 text-violet-600", label: "En revision" },
  DONE: { color: "bg-emerald-50 text-emerald-600", label: "Hecho" },
  BLOCKED: { color: "bg-red-50 text-red-500", label: "Bloqueado" },
};

function isImageType(fileType: string | null | undefined): boolean {
  if (!fileType) return false;
  return fileType.startsWith("image/");
}

function isPdfType(fileType: string | null | undefined): boolean {
  if (!fileType) return false;
  return fileType === "application/pdf";
}

export function ResourceDetailSheet({
  resource,
  onClose,
  onCreateTask,
  onCreateResearch,
  onDeleted,
}: {
  resource: ResourceWithRelations | null;
  onClose: () => void;
  onCreateTask: (resource: ResourceWithRelations) => void;
  onCreateResearch: (resource: ResourceWithRelations) => void;
  onDeleted: (id: string) => void;
}) {
  if (!resource) return null;

  async function handleDelete() {
    if (!resource) return;
    if (!confirm("Eliminar este recurso?")) return;
    await deleteResource(resource.id);
    onDeleted(resource.id);
  }

  const hasFile = !!resource.fileUrl;
  const hasUrl = !!resource.url;
  const fileViewUrl = resource.fileUrl ? getFileViewUrl(resource.fileUrl) : null;

  return (
    <Sheet open={!!resource} onOpenChange={() => onClose()}>
      <SheetContent className="bg-[#f9f8f5] border-[#d3cfc6]/50 w-full sm:max-w-lg p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-[#d3cfc6]/40">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-[#e9e7df]/50 flex items-center justify-center">
                {hasFile ? (
                  <FileText className="w-3.5 h-3.5 text-[#535766]" />
                ) : (
                  <Link className="w-3.5 h-3.5 text-[#535766]" />
                )}
              </div>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                  CATEGORY_BADGE_CLASSES[resource.category]
                }`}
              >
                {CATEGORY_LABELS[resource.category]}
              </span>
              {resource.pinned && (
                <Pin className="w-3 h-3 text-[#ff7c11]" />
              )}
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
            {resource.name}
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-140px)]">
          <div className="px-6 space-y-4 pb-6">
            {/* Link/File section */}
            {hasUrl && (
              <a
                href={resource.url!}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-blue-500 hover:text-blue-400 transition-colors mt-3"
              >
                <ExternalLink className="w-3 h-3" />
                {resource.url!.replace(/https?:\/\//, "").split("/")[0]}
              </a>
            )}

            {hasFile && (
              <div className="mt-3 space-y-3">
                {isImageType(resource.fileType) && (
                  <div className="rounded-lg border border-[#d3cfc6]/40 overflow-hidden">
                    <img
                      src={fileViewUrl!}
                      alt={resource.fileName || resource.name}
                      className="w-full max-h-48 object-cover"
                    />
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-[#535766]" />
                  <span className="text-xs text-[#383c48] truncate flex-1">
                    {resource.fileName}
                  </span>
                  <a
                    href={fileViewUrl!}
                    target={isPdfType(resource.fileType) ? "_blank" : undefined}
                    download={!isPdfType(resource.fileType) ? resource.fileName || true : undefined}
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] text-[#ff7c11] hover:text-[#ff9a3e] font-medium"
                  >
                    {isPdfType(resource.fileType) ? (
                      <>
                        <ExternalLink className="w-3 h-3" />
                        Ver
                      </>
                    ) : isImageType(resource.fileType) ? (
                      <>
                        <ImageIcon className="w-3 h-3" />
                        Abrir
                      </>
                    ) : (
                      <>
                        <Download className="w-3 h-3" />
                        Descargar
                      </>
                    )}
                  </a>
                </div>
              </div>
            )}

            {/* Description */}
            {resource.description && (
              <>
                <Separator className="bg-[#e9e7df]/80" />
                <div>
                  <label className="text-[10px] text-[#535766] uppercase tracking-wider block mb-2">
                    Descripcion
                  </label>
                  <Markdown content={resource.description} />
                </div>
              </>
            )}

            {/* Research entries */}
            <Separator className="bg-[#e9e7df]/80" />
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-[10px] text-[#535766] uppercase tracking-wider">
                  Analisis de research ({resource.researchEntries.length})
                </label>
                <button
                  onClick={() => onCreateResearch(resource)}
                  className="inline-flex items-center gap-1 text-[10px] text-[#ff7c11] hover:text-[#ff9a3e] font-medium"
                >
                  <Plus className="w-3 h-3" />
                  Agregar analisis
                </button>
              </div>

              {resource.researchEntries.length > 0 ? (
                <div className="space-y-2">
                  {resource.researchEntries.map((entry) => {
                    const rel = RELEVANCE_CONFIG[entry.relevance] || RELEVANCE_CONFIG.MEDIUM;
                    return (
                      <div
                        key={entry.id}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-white/60 border border-[#d3cfc6]/40"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-[#535766] shrink-0" />
                        <span className="text-xs text-[#383c48] truncate flex-1">
                          {entry.title}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${rel.color}`}
                        >
                          {rel.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-[#535766]/60">
                  No hay analisis vinculados.
                </p>
              )}
            </div>

            {/* Linked tasks */}
            <Separator className="bg-[#e9e7df]/80" />
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-[10px] text-[#535766] uppercase tracking-wider">
                  Tareas vinculadas ({resource.tasks.length})
                </label>
                <button
                  onClick={() => onCreateTask(resource)}
                  className="inline-flex items-center gap-1 text-[10px] text-[#ff7c11] hover:text-[#ff9a3e] font-medium"
                >
                  <Plus className="w-3 h-3" />
                  Crear tarea de estudio
                </button>
              </div>

              {resource.tasks.length > 0 ? (
                <div className="space-y-2">
                  {resource.tasks.map((task) => {
                    const status =
                      TASK_STATUS_LABELS[task.status] || TASK_STATUS_LABELS.TODO;
                    return (
                      <div
                        key={task.id}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-white/60 border border-[#d3cfc6]/40"
                      >
                        <ListTodo className="w-3.5 h-3.5 text-[#535766] shrink-0" />
                        <span className="text-xs text-[#383c48] truncate flex-1">
                          {task.title}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${status.color}`}
                        >
                          {status.label}
                        </span>
                        {task.assignee && (
                          <span className="text-[9px] text-[#535766]/60 shrink-0">
                            {task.assignee.name}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-[#535766]/60">
                  No hay tareas vinculadas.
                </p>
              )}
            </div>

            {/* Metadata */}
            <Separator className="bg-[#e9e7df]/80" />
            <div className="text-[10px] text-[#535766] space-y-1">
              <p>Agregado por {resource.addedBy?.name || "Desconocido"}</p>
              <p>
                {format(new Date(resource.createdAt), "dd/MM/yyyy HH:mm", {
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
