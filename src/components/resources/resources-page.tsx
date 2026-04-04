"use client";

import { useState } from "react";
import type { Resource, ResourceCategory } from "@/types";
import type { User } from "@/types";
import { updateResource, deleteResource } from "@/app/(app)/resources/actions";
import { CreateResourceDrawer } from "./create-resource-drawer";
import {
  Search,
  Plus,
  Pin,
  PinOff,
  ExternalLink,
  Trash2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type ResourceWithUser = Resource & { addedBy: User };

const CATEGORY_LABELS: Record<ResourceCategory, string> = {
  PAPER: "Paper",
  TOOL: "Herramienta",
  DATASET: "Dataset",
  HORIZON_DOC: "Horizon",
  REPO: "Repo",
  FACULTY_DOC: "Facultad",
  OTHER: "Otro",
};

const CATEGORY_BADGE_CLASSES: Record<ResourceCategory, string> = {
  PAPER: "bg-blue-50 text-blue-600",
  TOOL: "bg-violet-50 text-violet-600",
  DATASET: "bg-emerald-50 text-emerald-600",
  HORIZON_DOC: "bg-[#ff7c11]/10 text-[#ff7c11]",
  REPO: "bg-[#1a1c24]/10 text-[#1a1c24]",
  FACULTY_DOC: "bg-amber-50 text-amber-600",
  OTHER: "bg-[#e9e7df] text-[#535766]",
};

const FILTER_TABS: { label: string; value: ResourceCategory | "ALL" }[] = [
  { label: "Todos", value: "ALL" },
  { label: "Papers", value: "PAPER" },
  { label: "Herramientas", value: "TOOL" },
  { label: "Datasets", value: "DATASET" },
  { label: "Horizon", value: "HORIZON_DOC" },
  { label: "Repos", value: "REPO" },
  { label: "Facultad", value: "FACULTY_DOC" },
];

export function ResourcesPage({
  resources: initialResources,
}: {
  resources: ResourceWithUser[];
}) {
  const [resources, setResources] = useState(initialResources);
  const [filter, setFilter] = useState<ResourceCategory | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const filtered = resources.filter((r) => {
    const matchesCategory = filter === "ALL" || r.category === filter;
    const matchesSearch =
      search === "" ||
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.description?.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const pinned = filtered.filter((r) => r.pinned);
  const unpinned = filtered.filter((r) => !r.pinned);

  // Group unpinned by category
  const grouped = unpinned.reduce<Record<string, ResourceWithUser[]>>(
    (acc, r) => {
      if (!acc[r.category]) acc[r.category] = [];
      acc[r.category].push(r);
      return acc;
    },
    {}
  );

  async function handleTogglePin(resource: ResourceWithUser) {
    const newPinned = !resource.pinned;
    setResources((prev) =>
      prev.map((r) => (r.id === resource.id ? { ...r, pinned: newPinned } : r))
    );
    await updateResource(resource.id, { pinned: newPinned });
  }

  async function handleDelete(id: string) {
    setResources((prev) => prev.filter((r) => r.id !== id));
    await deleteResource(id);
  }

  function handleCreated(resource: ResourceWithUser) {
    setResources((prev) => [resource, ...prev]);
    setDrawerOpen(false);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#1a1c24]">Recursos</h1>
          <p className="text-sm text-[#535766] mt-0.5">
            Repositorio de recursos compartidos del proyecto
          </p>
        </div>
        <Button
          onClick={() => setDrawerOpen(true)}
          className="bg-[#ff7c11] hover:bg-[#ff9a3e] text-white rounded-full text-sm h-9 px-4"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Agregar recurso
        </Button>
      </div>

      {/* Filter tabs + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex gap-1 overflow-x-auto">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
                filter === tab.value
                  ? "bg-[#ff7c11] text-white"
                  : "bg-white/60 text-[#535766] border border-[#d3cfc6]/40 hover:bg-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#535766]/50" />
          <Input
            placeholder="Buscar recursos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 bg-white border-[#d3cfc6] text-[#383c48] placeholder:text-[#535766]/40 text-sm focus:border-[#ff7c11] focus:ring-[#ff7c11]/20"
          />
        </div>
      </div>

      {/* Pinned section */}
      {pinned.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Pin className="w-3.5 h-3.5 text-[#ff7c11]" />
            <h2 className="text-xs font-semibold text-[#535766] uppercase tracking-wider">
              Fijados
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {pinned.map((r) => (
              <ResourceCard
                key={r.id}
                resource={r}
                onTogglePin={handleTogglePin}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
      )}

      {/* Grouped by category */}
      {Object.entries(grouped).map(([category, items]) => (
        <div key={category} className="space-y-3">
          <h2 className="text-xs font-semibold text-[#535766] uppercase tracking-wider">
            {CATEGORY_LABELS[category as ResourceCategory]}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {items.map((r) => (
              <ResourceCard
                key={r.id}
                resource={r}
                onTogglePin={handleTogglePin}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="text-center py-16">
          <p className="text-sm text-[#535766]">No se encontraron recursos.</p>
        </div>
      )}

      <CreateResourceDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onCreated={handleCreated}
      />
    </div>
  );
}

function ResourceCard({
  resource,
  onTogglePin,
  onDelete,
}: {
  resource: ResourceWithUser;
  onTogglePin: (r: ResourceWithUser) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="bg-white/60 border border-[#d3cfc6]/40 rounded-xl p-4 flex flex-col gap-2.5 group">
      <div className="flex items-start justify-between gap-2">
        <a
          href={resource.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-[#1a1c24] hover:text-[#ff7c11] transition-colors flex items-center gap-1.5 leading-tight"
        >
          {resource.name}
          <ExternalLink className="w-3 h-3 shrink-0 opacity-50" />
        </a>
        <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onTogglePin(resource)}
            className="p-1 rounded hover:bg-[#e9e7df]/60 text-[#535766]"
            title={resource.pinned ? "Desfijar" : "Fijar"}
          >
            {resource.pinned ? (
              <PinOff className="w-3.5 h-3.5" />
            ) : (
              <Pin className="w-3.5 h-3.5" />
            )}
          </button>
          <button
            onClick={() => onDelete(resource.id)}
            className="p-1 rounded hover:bg-red-50 text-[#535766] hover:text-red-500"
            title="Eliminar"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {resource.description && (
        <p className="text-xs text-[#535766] line-clamp-2 leading-relaxed">
          {resource.description}
        </p>
      )}

      <div className="flex items-center justify-between mt-auto pt-1">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
            CATEGORY_BADGE_CLASSES[resource.category]
          }`}
        >
          {CATEGORY_LABELS[resource.category]}
        </span>
        <span className="text-[10px] text-[#535766]/60">
          {resource.addedBy?.name || "Desconocido"}
        </span>
      </div>
    </div>
  );
}
