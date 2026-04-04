"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Layers,
  Users,
  Tag,
  Calendar,
  GraduationCap,
  Pencil,
  Save,
  Plus,
  Trash2,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  Camera,
} from "lucide-react";
import { getFileViewUrl } from "@/lib/file-url";
import { UserAvatar } from "@/components/ui/user-avatar";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  updatePhase,
  updateMilestone,
  createMilestone,
  deleteMilestone,
  updateUser,
  addUser,
  resetUserPassword,
  createTag,
  deleteTag,
} from "@/app/(app)/settings/actions";
import type { Phase, Milestone, User, Tag as TagType } from "@/types";

type PhaseWithMilestones = Phase & { milestones: Milestone[] };

export function SettingsPanel({
  phases: initialPhases,
  users: initialUsers,
  tags: initialTags,
}: {
  phases: PhaseWithMilestones[];
  users: User[];
  tags: TagType[];
}) {
  const [phases, setPhases] = useState(initialPhases);
  const [users, setUsers] = useState(initialUsers);
  const [tags, setTags] = useState(initialTags);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-[#1a1c24]">Configuración</h1>
        <p className="text-sm text-[#535766] mt-1">
          Gestioná las fases, hitos, equipo y tags del proyecto.
        </p>
      </div>

      <Tabs defaultValue="phases" className="space-y-4">
        <TabsList className="bg-white/60 border border-[#d3cfc6]/40 p-1 rounded-xl">
          <TabsTrigger value="phases" className="text-xs data-[state=active]:bg-[#ff7c11] data-[state=active]:text-white rounded-lg">
            <Layers className="w-3.5 h-3.5 mr-1.5" />
            Fases & Hitos
          </TabsTrigger>
          <TabsTrigger value="team" className="text-xs data-[state=active]:bg-[#ff7c11] data-[state=active]:text-white rounded-lg">
            <Users className="w-3.5 h-3.5 mr-1.5" />
            Equipo
          </TabsTrigger>
          <TabsTrigger value="tags" className="text-xs data-[state=active]:bg-[#ff7c11] data-[state=active]:text-white rounded-lg">
            <Tag className="w-3.5 h-3.5 mr-1.5" />
            Tags
          </TabsTrigger>
        </TabsList>

        {/* PHASES TAB */}
        <TabsContent value="phases" className="space-y-4">
          {phases.map((phase) => (
            <PhaseCard
              key={phase.id}
              phase={phase}
              allPhases={phases}
              onUpdate={(updated) =>
                setPhases((p) => p.map((x) => (x.id === updated.id ? updated : x)))
              }
            />
          ))}
        </TabsContent>

        {/* TEAM TAB */}
        <TabsContent value="team" className="space-y-4">
          <TeamSection users={users} onUpdate={setUsers} />
        </TabsContent>

        {/* TAGS TAB */}
        <TabsContent value="tags" className="space-y-4">
          <TagsSection tags={tags} onUpdate={setTags} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// --- PHASE CARD ---
function PhaseCard({
  phase,
  allPhases,
  onUpdate,
}: {
  phase: PhaseWithMilestones;
  allPhases: PhaseWithMilestones[];
  onUpdate: (p: PhaseWithMilestones) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(phase.name);
  const [startDate, setStartDate] = useState(format(new Date(phase.startDate), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(new Date(phase.endDate), "yyyy-MM-dd"));
  const [status, setStatus] = useState(phase.status);
  const [progress, setProgress] = useState(phase.progress);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await updatePhase(phase.id, { name, startDate, endDate, status, progress });
      onUpdate({
        ...phase,
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: status as Phase["status"],
        progress,
      });
      setEditing(false);
      toast.success("Fase actualizada");
    } catch {
      toast.error("Error al actualizar fase");
    } finally {
      setSaving(false);
    }
  }

  const statusColors: Record<string, string> = {
    NOT_STARTED: "bg-[#e9e7df] text-[#535766]",
    IN_PROGRESS: "bg-[#ff7c11]/10 text-[#ff7c11]",
    COMPLETED: "bg-emerald-50 text-emerald-600",
  };

  return (
    <div className="rounded-2xl bg-white/60 border border-[#d3cfc6]/40 overflow-hidden">
      {/* Phase header */}
      <div
        className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-[#e9e7df]/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-[#535766]" />
        ) : (
          <ChevronRight className="w-4 h-4 text-[#535766]" />
        )}
        <span className="w-7 h-7 rounded-lg bg-[#ff7c11]/10 flex items-center justify-center text-xs font-bold text-[#ff7c11]">
          {phase.number}
        </span>
        <div className="flex-1">
          <p className="text-sm font-medium text-[#1a1c24]">{phase.name}</p>
          <p className="text-[10px] text-[#535766]">
            {format(new Date(phase.startDate), "dd/MM/yy")} — {format(new Date(phase.endDate), "dd/MM/yy")}
          </p>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColors[phase.status]}`}>
          {phase.status === "NOT_STARTED" ? "Sin empezar" : phase.status === "IN_PROGRESS" ? "En progreso" : "Completada"}
        </span>
        <span className="text-xs font-mono text-[#535766]">{phase.progress}%</span>
      </div>

      {expanded && (
        <div className="border-t border-[#d3cfc6]/30 px-5 py-4 space-y-4">
          {/* Edit phase */}
          {editing ? (
            <div className="space-y-3 p-4 rounded-xl bg-[#f2f0ea]/50 border border-[#d3cfc6]/30">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[#535766] text-xs">Nombre</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} className="h-9 bg-white border-[#d3cfc6] text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[#535766] text-xs">Estado</Label>
                  <Select value={status} onValueChange={(v) => setStatus(v ?? status)}>
                    <SelectTrigger className="h-9 bg-white border-[#d3cfc6] text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NOT_STARTED">Sin empezar</SelectItem>
                      <SelectItem value="IN_PROGRESS">En progreso</SelectItem>
                      <SelectItem value="COMPLETED">Completada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-[#535766] text-xs">Inicio</Label>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-9 bg-white border-[#d3cfc6] text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[#535766] text-xs">Fin</Label>
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-9 bg-white border-[#d3cfc6] text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[#535766] text-xs">Progreso (%)</Label>
                  <Input type="number" min={0} max={100} value={progress} onChange={(e) => setProgress(Number(e.target.value))} className="h-9 bg-white border-[#d3cfc6] text-sm" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSave} disabled={saving} className="text-xs bg-[#ff7c11] hover:bg-[#ff9a3e] text-white">
                  <Save className="w-3 h-3 mr-1" />Guardar
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditing(false)} className="text-xs border-[#d3cfc6]">
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setEditing(true)} className="text-xs border-[#d3cfc6] text-[#535766]">
              <Pencil className="w-3 h-3 mr-1" />Editar fase
            </Button>
          )}

          {/* Milestones */}
          <div>
            <h4 className="text-[10px] uppercase tracking-widest text-[#535766] mb-2">
              Hitos ({phase.milestones.length})
            </h4>
            <div className="space-y-2">
              {phase.milestones.map((m) => (
                <MilestoneRow key={m.id} milestone={m} onDeleted={() => {
                  onUpdate({ ...phase, milestones: phase.milestones.filter((x) => x.id !== m.id) });
                }} />
              ))}
            </div>
            <AddMilestoneRow phaseId={phase.id} onAdded={(m) => {
              onUpdate({ ...phase, milestones: [...phase.milestones, m] });
            }} />
          </div>
        </div>
      )}
    </div>
  );
}

// --- MILESTONE ROW ---
function MilestoneRow({ milestone, onDeleted }: { milestone: Milestone; onDeleted: () => void }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(milestone.name);
  const [dueDate, setDueDate] = useState(format(new Date(milestone.dueDate), "yyyy-MM-dd"));
  const [status, setStatus] = useState(milestone.status);

  async function handleSave() {
    await updateMilestone(milestone.id, { name, dueDate, status });
    setEditing(false);
  }

  async function handleDelete() {
    if (!confirm(`Eliminar hito "${milestone.name}"?`)) return;
    try {
      await deleteMilestone(milestone.id);
      onDeleted();
      toast.success("Hito eliminado");
    } catch {
      toast.error("Error al eliminar hito");
    }
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2 p-2 rounded-lg bg-[#f2f0ea]/50">
        <Input value={name} onChange={(e) => setName(e.target.value)} className="h-8 bg-white border-[#d3cfc6] text-xs flex-1" />
        <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="h-8 bg-white border-[#d3cfc6] text-xs w-36" />
        <Select value={status} onValueChange={(v) => setStatus(v ?? status)}>
          <SelectTrigger className="h-8 bg-white border-[#d3cfc6] text-xs w-28"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="PENDING">Pendiente</SelectItem>
            <SelectItem value="AT_RISK">En riesgo</SelectItem>
            <SelectItem value="COMPLETED">Completado</SelectItem>
          </SelectContent>
        </Select>
        <Button size="sm" onClick={handleSave} className="h-8 text-xs bg-[#ff7c11] text-white px-2"><Save className="w-3 h-3" /></Button>
        <Button size="sm" variant="ghost" onClick={() => setEditing(false)} className="h-8 text-xs px-2">✕</Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#e9e7df]/30 transition-colors group">
      <span className="text-[10px] font-mono text-[#ff7c11] font-bold w-7">{milestone.code}</span>
      {milestone.isFaculty && <GraduationCap className="w-3 h-3 text-[#1a1c24]" />}
      <span className="text-xs text-[#383c48] flex-1">{milestone.name}</span>
      <span className="text-[10px] text-[#535766] font-mono">
        <Calendar className="w-3 h-3 inline mr-1" />
        {format(new Date(milestone.dueDate), "dd/MM/yy")}
      </span>
      <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
        <button onClick={() => setEditing(true)} className="p-1 rounded text-[#535766] hover:text-[#ff7c11]">
          <Pencil className="w-3 h-3" />
        </button>
        <button onClick={handleDelete} className="p-1 rounded text-[#535766] hover:text-red-500">
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

// --- ADD MILESTONE ---
function AddMilestoneRow({ phaseId, onAdded }: { phaseId: string; onAdded: (m: Milestone) => void }) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isFaculty, setIsFaculty] = useState(false);

  async function handleAdd() {
    if (!code || !name || !dueDate) return;
    try {
      await createMilestone({ code, name, dueDate, phaseId, isFaculty });
      onAdded({ id: "temp-" + Date.now(), code, name, dueDate: new Date(dueDate), phaseId, isFaculty, status: "PENDING", createdAt: new Date() } as Milestone);
      setCode(""); setName(""); setDueDate(""); setIsFaculty(false); setOpen(false);
      toast.success("Hito agregado");
    } catch {
      toast.error("Error al agregar hito");
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="flex items-center gap-1.5 mt-2 text-xs text-[#535766] hover:text-[#ff7c11] transition-colors">
        <Plus className="w-3 h-3" />Agregar hito
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 mt-2 p-2 rounded-lg bg-[#f2f0ea]/50">
      <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="H13" className="h-8 bg-white border-[#d3cfc6] text-xs w-16" />
      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre del hito" className="h-8 bg-white border-[#d3cfc6] text-xs flex-1" />
      <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="h-8 bg-white border-[#d3cfc6] text-xs w-36" />
      <label className="flex items-center gap-1 text-[10px] text-[#535766] cursor-pointer">
        <input type="checkbox" checked={isFaculty} onChange={(e) => setIsFaculty(e.target.checked)} className="rounded" />
        Fac.
      </label>
      <Button size="sm" onClick={handleAdd} className="h-8 text-xs bg-[#ff7c11] text-white px-2"><Plus className="w-3 h-3" /></Button>
      <Button size="sm" variant="ghost" onClick={() => setOpen(false)} className="h-8 text-xs px-2">✕</Button>
    </div>
  );
}

// --- TEAM SECTION ---
function TeamSection({ users, onUpdate }: { users: User[]; onUpdate: (u: User[]) => void }) {
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");

  async function handleAdd() {
    if (!newName || !newEmail) return;
    try {
      await addUser({ name: newName, email: newEmail, role: "member" });
      onUpdate([...users, { id: "temp-" + Date.now(), name: newName, email: newEmail, role: "member", password: "", needsSetup: true, avatar: null, createdAt: new Date() } as unknown as User]);
      setNewName(""); setNewEmail(""); setShowAdd(false);
      toast.success("Usuario agregado");
    } catch {
      toast.error("Error al agregar usuario");
    }
  }

  return (
    <div className="rounded-2xl bg-white/60 border border-[#d3cfc6]/40 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#1a1c24]">Integrantes del equipo</h3>
        <Button size="sm" onClick={() => setShowAdd(!showAdd)} className="text-xs bg-[#ff7c11] hover:bg-[#ff9a3e] text-white">
          <Plus className="w-3 h-3 mr-1" />Agregar
        </Button>
      </div>

      {showAdd && (
        <div className="flex items-end gap-2 p-3 rounded-xl bg-[#f2f0ea]/50 border border-[#d3cfc6]/30">
          <div className="space-y-1 flex-1">
            <Label className="text-[#535766] text-xs">Nombre</Label>
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nombre" className="h-9 bg-white border-[#d3cfc6] text-sm" />
          </div>
          <div className="space-y-1 flex-1">
            <Label className="text-[#535766] text-xs">Email</Label>
            <Input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="email@correo.um.edu.uy" className="h-9 bg-white border-[#d3cfc6] text-sm" />
          </div>
          <Button size="sm" onClick={handleAdd} className="h-9 text-xs bg-[#ff7c11] text-white">Agregar</Button>
          <Button size="sm" variant="outline" onClick={() => setShowAdd(false)} className="h-9 text-xs border-[#d3cfc6]">✕</Button>
        </div>
      )}

      <div className="space-y-2">
        {users.map((user) => (
          <UserRow key={user.id} user={user} />
        ))}
      </div>
    </div>
  );
}

function UserRow({ user }: { user: User }) {
  const [resetting, setResetting] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user.avatar || "");
  const [uploading, setUploading] = useState(false);

  async function handleReset() {
    if (!confirm(`¿Resetear contraseña de ${user.name}? Deberá configurarla nuevamente en /setup`)) return;
    setResetting(true);
    try {
      await resetUserPassword(user.id);
      toast.success("Contraseña reseteada");
    } catch {
      toast.error("Error al resetear contraseña");
    } finally {
      setResetting(false);
    }
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/profile/avatar", { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        setAvatarUrl(data.url);
      }
    } catch (err) {
      console.error("Avatar upload failed:", err);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-[#e9e7df]/30 transition-colors">
      <div className="relative group">
        <UserAvatar user={{ ...user, avatar: avatarUrl || user.avatar }} size="sm" className="!w-8 !h-8 !text-[11px]" />
        <label className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
          {uploading ? (
            <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Camera className="w-3 h-3 text-white" />
          )}
          <input
            type="file"
            accept="image/png,image/jpeg,image/gif,image/webp"
            onChange={handleAvatarUpload}
            className="hidden"
            disabled={uploading}
          />
        </label>
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-[#1a1c24]">{user.name}</p>
        <p className="text-[10px] text-[#535766]">{user.email}</p>
      </div>
      <span className="px-2 py-0.5 rounded-full text-[9px] font-medium bg-[#e9e7df] text-[#535766] uppercase tracking-wider">
        {user.role}
      </span>
      <Button size="sm" variant="ghost" onClick={handleReset} disabled={resetting} className="text-xs text-[#535766] hover:text-[#ff7c11]" title="Resetear contraseña">
        <RotateCcw className="w-3 h-3" />
      </Button>
    </div>
  );
}

// --- TAGS SECTION ---
function TagsSection({ tags, onUpdate }: { tags: TagType[]; onUpdate: (t: TagType[]) => void }) {
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#ff7c11");

  async function handleAdd() {
    if (!newName) return;
    try {
      await createTag({ name: newName, color: newColor });
      onUpdate([...tags, { id: "temp-" + Date.now(), name: newName, color: newColor } as TagType]);
      setNewName(""); setNewColor("#ff7c11"); setShowAdd(false);
      toast.success("Tag creado");
    } catch {
      toast.error("Error al crear tag");
    }
  }

  async function handleDelete(tag: TagType) {
    if (!confirm(`Eliminar tag "${tag.name}"?`)) return;
    try {
      await deleteTag(tag.id);
      onUpdate(tags.filter((t) => t.id !== tag.id));
      toast.success("Tag eliminado");
    } catch {
      toast.error("Error al eliminar tag");
    }
  }

  return (
    <div className="rounded-2xl bg-white/60 border border-[#d3cfc6]/40 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#1a1c24]">Tags del proyecto</h3>
        <Button size="sm" onClick={() => setShowAdd(!showAdd)} className="text-xs bg-[#ff7c11] hover:bg-[#ff9a3e] text-white">
          <Plus className="w-3 h-3 mr-1" />Agregar
        </Button>
      </div>

      {showAdd && (
        <div className="flex items-end gap-2 p-3 rounded-xl bg-[#f2f0ea]/50 border border-[#d3cfc6]/30">
          <div className="space-y-1 flex-1">
            <Label className="text-[#535766] text-xs">Nombre</Label>
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nombre del tag" className="h-9 bg-white border-[#d3cfc6] text-sm" />
          </div>
          <div className="space-y-1">
            <Label className="text-[#535766] text-xs">Color</Label>
            <Input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)} className="h-9 w-16 bg-white border-[#d3cfc6] p-1" />
          </div>
          <Button size="sm" onClick={handleAdd} className="h-9 text-xs bg-[#ff7c11] text-white">Agregar</Button>
          <Button size="sm" variant="outline" onClick={() => setShowAdd(false)} className="h-9 text-xs border-[#d3cfc6]">✕</Button>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <div
            key={tag.id}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#d3cfc6]/40 bg-white/60 group hover:border-[#d3cfc6] transition-colors"
          >
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: tag.color }} />
            <span className="text-xs text-[#383c48] font-medium">{tag.name}</span>
            <button
              onClick={() => handleDelete(tag)}
              className="opacity-0 group-hover:opacity-100 p-0.5 text-[#535766] hover:text-red-500 transition-all"
            >
              <Trash2 className="w-2.5 h-2.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
