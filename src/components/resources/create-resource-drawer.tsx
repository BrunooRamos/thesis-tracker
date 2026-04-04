"use client";

import { useState, useRef } from "react";
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
import { Loader2, Plus, Upload, Link, FileUp, Check } from "lucide-react";
import { createResource } from "@/app/(app)/resources/actions";
import type { ResourceWithRelations } from "./resource-detail-sheet";

type SourceMode = "link" | "file";

export function CreateResourceDrawer({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (resource: ResourceWithRelations) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [sourceMode, setSourceMode] = useState<SourceMode>("link");
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [pinned, setPinned] = useState(false);
  const [fileUrl, setFileUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileType, setFileType] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function resetForm() {
    setName("");
    setUrl("");
    setDescription("");
    setCategory("");
    setPinned(false);
    setFileUrl("");
    setFileName("");
    setFileType("");
    setSourceMode("link");
  }

  async function handleFileUpload(file: File) {
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Upload failed");
      }
      const data = await res.json();
      setFileUrl(data.url);
      setFileName(data.fileName);
      setFileType(data.fileType);
      if (!name) setName(data.fileName.replace(/\.[^.]+$/, ""));
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !category) return;
    if (sourceMode === "link" && !url.trim()) return;
    if (sourceMode === "file" && !fileUrl) return;

    setLoading(true);
    const formData = new FormData();
    formData.set("name", name);
    if (sourceMode === "link") {
      formData.set("url", url);
    } else {
      formData.set("fileUrl", fileUrl);
      formData.set("fileName", fileName);
      formData.set("fileType", fileType);
    }
    if (description) formData.set("description", description);
    formData.set("category", category);
    if (pinned) formData.set("pinned", "on");

    try {
      const resource = await createResource(formData);
      onCreated(resource as unknown as ResourceWithRelations);
      onOpenChange(false);
      resetForm();
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
              <Plus className="w-4 h-4 text-[#ff7c11]" />
            </div>
            <SheetTitle className="text-[#1a1c24] text-sm font-semibold">
              Agregar Recurso
            </SheetTitle>
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-80px)]">
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
            {/* Source mode toggle */}
            <div className="flex gap-1 p-1 bg-white border border-[#d3cfc6]/40 rounded-lg">
              <button
                type="button"
                onClick={() => setSourceMode("link")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-xs font-medium transition-colors ${
                  sourceMode === "link"
                    ? "bg-[#ff7c11] text-white"
                    : "text-[#535766] hover:bg-[#e9e7df]/50"
                }`}
              >
                <Link className="w-3.5 h-3.5" />
                Enlace
              </button>
              <button
                type="button"
                onClick={() => setSourceMode("file")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-xs font-medium transition-colors ${
                  sourceMode === "file"
                    ? "bg-[#ff7c11] text-white"
                    : "text-[#535766] hover:bg-[#e9e7df]/50"
                }`}
              >
                <FileUp className="w-3.5 h-3.5" />
                Archivo
              </button>
            </div>

            {/* Link mode: URL field */}
            {sourceMode === "link" && (
              <div className="space-y-1.5">
                <Label className="text-[#535766] text-xs font-medium">
                  URL *
                </Label>
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  type="url"
                  required={sourceMode === "link"}
                  placeholder="https://..."
                  className="h-10 bg-white border-[#d3cfc6] text-[#383c48] placeholder:text-[#535766]/40 text-sm focus:border-[#ff7c11] focus:ring-[#ff7c11]/20"
                />
              </div>
            )}

            {/* File mode: Drop zone */}
            {sourceMode === "file" && (
              <div className="space-y-1.5">
                <Label className="text-[#535766] text-xs font-medium">
                  Archivo *
                </Label>
                {fileUrl ? (
                  <div className="flex items-center gap-2.5 px-4 py-3 bg-white border border-[#d3cfc6] rounded-lg">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="text-sm text-[#383c48] truncate flex-1">
                      {fileName}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setFileUrl("");
                        setFileName("");
                        setFileType("");
                      }}
                      className="text-[10px] text-[#535766] hover:text-[#ff7c11] shrink-0"
                    >
                      Cambiar
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    className="flex flex-col items-center justify-center gap-2 py-8 px-4 border-2 border-dashed border-[#d3cfc6] rounded-lg bg-white hover:border-[#ff7c11]/50 hover:bg-[#ff7c11]/5 cursor-pointer transition-colors"
                  >
                    {uploading ? (
                      <Loader2 className="w-6 h-6 text-[#ff7c11] animate-spin" />
                    ) : (
                      <Upload className="w-6 h-6 text-[#535766]/50" />
                    )}
                    <span className="text-xs text-[#535766] text-center">
                      {uploading
                        ? "Subiendo archivo..."
                        : "Arrastra un archivo o hace click para seleccionar"}
                    </span>
                    <span className="text-[10px] text-[#535766]/50">
                      PDF, PNG, JPG -- max. 10MB
                    </span>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.gif,.webp"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-[#535766] text-xs font-medium">
                Nombre *
              </Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Nombre del recurso"
                className="h-10 bg-white border-[#d3cfc6] text-[#383c48] placeholder:text-[#535766]/40 text-sm focus:border-[#ff7c11] focus:ring-[#ff7c11]/20"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[#535766] text-xs font-medium">
                Descripcion
              </Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
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
                id="pinned"
                checked={pinned}
                onChange={(e) => setPinned(e.target.checked)}
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
                onClick={() => {
                  resetForm();
                  onOpenChange(false);
                }}
                className="flex-1 h-10 text-sm border-[#d3cfc6] text-[#535766] hover:bg-[#e9e7df]/50"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={
                  loading ||
                  !name.trim() ||
                  !category ||
                  (sourceMode === "link" && !url.trim()) ||
                  (sourceMode === "file" && !fileUrl)
                }
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
