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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Trash2, ArrowRightCircle, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  deleteMeetingNote,
  convertActionItemToTask,
} from "@/app/(app)/meetings/actions";
import type { MeetingNoteWithAuthor } from "./meetings-page";
import type { User } from "@/types";

const typeBadgeStyles: Record<string, string> = {
  HORIZON_CHECKIN: "bg-[#ff7c11]/10 text-[#ff7c11] border-[#ff7c11]/20",
  TEAM_INTERNAL: "bg-[#1a1c24]/10 text-[#1a1c24] border-[#1a1c24]/20",
  TUTOR_ACADEMIC: "bg-emerald-50 text-emerald-600 border-emerald-200/60",
  OTHER: "bg-[#e9e7df] text-[#535766] border-[#d3cfc6]/40",
};

const typeLabel: Record<string, string> = {
  HORIZON_CHECKIN: "Horizon Check-in",
  TEAM_INTERNAL: "Interna",
  TUTOR_ACADEMIC: "Tutor Academico",
  OTHER: "Otra",
};

export function MeetingDetailDrawer({
  meeting,
  onClose,
  users,
  onUpdated,
  onDeleted,
}: {
  meeting: MeetingNoteWithAuthor | null;
  onClose: () => void;
  users: User[];
  onUpdated: (meeting: MeetingNoteWithAuthor) => void;
  onDeleted: (id: string) => void;
}) {
  const [convertedItems, setConvertedItems] = useState<Set<number>>(new Set());
  const [convertingIndex, setConvertingIndex] = useState<number | null>(null);

  if (!meeting) return null;

  const actionItems = (meeting.actionItems ?? []) as {
    task: string;
    assignee: string;
    dueDate?: string;
  }[];

  async function handleDelete() {
    if (!meeting) return;
    if (!confirm("Eliminar esta reunion?")) return;
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

  return (
    <Sheet open={!!meeting} onOpenChange={() => onClose()}>
      <SheetContent className="bg-[#f9f8f5] border-[#d3cfc6]/50 w-full sm:max-w-lg p-0">
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
                  {format(new Date(meeting.date), "d MMMM yyyy", {
                    locale: es,
                  })}
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="text-[#535766] hover:text-red-400 hover:bg-red-400/10 -mt-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
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
                      <Avatar className="w-4 h-4">
                        <AvatarFallback className="bg-[#e9e7df]/80 text-[8px] text-[#535766]">
                          {a[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-[11px] text-[#383c48]">{a}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Summary */}
            <Separator className="bg-[#e9e7df]/80" />
            <div>
              <label className="text-[10px] text-[#535766] uppercase tracking-wider block mb-2">
                Resumen
              </label>
              <p className="text-xs text-[#535766] leading-relaxed whitespace-pre-wrap">
                {meeting.summary}
              </p>
            </div>

            {/* Key decisions */}
            {meeting.keyDecisions && (
              <>
                <Separator className="bg-[#e9e7df]/80" />
                <div>
                  <label className="text-[10px] text-[#535766] uppercase tracking-wider block mb-2">
                    Decisiones clave
                  </label>
                  <p className="text-xs text-[#535766] leading-relaxed whitespace-pre-wrap">
                    {meeting.keyDecisions}
                  </p>
                </div>
              </>
            )}

            {/* Action items */}
            {actionItems.length > 0 && (
              <>
                <Separator className="bg-[#e9e7df]/80" />
                <div>
                  <label className="text-[10px] text-[#535766] uppercase tracking-wider block mb-3">
                    Acciones ({actionItems.length})
                  </label>
                  <div className="space-y-2">
                    {actionItems.map((item, index) => {
                      const isConverted = convertedItems.has(index);
                      const isConverting = convertingIndex === index;

                      return (
                        <div
                          key={index}
                          className={`flex items-start gap-3 bg-white border rounded-lg p-3 ${
                            isConverted
                              ? "border-emerald-200/60 bg-emerald-50/30"
                              : "border-[#d3cfc6]/40"
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-[#1a1c24] font-medium">
                              {item.task}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              {item.assignee && (
                                <span className="text-[10px] text-[#535766]">
                                  {item.assignee}
                                </span>
                              )}
                              {item.dueDate && (
                                <span className="text-[10px] text-[#535766]/60">
                                  {format(
                                    new Date(item.dueDate),
                                    "d MMM yyyy",
                                    { locale: es }
                                  )}
                                </span>
                              )}
                            </div>
                          </div>

                          {isConverted ? (
                            <div className="flex items-center gap-1 text-emerald-600 shrink-0">
                              <CheckCircle2 className="w-4 h-4" />
                              <span className="text-[10px]">Creada</span>
                            </div>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={isConverting}
                              onClick={() =>
                                handleConvertToTask(index, item)
                              }
                              className="h-7 px-2 text-[10px] text-[#ff7c11] hover:text-[#ff9a3e] hover:bg-[#ff7c11]/5 shrink-0 gap-1"
                            >
                              <ArrowRightCircle className="w-3.5 h-3.5" />
                              Crear tarea
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* Metadata */}
            <Separator className="bg-[#e9e7df]/80" />
            <div className="text-[10px] text-[#535766] space-y-1">
              <p>Creado por {meeting.author.name}</p>
              <p>
                Creado{" "}
                {format(new Date(meeting.createdAt), "dd/MM/yyyy HH:mm")}
              </p>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
