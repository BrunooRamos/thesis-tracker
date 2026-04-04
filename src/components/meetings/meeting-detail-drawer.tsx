"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Markdown } from "@/components/ui/markdown";
import { UserAvatar } from "@/components/ui/user-avatar";
import { getFileViewUrl } from "@/lib/file-url";
import {
  Trash2,
  ArrowRightCircle,
  CheckCircle2,
  FileText,
  Download,
  ExternalLink,
  Loader2,
  Scale,
  Pencil,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  deleteMeetingNote,
  convertActionItemToTask,
} from "@/app/(app)/meetings/actions";
import type { MeetingNoteWithAuthor } from "./meetings-page";
import type { User } from "@/types";

interface Attachment {
  type: "file" | "link";
  name: string;
  url: string;
  fileType?: string;
}

const typeBadgeStyles: Record<string, string> = {
  HORIZON_CHECKIN: "bg-[#ff7c11]/10 text-[#ff7c11] border-[#ff7c11]/20",
  TEAM_INTERNAL: "bg-[#1a1c24]/10 text-[#1a1c24] border-[#1a1c24]/20",
  TUTOR_ACADEMIC: "bg-emerald-50 text-emerald-600 border-emerald-200/60",
  OTHER: "bg-[#e9e7df] text-[#535766] border-[#d3cfc6]/40",
};

const typeLabel: Record<string, string> = {
  HORIZON_CHECKIN: "Horizon Check-in",
  TEAM_INTERNAL: "Interna",
  TUTOR_ACADEMIC: "Tutor Académico",
  OTHER: "Otra",
};

export function MeetingDetailDrawer({
  meeting,
  onClose,
  users,
  onUpdated,
  onDeleted,
  onEdit,
}: {
  meeting: MeetingNoteWithAuthor | null;
  onClose: () => void;
  users: User[];
  onUpdated: (meeting: MeetingNoteWithAuthor) => void;
  onDeleted: (id: string) => void;
  onEdit?: (meeting: MeetingNoteWithAuthor) => void;
}) {
  const [convertedItems, setConvertedItems] = useState<Set<number>>(new Set());
  const [convertingIndex, setConvertingIndex] = useState<number | null>(null);

  if (!meeting) return null;

  const actionItems = (meeting.actionItems ?? []) as {
    task: string;
    assignee: string;
    dueDate?: string;
  }[];

  const attachments = (meeting.attachments ?? []) as unknown as Attachment[];

  async function handleDelete() {
    if (!meeting) return;
    if (!confirm("Eliminar esta reunión?")) return;
    await deleteMeetingNote(meeting.id);
    onDeleted(meeting.id);
  }

  async function handleConvertToTask(
    index: number,
    item: { task: string; assignee: string; dueDate?: string }
  ) {
    if (!meeting) return;
    setConvertingIndex(index);
    try {
      await convertActionItemToTask(meeting.id, item);
      setConvertedItems((prev) => new Set(prev).add(index));
    } catch {
      // Error handling
    } finally {
      setConvertingIndex(null);
    }
  }

  async function handleConvertAll() {
    for (let i = 0; i < actionItems.length; i++) {
      if (!convertedItems.has(i) && actionItems[i].task.trim()) {
        await handleConvertToTask(i, actionItems[i]);
      }
    }
  }

  const unconvertedCount = actionItems.filter(
    (_, i) => !convertedItems.has(i) && actionItems[i].task.trim()
  ).length;

  return (
    <Sheet open={!!meeting} onOpenChange={() => onClose()}>
      <SheetContent className="bg-[#f9f8f5] border-[#d3cfc6]/50 w-full sm:max-w-2xl p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-[#d3cfc6]/40">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <SheetTitle className="text-[#1a1c24] text-base font-semibold leading-snug">
                {meeting.title}
              </SheetTitle>
              <div className="flex items-center gap-2 mt-1.5">
                <Badge
                  variant="outline"
                  className={`text-[10px] ${typeBadgeStyles[meeting.type]}`}
                >
                  {typeLabel[meeting.type]}
                </Badge>
                <span className="text-[10px] text-[#535766]">
                  {format(new Date(meeting.date), "d MMMM yyyy", { locale: es })}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { onClose(); onEdit(meeting); }}
                  className="text-[#535766] hover:text-[#ff7c11] hover:bg-[#ff7c11]/10 -mt-1"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
              )}
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
            {/* Attendees */}
            {meeting.attendees.length > 0 && (
              <div className="pt-4">
                <label className="text-[10px] text-[#535766] uppercase tracking-wider block mb-2">
                  Asistentes
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {meeting.attendees.map((a, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 bg-white border border-[#d3cfc6]/40 rounded-full px-2.5 py-1"
                    >
                      <UserAvatar user={{ name: a }} size="xs" className="!w-4 !h-4 !text-[8px]" />
                      <span className="text-[11px] text-[#383c48]">{a}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Archivos y Links */}
            <Separator className="bg-[#e9e7df]/80" />
            <div>
              <label className="text-[10px] text-[#535766] uppercase tracking-wider block mb-2">
                Archivos y Links
              </label>
              {attachments.length === 0 ? (
                <p className="text-[10px] text-[#535766]/50 italic">Sin archivos ni links adjuntos</p>
              ) : (
                <div className="space-y-2">
                  {attachments.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 bg-white border border-[#d3cfc6]/40 rounded-xl p-3"
                    >
                      <div className="w-9 h-9 rounded-lg bg-[#ff7c11]/10 flex items-center justify-center shrink-0">
                        {item.type === "file" ? (
                          <FileText className="w-4 h-4 text-[#ff7c11]" />
                        ) : (
                          <ExternalLink className="w-4 h-4 text-[#ff7c11]" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-[#1a1c24] font-medium truncate">{item.name}</p>
                        <p className="text-[9px] text-[#535766] truncate">
                          {item.type === "file" ? (item.fileType || "Archivo") : item.url}
                        </p>
                      </div>
                      {item.type === "file" ? (
                        <a
                          href={getFileViewUrl(item.url)}
                          target={item.fileType?.includes("pdf") ? "_blank" : undefined}
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#ff7c11] text-white text-[10px] font-medium hover:bg-[#ff9a3e] transition-colors shrink-0"
                        >
                          {item.fileType?.includes("pdf") ? (
                            <>
                              <ExternalLink className="w-3 h-3" />
                              Ver
                            </>
                          ) : (
                            <>
                              <Download className="w-3 h-3" />
                              Descargar
                            </>
                          )}
                        </a>
                      ) : (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#ff7c11] text-white text-[10px] font-medium hover:bg-[#ff9a3e] transition-colors shrink-0"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Abrir
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Summary — rendered as markdown */}
            <Separator className="bg-[#e9e7df]/80" />
            <div>
              <label className="text-[10px] text-[#535766] uppercase tracking-wider block mb-2">
                Resumen
              </label>
              <div className="rounded-xl bg-white border border-[#d3cfc6]/30 p-4">
                <Markdown content={meeting.summary} />
              </div>
            </div>

            {/* Key decisions */}
            {meeting.keyDecisions && (
              <>
                <Separator className="bg-[#e9e7df]/80" />
                <div>
                  <label className="text-[10px] text-[#535766] uppercase tracking-wider block mb-2">
                    Decisiones clave
                  </label>
                  <div className="rounded-xl bg-white border border-[#d3cfc6]/30 p-4">
                    <Markdown content={meeting.keyDecisions} />
                  </div>
                </div>
              </>
            )}

            {/* Action items → Tasks */}
            {actionItems.length > 0 && (
              <>
                <Separator className="bg-[#e9e7df]/80" />
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-[10px] text-[#535766] uppercase tracking-wider">
                      Acciones → Tareas ({actionItems.length})
                    </label>
                    {unconvertedCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleConvertAll}
                        className="h-6 px-2 text-[10px] text-[#ff7c11] hover:text-[#ff9a3e] hover:bg-[#ff7c11]/5 gap-1"
                      >
                        <ArrowRightCircle className="w-3 h-3" />
                        Crear todas ({unconvertedCount})
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {actionItems.map((item, index) => {
                      const isConverted = convertedItems.has(index);
                      const isConverting = convertingIndex === index;

                      return (
                        <div
                          key={index}
                          className={`flex items-start gap-3 bg-white border rounded-xl p-3 transition-colors ${
                            isConverted
                              ? "border-emerald-200 bg-emerald-50/30"
                              : "border-[#d3cfc6]/40"
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-medium ${isConverted ? "text-emerald-700 line-through" : "text-[#1a1c24]"}`}>
                              {item.task}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              {item.assignee && (
                                <span className="text-[10px] text-[#535766] bg-[#e9e7df]/50 px-1.5 py-0.5 rounded">
                                  {item.assignee}
                                </span>
                              )}
                              {item.dueDate && (
                                <span className="text-[10px] text-[#535766]/60">
                                  {format(new Date(item.dueDate), "d MMM", { locale: es })}
                                </span>
                              )}
                            </div>
                          </div>

                          {isConverted ? (
                            <div className="flex items-center gap-1 text-emerald-600 shrink-0">
                              <CheckCircle2 className="w-4 h-4" />
                              <span className="text-[10px] font-medium">En tareas</span>
                            </div>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={isConverting}
                              onClick={() => handleConvertToTask(index, item)}
                              className="h-7 px-2.5 text-[10px] text-[#ff7c11] hover:text-white hover:bg-[#ff7c11] shrink-0 gap-1 rounded-full transition-colors"
                            >
                              {isConverting ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <>
                                  <ArrowRightCircle className="w-3 h-3" />
                                  Crear tarea
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* Decisions */}
            {meeting.decisions && meeting.decisions.length > 0 && (
              <>
                <Separator className="bg-[#e9e7df]/80" />
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-[10px] text-[#535766] uppercase tracking-wider">
                      Decisiones ({meeting.decisions.length})
                    </label>
                    <Link
                      href="/decisions"
                      className="text-[10px] text-amber-600 hover:text-amber-700 font-medium"
                    >
                      Registrar en Decision Log →
                    </Link>
                  </div>
                  <div className="space-y-2">
                    {meeting.decisions.map((d) => (
                      <div
                        key={d.id}
                        className="rounded-xl bg-amber-50/60 border border-amber-200/60 p-3"
                      >
                        <div className="flex items-center gap-2">
                          <Scale className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span className="text-[11px] font-medium text-[#1a1c24] truncate">
                            {d.title}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium shrink-0 ${
                            d.status === "ACCEPTED" ? "bg-emerald-100 text-emerald-700" :
                            d.status === "REVISITED" ? "bg-orange-100 text-orange-700" :
                            "bg-amber-100 text-amber-700"
                          }`}>
                            {d.status}
                          </span>
                        </div>
                        {d.madeBy && (
                          <p className="text-[9px] text-[#535766] mt-1 ml-5.5">
                            por {d.madeBy.name}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Link to register decision even when none exist */}
            {(!meeting.decisions || meeting.decisions.length === 0) && (
              <>
                <Separator className="bg-[#e9e7df]/80" />
                <div className="flex items-center justify-between">
                  <label className="text-[10px] text-[#535766] uppercase tracking-wider">
                    Decisiones
                  </label>
                  <Link
                    href="/decisions"
                    className="text-[10px] text-amber-600 hover:text-amber-700 font-medium"
                  >
                    Registrar en Decision Log →
                  </Link>
                </div>
              </>
            )}

            {/* Metadata */}
            <Separator className="bg-[#e9e7df]/80" />
            <div className="text-[10px] text-[#535766] space-y-1">
              <p>Creado por {meeting.author.name}</p>
              <p>
                {format(new Date(meeting.createdAt), "dd/MM/yyyy HH:mm")}
              </p>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
