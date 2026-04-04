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
import { Loader2, Plus } from "lucide-react";
import { createResource } from "@/app/(app)/resources/actions";
import type { Resource, User } from "@/types";

type ResourceWithUser = Resource & { addedBy: User };

export function CreateResourceDrawer({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (resource: ResourceWithUser) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set("category", category);
    try {
      const resource = await createResource(formData);
      // Reload to get full resource with addedBy
      onCreated(resource as unknown as ResourceWithUser);
      onOpenChange(false);
      setCategory("");
    } catch {
      // Error handling
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-[#f9f8f5] border-[#d3cfc6]/50 w-full sm:max-w-md p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-[#d3cfc6]/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#ff7c11]/10 flex items-center justify-center">
              <Plus className="w-4 h-4 text-[#ff7c11]" />
            </div>
            <SheetTitle className="text-[#1a1c24] text-sm font-semibold">
              Agregar Recurso
            </SheetTitle>
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-80px)]">
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
            <div className="space-y-1.5">
              <Label className="text-[#535766] text-xs font-medium">
                Nombre *
              </Label>
              <Input
                name="name"
                required
                placeholder="Nombre del recurso"
                className="h-10 bg-white border-[#d3cfc6] text-[#383c48] placeholder:text-[#535766]/40 text-sm focus:border-[#ff7c11] focus:ring-[#ff7c11]/20"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[#535766] text-xs font-medium">
                URL *
              </Label>
              <Input
                name="url"
                type="url"
                required
                placeholder="https://..."
                className="h-10 bg-white border-[#d3cfc6] text-[#383c48] placeholder:text-[#535766]/40 text-sm focus:border-[#ff7c11] focus:ring-[#ff7c11]/20"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[#535766] text-xs font-medium">
                Descripcion
              </Label>
              <Textarea
                name="description"
                placeholder="Descripcion opcional..."
                rows={3}
                className="bg-white border-[#d3cfc6] text-[#383c48] placeholder:text-[#535766]/40 text-sm resize-none focus:border-[#ff7c11] focus:ring-[#ff7c11]/20"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[#535766] text-xs font-medium">
                Categoria *
              </Label>
              <Select
                value={category}
                onValueChange={(v) => setCategory(v ?? "")}
                required
              >
                <SelectTrigger className="h-10 bg-white border-[#d3cfc6] text-sm w-full">
                  <SelectValue placeholder="Seleccionar categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PAPER">Paper</SelectItem>
                  <SelectItem value="TOOL">Herramienta</SelectItem>
                  <SelectItem value="DATASET">Dataset</SelectItem>
                  <SelectItem value="HORIZON_DOC">Horizon</SelectItem>
                  <SelectItem value="REPO">Repo</SelectItem>
                  <SelectItem value="FACULTY_DOC">Facultad</SelectItem>
                  <SelectItem value="OTHER">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="pinned"
                id="pinned"
                className="w-4 h-4 rounded border-[#d3cfc6] text-[#ff7c11] focus:ring-[#ff7c11]/20"
              />
              <Label
                htmlFor="pinned"
                className="text-[#535766] text-xs font-medium cursor-pointer"
              >
                Fijar recurso
              </Label>
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
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Agregar recurso"
                )}
              </Button>
            </div>
          </form>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
