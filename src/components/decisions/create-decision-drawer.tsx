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
import { Loader2 } from "lucide-react";
import { createDecision } from "@/app/(app)/decisions/actions";
import type { DecisionWithRelations } from "./decision-log";

export function CreateDecisionDrawer({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (decision: DecisionWithRelations) => void;
}) {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      const decision = await createDecision(formData);
      // Fetch full decision with relations
      const res = await fetch(`/api/decisions/${decision.id}`);
      if (res.ok) {
        const full = await res.json();
        onCreated(full);
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
            Nueva decision
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
                placeholder="Nombre de la decision"
                className="mt-1.5 h-9 text-xs bg-white border-[#d3cfc6] text-[#383c48] placeholder:text-[#535766]/50 focus:border-[#ff7c11]"
              />
            </div>

            <div>
              <Label className="text-[10px] text-[#535766] uppercase tracking-wider">
                Contexto *
              </Label>
              <Textarea
                name="context"
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
                name="decision"
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
                name="rationale"
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
                name="alternatives"
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
                name="impact"
                rows={2}
                placeholder="Impacto esperado de esta decision..."
                className="mt-1.5 text-xs bg-white border-[#d3cfc6] text-[#383c48] placeholder:text-[#535766]/50 focus:border-[#ff7c11] resize-none"
              />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#ff7c11] hover:bg-[#ff9a3e] text-white rounded-full"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Registrar decision
              </Button>
            </div>
          </form>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
