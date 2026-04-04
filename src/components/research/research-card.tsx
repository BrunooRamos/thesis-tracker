"use client";

import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
  ExternalLink,
  MessageSquare,
  BookOpen,
  FileText,
  GitBranch,
  Wrench,
  Video,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ResearchEntryWithRelations } from "./research-hub";

const typeIcons: Record<string, typeof BookOpen> = {
  PAPER: BookOpen,
  ARTICLE: FileText,
  REPO: GitBranch,
  TOOL: Wrench,
  VIDEO: Video,
  OTHER: HelpCircle,
};

const typeLabels: Record<string, string> = {
  PAPER: "Paper",
  ARTICLE: "Artículo",
  REPO: "Repo",
  TOOL: "Herramienta",
  VIDEO: "Video",
  OTHER: "Otro",
};

const relevanceConfig: Record<string, { color: string; label: string }> = {
  CRITICAL: { color: "bg-red-500/10 text-red-400", label: "Crítico" },
  HIGH: { color: "bg-amber-500/10 text-amber-400", label: "Alta" },
  MEDIUM: { color: "bg-blue-500/10 text-[#ff7c11]", label: "Media" },
  LOW: { color: "bg-[#535766]/10 text-[#535766]", label: "Baja" },
};

export function ResearchCard({
  entry,
  variant,
  onClick,
}: {
  entry: ResearchEntryWithRelations;
  variant: "feed" | "grid";
  onClick: () => void;
}) {
  const TypeIcon = typeIcons[entry.type] || HelpCircle;
  const rel = relevanceConfig[entry.relevance];

  if (variant === "feed") {
    return (
      <div
        onClick={onClick}
        className="rounded-xl border border-[#d3cfc6]/50 bg-white/40 p-4 hover:border-[#d3cfc6] transition-colors cursor-pointer"
      >
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#e9e7df]/50 flex items-center justify-center shrink-0 mt-0.5">
            <TypeIcon className="w-4 h-4 text-[#535766]" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[10px] text-[#535766] uppercase tracking-wider">
                {typeLabels[entry.type]}
              </span>
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${rel.color}`}>
                {rel.label}
              </span>
              {entry.url && (
                <a
                  href={entry.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-[#535766] hover:text-[#ff7c11] transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            <h3 className="text-sm font-medium text-[#1a1c24] mb-1 leading-snug">
              {entry.title}
            </h3>

            {entry.authors && (
              <p className="text-[10px] text-[#535766] mb-2">{entry.authors}</p>
            )}

            <p className="text-xs text-[#535766] line-clamp-2 leading-relaxed mb-2">
              {entry.summary}
            </p>

            {/* Tags */}
            {entry.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {entry.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-[#e9e7df]/50 text-[#535766]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center gap-3 text-[10px] text-[#535766]">
              <span>{entry.user.name}</span>
              <span>
                {formatDistanceToNow(new Date(entry.createdAt), {
                  addSuffix: true,
                  locale: es,
                })}
              </span>
              {entry.comments.length > 0 && (
                <span className="flex items-center gap-0.5">
                  <MessageSquare className="w-2.5 h-2.5" />
                  {entry.comments.length}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Grid variant
  return (
    <div
      onClick={onClick}
      className="rounded-xl border border-[#d3cfc6]/50 bg-white/40 p-4 hover:border-[#d3cfc6] transition-colors cursor-pointer flex flex-col"
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 rounded-md bg-[#e9e7df]/50 flex items-center justify-center">
          <TypeIcon className="w-3 h-3 text-[#535766]" />
        </div>
        <span className="text-[10px] text-[#535766] uppercase tracking-wider">
          {typeLabels[entry.type]}
        </span>
        <span className={cn("ml-auto px-1.5 py-0.5 rounded text-[9px] font-medium", rel.color)}>
          {rel.label}
        </span>
      </div>

      <h3 className="text-xs font-medium text-[#1a1c24] mb-1 leading-snug line-clamp-2">
        {entry.title}
      </h3>

      <p className="text-[11px] text-[#535766] line-clamp-3 leading-relaxed mb-3 flex-1">
        {entry.summary}
      </p>

      {entry.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {entry.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-1.5 py-0.5 rounded text-[9px] bg-[#e9e7df]/50 text-[#535766]"
            >
              {tag}
            </span>
          ))}
          {entry.tags.length > 3 && (
            <span className="text-[9px] text-[#535766]">
              +{entry.tags.length - 3}
            </span>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 text-[10px] text-[#535766] mt-auto pt-2 border-t border-[#d3cfc6]/40">
        <span>{entry.user.name}</span>
        <span className="flex-1" />
        {entry.comments.length > 0 && (
          <span className="flex items-center gap-0.5">
            <MessageSquare className="w-2.5 h-2.5" />
            {entry.comments.length}
          </span>
        )}
      </div>
    </div>
  );
}
