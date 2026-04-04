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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Trash2, Send, GitBranch, FlaskConical, Scale, Pencil } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { deleteExperiment, addExperimentComment } from "@/app/(app)/experiments/actions";
import type { ExperimentWithRelations } from "./experiment-lab";
import type { User } from "@/types";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  PLANNED: "bg-[#e9e7df] text-[#535766]",
  RUNNING: "bg-[#ff7c11]/10 text-[#ff7c11]",
  COMPLETED: "bg-emerald-50 text-emerald-600",
  FAILED: "bg-red-50 text-red-500",
};

const ARCHITECTURE_COLORS: Record<string, string> = {
  RLM: "bg-violet-100 text-violet-700",
  "Deep Agent": "bg-blue-100 text-blue-700",
  ReAct: "bg-amber-100 text-amber-700",
  RAG: "bg-emerald-100 text-emerald-700",
  CoT: "bg-rose-100 text-rose-700",
  Custom: "bg-zinc-100 text-zinc-600",
};

export function ExperimentDetailDrawer({
  experiment,
  onClose,
  users,
  onUpdated,
  onDeleted,
  onEdit,
}: {
  experiment: ExperimentWithRelations | null;
  onClose: () => void;
  users: User[];
  onUpdated: (experiment: ExperimentWithRelations) => void;
  onDeleted: (id: string) => void;
  onEdit?: (experiment: ExperimentWithRelations) => void;
}) {
  const [comment, setComment] = useState("");
  const [sendingComment, setSendingComment] = useState(false);

  if (!experiment) return null;

  async function handleFieldChange(field: string, value: string | number | null) {
    if (!experiment) return;
    const res = await fetch(`/api/experiments/${experiment.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    if (res.ok) {
      const updated = await res.json();
      onUpdated(updated);
    }
  }

  async function handleMetricChange(field: string, raw: string) {
    if (!experiment) return;
    const value = raw === "" ? null : Number(raw);
    if (raw !== "" && isNaN(value as number)) return;
    await handleFieldChange(field, value);
  }

  async function handleTextFieldBlur(field: string, value: string) {
    if (!experiment) return;
    const current = experiment[field as keyof typeof experiment] as string | null;
    if (value === (current || "")) return;
    await handleFieldChange(field, value || null);
  }

  async function handleDelete() {
    if (!experiment) return;
    if (!confirm("Eliminar este experimento?")) return;
    await deleteExperiment(experiment.id);
    onDeleted(experiment.id);
  }

  async function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim() || !experiment) return;
    setSendingComment(true);
    await addExperimentComment(experiment.id, comment);
    const res = await fetch(`/api/experiments/${experiment.id}`);
    if (res.ok) {
      const updated = await res.json();
      onUpdated(updated);
    }
    setComment("");
    setSendingComment(false);
  }

  return (
    <Sheet open={!!experiment} onOpenChange={() => onClose()}>
      <SheetContent className="bg-[#f9f8f5] border-[#d3cfc6]/50 w-full sm:max-w-lg p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-[#d3cfc6]/40">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-medium", ARCHITECTURE_COLORS[experiment.architecture] || ARCHITECTURE_COLORS["Custom"])}>
                  {experiment.architecture}
                </span>
                <span className="text-[10px] font-mono text-[#535766]">v{experiment.iteration}</span>
              </div>
              <SheetTitle className="text-[#1a1c24] text-base font-semibold leading-snug">
                {experiment.name}
              </SheetTitle>
            </div>
            <div className="flex items-center gap-1">
              {onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { onClose(); onEdit(experiment); }}
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
            {/* Status */}
            <div>
              <label className="text-[10px] text-[#535766] uppercase tracking-wider block mb-1.5">
                Estado
              </label>
              <Select
                value={experiment.status}
                onValueChange={(v) => handleFieldChange("status", v ?? "")}
              >
                <SelectTrigger className="h-8 text-xs bg-white border-[#d3cfc6] w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PLANNED">Planned</SelectItem>
                  <SelectItem value="RUNNING">Running</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Hypothesis */}
            {experiment.hypothesis && (
              <div>
                <label className="text-[10px] text-[#535766] uppercase tracking-wider block mb-1.5">
                  Hipotesis
                </label>
                <p className="text-xs text-[#535766] leading-relaxed whitespace-pre-wrap">
                  {experiment.hypothesis}
                </p>
              </div>
            )}

            {/* Dataset */}
            {experiment.dataset && (
              <div>
                <label className="text-[10px] text-[#535766] uppercase tracking-wider block mb-1.5">
                  Dataset
                </label>
                <p className="text-xs text-[#383c48] font-mono">{experiment.dataset}</p>
              </div>
            )}

            {/* Configuration */}
            {experiment.configuration && (
              <div>
                <label className="text-[10px] text-[#535766] uppercase tracking-wider block mb-1.5">
                  Configuracion
                </label>
                <pre className="text-[11px] text-[#383c48] bg-white rounded-lg border border-[#d3cfc6] p-3 overflow-x-auto font-mono leading-relaxed">
                  {JSON.stringify(experiment.configuration, null, 2)}
                </pre>
              </div>
            )}

            <Separator className="bg-[#e9e7df]/80" />

            {/* Metrics */}
            <div>
              <label className="text-[10px] text-[#535766] uppercase tracking-wider block mb-3">
                Metricas
              </label>
              <div className="grid grid-cols-2 gap-3">
                <MetricInput
                  label="Exhaustividad (0-1)"
                  value={experiment.exhaustivity}
                  onChange={(v) => handleMetricChange("exhaustivity", v)}
                  step="0.01"
                  min="0"
                  max="1"
                />
                <MetricInput
                  label="Precision (0-1)"
                  value={experiment.precision}
                  onChange={(v) => handleMetricChange("precision", v)}
                  step="0.01"
                  min="0"
                  max="1"
                />
                <MetricInput
                  label="Latencia (seg)"
                  value={experiment.latency}
                  onChange={(v) => handleMetricChange("latency", v)}
                  step="0.01"
                  min="0"
                />
                <MetricInput
                  label="Costo (USD)"
                  value={experiment.cost}
                  onChange={(v) => handleMetricChange("cost", v)}
                  step="0.001"
                  min="0"
                />
                <MetricInput
                  label="Token Count"
                  value={experiment.tokenCount}
                  onChange={(v) => handleMetricChange("tokenCount", v)}
                  step="1"
                  min="0"
                />
              </div>
            </div>

            <Separator className="bg-[#e9e7df]/80" />

            {/* Results / Analysis / Next Steps */}
            <TextAreaField
              label="Resultados"
              defaultValue={experiment.results || ""}
              onBlur={(v) => handleTextFieldBlur("results", v)}
            />
            <TextAreaField
              label="Analisis"
              defaultValue={experiment.analysis || ""}
              onBlur={(v) => handleTextFieldBlur("analysis", v)}
            />
            <TextAreaField
              label="Proximos pasos"
              defaultValue={experiment.nextSteps || ""}
              onBlur={(v) => handleTextFieldBlur("nextSteps", v)}
            />

            {/* Iterations */}
            {(experiment.parentExperiment || experiment.childExperiments.length > 0) && (
              <>
                <Separator className="bg-[#e9e7df]/80" />
                <div>
                  <label className="text-[10px] text-[#535766] uppercase tracking-wider block mb-2">
                    <GitBranch className="w-3 h-3 inline mr-1" />
                    Iteraciones
                  </label>
                  <div className="space-y-1.5">
                    {experiment.parentExperiment && (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/60 border border-[#d3cfc6]/30 text-xs">
                        <FlaskConical className="w-3 h-3 text-[#535766]" />
                        <span className="text-[#535766]">Padre:</span>
                        <span className="text-[#383c48] font-medium">{experiment.parentExperiment.name}</span>
                        <span className="text-[10px] font-mono text-[#535766] ml-auto">v{experiment.parentExperiment.iteration}</span>
                      </div>
                    )}
                    {experiment.childExperiments.map((child) => (
                      <div
                        key={child.id}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/60 border border-[#d3cfc6]/30 text-xs"
                      >
                        <FlaskConical className="w-3 h-3 text-[#535766]" />
                        <span className="text-[#383c48] font-medium">{child.name}</span>
                        <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-medium", STATUS_STYLES[child.status])}>
                          {child.status}
                        </span>
                        <span className="text-[10px] font-mono text-[#535766] ml-auto">v{child.iteration}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Decisions */}
            {experiment.decisions && experiment.decisions.length > 0 && (
              <>
                <Separator className="bg-[#e9e7df]/80" />
                <div>
                  <label className="text-[10px] text-[#535766] uppercase tracking-wider block mb-2">
                    Decisiones ({experiment.decisions.length})
                  </label>
                  <div className="space-y-2">
                    {experiment.decisions.map((d) => (
                      <div
                        key={d.id}
                        className="rounded-xl bg-amber-50/60 border border-amber-200/60 p-3"
                      >
                        <div className="flex items-center gap-2">
                          <Scale className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span className="text-[11px] font-medium text-[#1a1c24] truncate">
                            {d.title}
                          </span>
                          <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-medium shrink-0",
                            d.status === "ACCEPTED" ? "bg-emerald-100 text-emerald-700" :
                            d.status === "REVISITED" ? "bg-orange-100 text-orange-700" :
                            "bg-amber-100 text-amber-700"
                          )}>
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

            {/* Comments */}
            <Separator className="bg-[#e9e7df]/80" />
            <div>
              <label className="text-[10px] text-[#535766] uppercase tracking-wider block mb-3">
                Comentarios ({experiment.comments.length})
              </label>

              <div className="space-y-3 mb-4">
                {experiment.comments.map((c) => (
                  <div key={c.id} className="flex gap-2.5">
                    <UserAvatar user={c.user} size="sm" />
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

              <form onSubmit={handleComment} className="flex gap-2">
                <Input
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Agregar comentario..."
                  className="flex-1 h-8 text-xs bg-white border-[#d3cfc6] text-[#383c48] placeholder:text-[#535766]/50"
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
              <p>Creado por {experiment.user.name}</p>
              <p>
                Creado{" "}
                {format(new Date(experiment.createdAt), "dd/MM/yyyy HH:mm")}
              </p>
              <p>
                Actualizado{" "}
                {format(new Date(experiment.updatedAt), "dd/MM/yyyy HH:mm")}
              </p>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

/* ─── Metric Input ─── */

function MetricInput({
  label,
  value,
  onChange,
  step,
  min,
  max,
}: {
  label: string;
  value: number | null;
  onChange: (v: string) => void;
  step?: string;
  min?: string;
  max?: string;
}) {
  const [local, setLocal] = useState(value !== null && value !== undefined ? String(value) : "");

  return (
    <div className="space-y-1">
      <label className="text-[10px] text-[#535766]">{label}</label>
      <Input
        type="number"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={() => onChange(local)}
        step={step}
        min={min}
        max={max}
        placeholder="---"
        className="h-8 text-xs bg-white border-[#d3cfc6] text-[#383c48] placeholder:text-[#535766]/40 focus:border-[#ff7c11] focus:ring-[#ff7c11]/20"
      />
    </div>
  );
}

/* ─── Text Area Field ─── */

function TextAreaField({
  label,
  defaultValue,
  onBlur,
}: {
  label: string;
  defaultValue: string;
  onBlur: (v: string) => void;
}) {
  const [value, setValue] = useState(defaultValue);

  return (
    <div>
      <label className="text-[10px] text-[#535766] uppercase tracking-wider block mb-1.5">
        {label}
      </label>
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => onBlur(value)}
        rows={3}
        placeholder={`Agregar ${label.toLowerCase()}...`}
        className="bg-white border-[#d3cfc6] text-[#383c48] placeholder:text-[#535766]/40 text-xs resize-none focus:border-[#ff7c11] focus:ring-[#ff7c11]/20"
      />
    </div>
  );
}
