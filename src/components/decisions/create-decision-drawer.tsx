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
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { createDecision, updateDecision } from "@/app/(app)/decisions/actions";
import type { DecisionWithRelations } from "./decision-log";
import type { MeetingNote, ResearchEntry, Experiment, User } from "@/types";

export function CreateDecisionDrawer({
  open,
  onOpenChange,
  onCreated,
  meetings,
  researchEntries,
  experiments,
  editingItem,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (decision: DecisionWithRelations) => void;
  meetings: MeetingNote[];
  researchEntries: (ResearchEntry & { user: User })[];
  experiments: Experiment[];
  editingItem?: DecisionWithRelations | null;
}) {
  const isEditing = !!editingItem;
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState(editingItem?.title || "");
  const [context, setContext] = useState(editingItem?.context || "");
  const [decision, setDecision] = useState(editingItem?.decision || "");
  const [rationale, setRationale] = useState(editingItem?.rationale || "");
  const [alternatives, setAlternatives] = useState(editingItem?.alternatives || "");
  const [impact, setImpact] = useState(editingItem?.impact || "");
  const [meetingNoteId, setMeetingNoteId] = useState(editingItem?.meetingNoteId || "");
  const [researchEntryId, setResearchEntryId] = useState(editingItem?.researchEntryId || "");
  const [experimentId, setExperimentId] = useState(editingItem?.experimentId || "");

  // Re-sync when editingItem changes
  const [prevEditId, setPrevEditId] = useState(editingItem?.id);
  if (editingItem && editingItem.id !== prevEditId) {
    setPrevEditId(editingItem.id);
    setTitle(editingItem.title);
    setContext(editingItem.context);
    setDecision(editingItem.decision);
    setRationale(editingItem.rationale);
    setAlternatives(editingItem.alternatives || "");
    setImpact(editingItem.impact || "");
    setMeetingNoteId(editingItem.meetingNoteId || "");
    setResearchEntryId(editingItem.researchEntryId || "");
    setExperimentId(editingItem.experimentId || "");
  }

  function resetForm() {
    setTitle("");
    setContext("");
    setDecision("");
    setRationale("");
    setAlternatives("");
    setImpact("");
    setMeetingNoteId("");
    setResearchEntryId("");
    setExperimentId("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEditing && editingItem) {
        await updateDecision(editingItem.id, {
          title,
          context,
          decision,
          rationale,
          alternatives: alternatives || null,
          impact: impact || null,
          meetingNoteId: meetingNoteId || null,
          researchEntryId: researchEntryId || null,
          experimentId: experimentId || null,
        });
        const res = await fetch(`/api/decisions/${editingItem.id}`);
        if (res.ok) {
          const full = await res.json();
          onCreated(full);
        }
      } else {
        const formData = new FormData();
        formData.set("title", title);
        formData.set("context", context);
        formData.set("decision", decision);
        formData.set("rationale", rationale);
        if (alternatives) formData.set("alternatives", alternatives);
        if (impact) formData.set("impact", impact);
        if (meetingNoteId) formData.set("meetingNoteId", meetingNoteId);
        if (researchEntryId) formData.set("researchEntryId", researchEntryId);
        if (experimentId) formData.set("experimentId", experimentId);

        const created = await createDecision(formData);
        const res = await fetch(`/api/decisions/${created.id}`);
        if (res.ok) {
          const full = await res.json();
          onCreated(full);
          resetForm();
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
      <SheetContent className="bg-[#f9f8f5] border-[#d3cfc6]/50 w-full sm:max-w-2xl p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-[#d3cfc6]/40">
          <SheetTitle className="text-[#1a1c24] text-base font-semibold">
            {isEditing ? "Editar decision" : "Nueva decision"}
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-100px)]">
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            <div>
              <Label className="text-[10px] text-[#535766] uppercase tracking-wider">
                Titulo *
              </Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Nombre de la decision"
                className="mt-1.5 h-9 text-xs bg-white border-[#d3cfc6] text-[#383c48] placeholder:text-[#535766]/50 focus:border-[#ff7c11]"
              />
            </div>

            <div>
              <Label className="text-[10px] text-[#535766] uppercase tracking-wider">
                Contexto *
              </Label>
              <Textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                required
                rows={3}
                placeholder="Contexto y circunstancias de la decision..."
                className="mt-1.5 text-xs bg-white border-[#d3cfc6] text-[#383c48] placeholder:text-[#535766]/50 focus:border-[#ff7c11] resize-none"
              />
            </div>

            <div>
              <Label className="text-[10px] text-[#535766] uppercase tracking-wider">
                Decision *
              </Label>
              <Textarea
                value={decision}
                onChange={(e) => setDecision(e.target.value)}
                required
                rows={3}
                placeholder="Que se decidio..."
                className="mt-1.5 text-xs bg-white border-[#d3cfc6] text-[#383c48] placeholder:text-[#535766]/50 focus:border-[#ff7c11] resize-none"
              />
            </div>

            <div>
              <Label className="text-[10px] text-[#535766] uppercase tracking-wider">
                Justificacion *
              </Label>
              <Textarea
                value={rationale}
                onChange={(e) => setRationale(e.target.value)}
                required
                rows={3}
                placeholder="Por que se tomo esta decision..."
                className="mt-1.5 text-xs bg-white border-[#d3cfc6] text-[#383c48] placeholder:text-[#535766]/50 focus:border-[#ff7c11] resize-none"
              />
            </div>

            <div>
              <Label className="text-[10px] text-[#535766] uppercase tracking-wider">
                Alternativas consideradas
              </Label>
              <Textarea
                value={alternatives}
                onChange={(e) => setAlternatives(e.target.value)}
                rows={2}
                placeholder="Otras opciones evaluadas..."
                className="mt-1.5 text-xs bg-white border-[#d3cfc6] text-[#383c48] placeholder:text-[#535766]/50 focus:border-[#ff7c11] resize-none"
              />
            </div>

            <div>
              <Label className="text-[10px] text-[#535766] uppercase tracking-wider">
                Impacto
              </Label>
              <Textarea
                value={impact}
                onChange={(e) => setImpact(e.target.value)}
                rows={2}
                placeholder="Impacto esperado de esta decision..."
                className="mt-1.5 text-xs bg-white border-[#d3cfc6] text-[#383c48] placeholder:text-[#535766]/50 focus:border-[#ff7c11] resize-none"
              />
            </div>

            {/* Link selects */}
            {meetings.length > 0 && (
              <div>
                <Label className="text-[10px] text-[#535766] uppercase tracking-wider">
                  Surgio de reunion
                </Label>
                <Select
                  value={meetingNoteId}
                  onValueChange={(v) => setMeetingNoteId(v ?? "")}
                >
                  <SelectTrigger className="mt-1.5 h-9 text-xs bg-white border-[#d3cfc6] text-[#383c48] focus:border-[#ff7c11]">
                    <SelectValue placeholder="Seleccionar reunion..." />
                  </SelectTrigger>
                  <SelectContent>
                    {meetings.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.title} - {format(new Date(m.date), "d MMM yyyy", { locale: es })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {researchEntries.length > 0 && (
              <div>
                <Label className="text-[10px] text-[#535766] uppercase tracking-wider">
                  Basada en research
                </Label>
                <Select
                  value={researchEntryId}
                  onValueChange={(v) => setResearchEntryId(v ?? "")}
                >
                  <SelectTrigger className="mt-1.5 h-9 text-xs bg-white border-[#d3cfc6] text-[#383c48] focus:border-[#ff7c11]">
                    <SelectValue placeholder="Seleccionar research..." />
                  </SelectTrigger>
                  <SelectContent>
                    {researchEntries.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {experiments.length > 0 && (
              <div>
                <Label className="text-[10px] text-[#535766] uppercase tracking-wider">
                  Basada en experimento
                </Label>
                <Select
                  value={experimentId}
                  onValueChange={(v) => setExperimentId(v ?? "")}
                >
                  <SelectTrigger className="mt-1.5 h-9 text-xs bg-white border-[#d3cfc6] text-[#383c48] focus:border-[#ff7c11]">
                    <SelectValue placeholder="Seleccionar experimento..." />
                  </SelectTrigger>
                  <SelectContent>
                    {experiments.map((exp) => (
                      <SelectItem key={exp.id} value={exp.id}>
                        {exp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="pt-2">
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#ff7c11] hover:bg-[#ff9a3e] text-white rounded-full"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                {isEditing ? "Guardar cambios" : "Registrar decision"}
              </Button>
            </div>
          </form>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
