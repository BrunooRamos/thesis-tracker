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
import { Loader2, Plus, X } from "lucide-react";
import { createMeetingNote } from "@/app/(app)/meetings/actions";
import type { MeetingNoteWithAuthor } from "./meetings-page";
import type { User } from "@/types";

interface ActionItemInput {
  task: string;
  assignee: string;
  dueDate: string;
}

export function CreateMeetingDrawer({
  open,
  onOpenChange,
  onCreated,
  users,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (meeting: MeetingNoteWithAuthor) => void;
  users: User[];
}) {
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState("");
  const [actionItems, setActionItems] = useState<ActionItemInput[]>([]);

  function addActionItem() {
    setActionItems((prev) => [...prev, { task: "", assignee: "", dueDate: "" }]);
  }

  function removeActionItem(index: number) {
    setActionItems((prev) => prev.filter((_, i) => i !== index));
  }

  function updateActionItem(
    index: number,
    field: keyof ActionItemInput,
    value: string
  ) {
    setActionItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set("type", type);

    const validItems = actionItems.filter((ai) => ai.task.trim());
    formData.set("actionItems", JSON.stringify(validItems));

    try {
      const meeting = await createMeetingNote(formData);
      const res = await fetch(`/api/meetings/${meeting.id}`);
      if (res.ok) {
        const full = await res.json();
        onCreated(full);
        setType("");
        setActionItems([]);
      } else {
        onOpenChange(false);
      }
    } catch {
      // Error handling
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-[#f9f8f5] border-[#d3cfc6]/50 w-full sm:max-w-lg p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-[#d3cfc6]/40">
          <SheetTitle className="text-[#1a1c24] text-base font-semibold">
            Nueva reunion
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-100px)]">
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            <div>
              <Label className="text-[10px] text-[#535766] uppercase tracking-wider">
                Titulo *
              </Label>
              <Input
                name="title"
                required
                placeholder="Nombre de la reunion"
                className="mt-1.5 h-9 text-xs bg-white border-[#d3cfc6] text-[#383c48] placeholder:text-[#535766]/50 focus:border-[#ff7c11]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[10px] text-[#535766] uppercase tracking-wider">
                  Fecha *
                </Label>
                <Input
                  name="date"
                  type="date"
                  required
                  className="mt-1.5 h-9 text-xs bg-white border-[#d3cfc6] text-[#383c48] focus:border-[#ff7c11]"
                />
              </div>

              <div>
                <Label className="text-[10px] text-[#535766] uppercase tracking-wider">
                  Tipo *
                </Label>
                <Select value={type} onValueChange={(v) => setType(v ?? "")}>
                  <SelectTrigger className="mt-1.5 h-9 text-xs bg-white border-[#d3cfc6]">
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HORIZON_CHECKIN">
                      Horizon Check-in
                    </SelectItem>
                    <SelectItem value="TEAM_INTERNAL">Interna</SelectItem>
                    <SelectItem value="TUTOR_ACADEMIC">
                      Tutor Academico
                    </SelectItem>
                    <SelectItem value="OTHER">Otra</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-[10px] text-[#535766] uppercase tracking-wider">
                Asistentes
              </Label>
              <Input
                name="attendees"
                placeholder="Nombres separados por coma"
                className="mt-1.5 h-9 text-xs bg-white border-[#d3cfc6] text-[#383c48] placeholder:text-[#535766]/50 focus:border-[#ff7c11]"
              />
            </div>

            <div>
              <Label className="text-[10px] text-[#535766] uppercase tracking-wider">
                Resumen *
              </Label>
              <Textarea
                name="summary"
                required
                rows={4}
                placeholder="Resumen de lo discutido..."
                className="mt-1.5 text-xs bg-white border-[#d3cfc6] text-[#383c48] placeholder:text-[#535766]/50 focus:border-[#ff7c11] resize-none"
              />
            </div>

            <div>
              <Label className="text-[10px] text-[#535766] uppercase tracking-wider">
                Decisiones clave
              </Label>
              <Textarea
                name="keyDecisions"
                rows={2}
                placeholder="Decisiones tomadas en la reunion..."
                className="mt-1.5 text-xs bg-white border-[#d3cfc6] text-[#383c48] placeholder:text-[#535766]/50 focus:border-[#ff7c11] resize-none"
              />
            </div>

            {/* Action items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-[10px] text-[#535766] uppercase tracking-wider">
                  Acciones
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addActionItem}
                  className="h-6 px-2 text-[10px] text-[#ff7c11] hover:text-[#ff9a3e] hover:bg-[#ff7c11]/5"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Agregar
                </Button>
              </div>

              {actionItems.length === 0 && (
                <p className="text-[10px] text-[#535766]/50 italic">
                  Sin acciones. Haz clic en Agregar para anadir.
                </p>
              )}

              <div className="space-y-3">
                {actionItems.map((item, index) => (
                  <div
                    key={index}
                    className="bg-white border border-[#d3cfc6]/40 rounded-lg p-3 space-y-2 relative"
                  >
                    <button
                      type="button"
                      onClick={() => removeActionItem(index)}
                      className="absolute top-2 right-2 text-[#535766]/40 hover:text-red-400 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>

                    <div>
                      <Input
                        value={item.task}
                        onChange={(e) =>
                          updateActionItem(index, "task", e.target.value)
                        }
                        placeholder="Descripcion de la accion"
                        className="h-8 text-xs bg-white border-[#d3cfc6] text-[#383c48] placeholder:text-[#535766]/50 focus:border-[#ff7c11]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        value={item.assignee}
                        onChange={(e) =>
                          updateActionItem(index, "assignee", e.target.value)
                        }
                        placeholder="Responsable"
                        className="h-8 text-xs bg-white border-[#d3cfc6] text-[#383c48] placeholder:text-[#535766]/50 focus:border-[#ff7c11]"
                      />
                      <Input
                        type="date"
                        value={item.dueDate}
                        onChange={(e) =>
                          updateActionItem(index, "dueDate", e.target.value)
                        }
                        className="h-8 text-xs bg-white border-[#d3cfc6] text-[#383c48] focus:border-[#ff7c11]"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={loading || !type}
                className="w-full bg-[#ff7c11] hover:bg-[#ff9a3e] text-white rounded-full"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Registrar reunion
              </Button>
            </div>
          </form>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
