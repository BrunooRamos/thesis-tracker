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
import { Loader2, Plus, X, Upload, FileText, ExternalLink, Check } from "lucide-react";
import { createMeetingNote, updateMeetingNote } from "@/app/(app)/meetings/actions";
import type { MeetingNoteWithAuthor } from "./meetings-page";
import type { User } from "@/types";

interface Attachment {
  type: "file" | "link";
  name: string;
  url: string;
  fileType?: string;
}

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
  editingItem,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (meeting: MeetingNoteWithAuthor) => void;
  users: User[];
  editingItem?: MeetingNoteWithAuthor | null;
}) {
  const isEditing = !!editingItem;
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState(editingItem?.type || "");
  const [actionItems, setActionItems] = useState<ActionItemInput[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>(
    (editingItem?.attachments as unknown as Attachment[]) || []
  );
  const [uploading, setUploading] = useState(false);
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [linkName, setLinkName] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  function addActionItem() {
    setActionItems((prev) => [...prev, { task: "", assignee: "", dueDate: "" }]);
  }

  function removeActionItem(index: number) {
    setActionItems((prev) => prev.filter((_, i) => i !== index));
  }

  function updateActionItem(index: number, field: keyof ActionItemInput, value: string) {
    setActionItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok) {
        setAttachments((prev) => [
          ...prev,
          { type: "file", name: data.fileName, url: data.url, fileType: data.fileType },
        ]);
      } else {
        alert(data.error || "Error al subir archivo");
      }
    } catch {
      alert("Error al subir archivo");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function addLink() {
    if (!linkName.trim() || !linkUrl.trim()) return;
    setAttachments((prev) => [...prev, { type: "link", name: linkName.trim(), url: linkUrl.trim() }]);
    setLinkName("");
    setLinkUrl("");
    setShowLinkForm(false);
  }

  function removeAttachment(index: number) {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set("type", type);

    const validItems = actionItems.filter((ai) => ai.task.trim());
    formData.set("actionItems", JSON.stringify(validItems));
    formData.set("attachments", JSON.stringify(attachments));

    try {
      if (isEditing && editingItem) {
        const attendeesStr = formData.get("attendees") as string | null;
        const attendees = attendeesStr
          ? attendeesStr.split(",").map((a) => a.trim()).filter(Boolean)
          : [];
        await updateMeetingNote(editingItem.id, {
          title: formData.get("title") as string,
          date: formData.get("date") as string,
          type: type as "HORIZON_CHECKIN" | "TEAM_INTERNAL" | "TUTOR_ACADEMIC" | "OTHER",
          attendees,
          summary: formData.get("summary") as string,
          actionItems: validItems as unknown as Record<string, unknown>[],
          keyDecisions: (formData.get("keyDecisions") as string) || null,
          attachments: attachments as unknown[],
        });
        const res = await fetch(`/api/meetings/${editingItem.id}`);
        if (res.ok) {
          const full = await res.json();
          onCreated(full);
        }
      } else {
        const meeting = await createMeetingNote(formData);
        const res = await fetch(`/api/meetings/${meeting.id}`);
        if (res.ok) {
          const full = await res.json();
          onCreated(full);
          setType("");
          setActionItems([]);
          setAttachments([]);
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

  const typeLabels: Record<string, string> = {
    HORIZON_CHECKIN: "Horizon Check-in",
    TEAM_INTERNAL: "Interna",
    TUTOR_ACADEMIC: "Tutor Académico",
    OTHER: "Otra",
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-[#f9f8f5] border-[#d3cfc6]/50 w-full sm:max-w-2xl p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-[#d3cfc6]/40">
          <SheetTitle className="text-[#1a1c24] text-base font-semibold">
            {isEditing ? "Editar reunión" : "Nueva reunión"}
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-100px)]">
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            <div>
              <Label className="text-[10px] text-[#535766] uppercase tracking-wider">Título *</Label>
              <Input
                name="title"
                required
                defaultValue={editingItem?.title || ""}
                placeholder="Nombre de la reunión"
                className="mt-1.5 h-9 text-xs bg-white border-[#d3cfc6] text-[#383c48] placeholder:text-[#535766]/50 focus:border-[#ff7c11]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[10px] text-[#535766] uppercase tracking-wider">Fecha *</Label>
                <Input
                  name="date"
                  type="date"
                  required
                  defaultValue={editingItem ? new Date(editingItem.date).toISOString().split("T")[0] : ""}
                  className="mt-1.5 h-9 text-xs bg-white border-[#d3cfc6] text-[#383c48] focus:border-[#ff7c11]"
                />
              </div>
              <div>
                <Label className="text-[10px] text-[#535766] uppercase tracking-wider">Tipo *</Label>
                <Select value={type} onValueChange={(v) => setType(v ?? "")}>
                  <SelectTrigger className="mt-1.5 h-9 text-xs bg-white border-[#d3cfc6]">
                    <SelectValue placeholder="Seleccionar...">
                      {type ? typeLabels[type] : "Seleccionar..."}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HORIZON_CHECKIN">Horizon Check-in</SelectItem>
                    <SelectItem value="TEAM_INTERNAL">Interna</SelectItem>
                    <SelectItem value="TUTOR_ACADEMIC">Tutor Académico</SelectItem>
                    <SelectItem value="OTHER">Otra</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-[10px] text-[#535766] uppercase tracking-wider">Asistentes</Label>
              <Input
                name="attendees"
                defaultValue={editingItem?.attendees?.join(", ") || ""}
                placeholder="Nombres separados por coma"
                className="mt-1.5 h-9 text-xs bg-white border-[#d3cfc6] text-[#383c48] placeholder:text-[#535766]/50 focus:border-[#ff7c11]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label className="text-[10px] text-[#535766] uppercase tracking-wider">Resumen *</Label>
                <span className="text-[9px] text-[#535766]/50">Soporta Markdown</span>
              </div>
              <Textarea
                name="summary"
                required
                rows={4}
                defaultValue={editingItem?.summary || ""}
                placeholder={"# Temas discutidos\n\n- Punto 1\n- Punto 2\n\n**Conclusión:** ..."}
                className="mt-1.5 text-xs bg-white border-[#d3cfc6] text-[#383c48] placeholder:text-[#535766]/50 focus:border-[#ff7c11] resize-none font-mono"
              />
            </div>

            <div>
              <Label className="text-[10px] text-[#535766] uppercase tracking-wider">Decisiones clave</Label>
              <Textarea
                name="keyDecisions"
                rows={2}
                defaultValue={editingItem?.keyDecisions || ""}
                placeholder="Decisiones tomadas en la reunión..."
                className="mt-1.5 text-xs bg-white border-[#d3cfc6] text-[#383c48] placeholder:text-[#535766]/50 focus:border-[#ff7c11] resize-none"
              />
            </div>

            {/* Archivos y Links */}
            <div>
              <Label className="text-[10px] text-[#535766] uppercase tracking-wider">
                Archivos y Links
              </Label>

              {attachments.length > 0 && (
                <div className="mt-1.5 space-y-1.5">
                  {attachments.map((item, index) => (
                    <div key={index} className="flex items-center gap-2 bg-white border border-[#d3cfc6]/40 rounded-lg p-2.5">
                      <div className="w-7 h-7 rounded-md bg-[#ff7c11]/10 flex items-center justify-center shrink-0">
                        {item.type === "file" ? (
                          <FileText className="w-3.5 h-3.5 text-[#ff7c11]" />
                        ) : (
                          <ExternalLink className="w-3.5 h-3.5 text-[#ff7c11]" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-[#1a1c24] font-medium truncate">{item.name}</p>
                        <p className="text-[9px] text-[#535766] truncate">
                          {item.type === "file" ? item.fileType : item.url}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className="text-[#535766]/40 hover:text-red-400 transition-colors shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {showLinkForm && (
                <div className="mt-2 flex items-center gap-2">
                  <Input
                    value={linkName}
                    onChange={(e) => setLinkName(e.target.value)}
                    placeholder="Nombre"
                    className="h-8 text-xs bg-white border-[#d3cfc6] text-[#383c48] placeholder:text-[#535766]/50 focus:border-[#ff7c11] flex-1"
                  />
                  <Input
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://..."
                    className="h-8 text-xs bg-white border-[#d3cfc6] text-[#383c48] placeholder:text-[#535766]/50 focus:border-[#ff7c11] flex-[2]"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={addLink}
                    className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 shrink-0"
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => { setShowLinkForm(false); setLinkName(""); setLinkUrl(""); }}
                    className="h-8 w-8 p-0 text-[#535766]/40 hover:text-red-400 hover:bg-red-50 shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}

              <div className="mt-2 flex gap-2">
                <label className="flex-1 flex items-center justify-center gap-1.5 bg-white border border-dashed border-[#d3cfc6] rounded-lg py-2 cursor-pointer hover:border-[#ff7c11]/50 transition-colors">
                  {uploading ? (
                    <Loader2 className="w-3.5 h-3.5 text-[#ff7c11] animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5 text-[#ff7c11]" />
                  )}
                  <span className="text-[10px] text-[#383c48] font-medium">
                    {uploading ? "Subiendo..." : "Subir archivo"}
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.md,.markdown,.txt"
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setShowLinkForm(true)}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-white border border-dashed border-[#d3cfc6] rounded-lg py-2 hover:border-[#ff7c11]/50 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-[#ff7c11]" />
                  <span className="text-[10px] text-[#383c48] font-medium">Agregar link</span>
                </button>
              </div>
            </div>

            {/* Action items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-[10px] text-[#535766] uppercase tracking-wider">
                  Acciones → Tareas
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

              {actionItems.length === 0 ? (
                <p className="text-[10px] text-[#535766]/50 italic">
                  Las acciones se convierten en tareas asignables desde el detalle.
                </p>
              ) : (
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

                      <Input
                        value={item.task}
                        onChange={(e) => updateActionItem(index, "task", e.target.value)}
                        placeholder="Qué hay que hacer"
                        className="h-8 text-xs bg-white border-[#d3cfc6] text-[#383c48] placeholder:text-[#535766]/50 focus:border-[#ff7c11]"
                      />

                      <div className="grid grid-cols-2 gap-2">
                        <Select
                          value={item.assignee || undefined}
                          onValueChange={(v) => updateActionItem(index, "assignee", v ?? "")}
                        >
                          <SelectTrigger className="h-8 text-xs bg-white border-[#d3cfc6]">
                            <SelectValue placeholder="Responsable">
                              {item.assignee || "Responsable"}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {users.map((u) => (
                              <SelectItem key={u.id} value={u.name}>{u.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          type="date"
                          value={item.dueDate}
                          onChange={(e) => updateActionItem(index, "dueDate", e.target.value)}
                          className="h-8 text-xs bg-white border-[#d3cfc6] text-[#383c48] focus:border-[#ff7c11]"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={loading || !type}
                className="w-full bg-[#ff7c11] hover:bg-[#ff9a3e] text-white rounded-full"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                {isEditing ? "Guardar cambios" : "Registrar reunión"}
              </Button>
            </div>
          </form>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
