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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Trash2, Send } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { deleteDecision, addDecisionComment } from "@/app/(app)/decisions/actions";
import type { DecisionWithRelations } from "./decision-log";
import type { User } from "@/types";

const statusBadge: Record<string, string> = {
  PROPOSED: "bg-amber-50 text-amber-600 border-amber-200/60",
  ACCEPTED: "bg-emerald-50 text-emerald-600 border-emerald-200/60",
  REVISITED: "bg-[#ff7c11]/10 text-[#ff7c11] border-[#ff7c11]/20",
};

const statusLabel: Record<string, string> = {
  PROPOSED: "Propuesta",
  ACCEPTED: "Aceptada",
  REVISITED: "Revisada",
};

export function DecisionDetailDrawer({
  decision,
  onClose,
  users,
  onUpdated,
  onDeleted,
}: {
  decision: DecisionWithRelations | null;
  onClose: () => void;
  users: User[];
  onUpdated: (decision: DecisionWithRelations) => void;
  onDeleted: (id: string) => void;
}) {
  const [comment, setComment] = useState("");
  const [sendingComment, setSendingComment] = useState(false);

  if (!decision) return null;

  async function handleStatusChange(value: string) {
    if (!decision) return;
    const res = await fetch(`/api/decisions/${decision.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: value }),
    });
    if (res.ok) {
      const updated = await res.json();
      onUpdated(updated);
    }
  }

  async function handleDelete() {
    if (!decision) return;
    if (!confirm("Eliminar esta decision?")) return;
    await deleteDecision(decision.id);
    onDeleted(decision.id);
  }

  async function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim() || !decision) return;
    setSendingComment(true);
    await addDecisionComment(decision.id, comment);
    // Refetch decision
    const res = await fetch(`/api/decisions/${decision.id}`);
    if (res.ok) {
      const updated = await res.json();
      onUpdated(updated);
    }
    setComment("");
    setSendingComment(false);
  }

  return (
    <Sheet open={!!decision} onOpenChange={() => onClose()}>
      <SheetContent className="bg-[#f9f8f5] border-[#d3cfc6]/50 w-full sm:max-w-lg p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-[#d3cfc6]/40">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <SheetTitle className="text-[#1a1c24] text-base font-semibold leading-snug">
                {decision.title}
              </SheetTitle>
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
            {/* Status */}
            <div>
              <label className="text-[10px] text-[#535766] uppercase tracking-wider block mb-1.5">
                Estado
              </label>
              <Select
                value={decision.status}
                onValueChange={(v) => handleStatusChange(v ?? "")}
              >
                <SelectTrigger className="h-8 text-xs bg-white border-[#d3cfc6] w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PROPOSED">Propuesta</SelectItem>
                  <SelectItem value="ACCEPTED">Aceptada</SelectItem>
                  <SelectItem value="REVISITED">Revisada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Context */}
            <Separator className="bg-[#e9e7df]/80" />
            <div>
              <label className="text-[10px] text-[#535766] uppercase tracking-wider block mb-2">
                Contexto
              </label>
              <p className="text-xs text-[#535766] leading-relaxed whitespace-pre-wrap">
                {decision.context}
              </p>
            </div>

            {/* Decision */}
            <div>
              <label className="text-[10px] text-[#535766] uppercase tracking-wider block mb-2">
                Decision
              </label>
              <p className="text-xs text-[#1a1c24] leading-relaxed whitespace-pre-wrap font-medium">
                {decision.decision}
              </p>
            </div>

            {/* Rationale */}
            <div>
              <label className="text-[10px] text-[#535766] uppercase tracking-wider block mb-2">
                Justificacion
              </label>
              <p className="text-xs text-[#535766] leading-relaxed whitespace-pre-wrap">
                {decision.rationale}
              </p>
            </div>

            {/* Alternatives */}
            {decision.alternatives && (
              <div>
                <label className="text-[10px] text-[#535766] uppercase tracking-wider block mb-2">
                  Alternativas consideradas
                </label>
                <p className="text-xs text-[#535766] leading-relaxed whitespace-pre-wrap">
                  {decision.alternatives}
                </p>
              </div>
            )}

            {/* Impact */}
            {decision.impact && (
              <div>
                <label className="text-[10px] text-[#535766] uppercase tracking-wider block mb-2">
                  Impacto
                </label>
                <p className="text-xs text-[#535766] leading-relaxed whitespace-pre-wrap">
                  {decision.impact}
                </p>
              </div>
            )}

            {/* Comments */}
            <Separator className="bg-[#e9e7df]/80" />
            <div>
              <label className="text-[10px] text-[#535766] uppercase tracking-wider block mb-3">
                Comentarios ({decision.comments.length})
              </label>

              <div className="space-y-3 mb-4">
                {decision.comments.map((c) => (
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

              {/* Add comment */}
              <form onSubmit={handleComment} className="flex gap-2">
                <Input
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Agregar comentario..."
                  className="flex-1 h-8 text-xs bg-white border-[#d3cfc6] text-[#383c48] placeholder:text-[#535766]/50 focus:border-[#ff7c11]"
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
              <p>Creado por {decision.madeBy.name}</p>
              <p>
                Creado{" "}
                {format(new Date(decision.createdAt), "dd/MM/yyyy HH:mm")}
              </p>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
