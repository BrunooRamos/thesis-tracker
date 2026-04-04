"use client";

import { useState } from "react";
import { Plus, Search, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CreateMeetingDrawer } from "./create-meeting-drawer";
import { MeetingDetailDrawer } from "./meeting-detail-drawer";
import type { MeetingNote, User, MeetingType } from "@/types";

export type MeetingNoteWithAuthor = MeetingNote & {
  author: User;
};

const typeFilters = [
  { value: "ALL", label: "Todas" },
  { value: "HORIZON_CHECKIN", label: "Horizon Check-in" },
  { value: "TEAM_INTERNAL", label: "Internas" },
  { value: "TUTOR_ACADEMIC", label: "Tutor Academico" },
] as const;

const typeBadgeStyles: Record<string, string> = {
  HORIZON_CHECKIN: "bg-[#ff7c11]/10 text-[#ff7c11] border-[#ff7c11]/20",
  TEAM_INTERNAL: "bg-[#1a1c24]/10 text-[#1a1c24] border-[#1a1c24]/20",
  TUTOR_ACADEMIC: "bg-emerald-50 text-emerald-600 border-emerald-200/60",
  OTHER: "bg-[#e9e7df] text-[#535766] border-[#d3cfc6]/40",
};

const typeLabel: Record<string, string> = {
  HORIZON_CHECKIN: "Horizon Check-in",
  TEAM_INTERNAL: "Interna",
  TUTOR_ACADEMIC: "Tutor Academico",
  OTHER: "Otra",
};

export function MeetingsPage({
  initialMeetings,
  users,
}: {
  initialMeetings: MeetingNoteWithAuthor[];
  users: User[];
}) {
  const [meetings, setMeetings] = useState(initialMeetings);
  const [typeFilter, setTypeFilter] = useState<"ALL" | MeetingType>("ALL");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [selectedMeeting, setSelectedMeeting] =
    useState<MeetingNoteWithAuthor | null>(null);

  const filtered = meetings.filter((m) => {
    if (typeFilter !== "ALL" && m.type !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        m.title.toLowerCase().includes(q) ||
        m.summary.toLowerCase().includes(q) ||
        m.attendees.some((a) => a.toLowerCase().includes(q))
      );
    }
    return true;
  });

  function handleCreated(meeting: MeetingNoteWithAuthor) {
    setMeetings((prev) => [meeting, ...prev]);
    setShowCreate(false);
  }

  function handleUpdated(updated: MeetingNoteWithAuthor) {
    setMeetings((prev) =>
      prev.map((m) => (m.id === updated.id ? updated : m))
    );
    setSelectedMeeting(updated);
  }

  function handleDeleted(id: string) {
    setMeetings((prev) => prev.filter((m) => m.id !== id));
    setSelectedMeeting(null);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#1a1c24]">Reuniones</h1>
          <p className="text-sm text-[#535766] mt-0.5">
            Notas y acuerdos de reuniones
          </p>
        </div>
        <Button
          onClick={() => setShowCreate(true)}
          className="bg-[#ff7c11] hover:bg-[#ff9a3e] text-white rounded-full gap-2"
        >
          <Plus className="w-4 h-4" />
          Nueva reunion
        </Button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-1.5 bg-white/60 border border-[#d3cfc6]/40 rounded-lg p-1">
          {typeFilters.map((tf) => (
            <button
              key={tf.value}
              onClick={() =>
                setTypeFilter(tf.value as "ALL" | MeetingType)
              }
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                typeFilter === tf.value
                  ? "bg-[#ff7c11] text-white"
                  : "text-[#535766] hover:text-[#1a1c24] hover:bg-white/80"
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>

        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#535766]" />
          <Input
            placeholder="Buscar reuniones..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs bg-white border-[#d3cfc6] text-[#383c48] placeholder:text-[#535766]/50 focus:border-[#ff7c11]"
          />
        </div>
      </div>

      {/* Meeting list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Calendar className="w-10 h-10 text-[#d3cfc6] mx-auto mb-3" />
          <p className="text-sm text-[#535766]">No hay reuniones registradas</p>
          <p className="text-xs text-[#535766]/60 mt-1">
            Crea una nueva reunion para comenzar
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((m) => {
            const actionItems = (m.actionItems ?? []) as Record<
              string,
              unknown
            >[];
            return (
              <button
                key={m.id}
                onClick={() => setSelectedMeeting(m)}
                className="w-full text-left bg-white/60 border border-[#d3cfc6]/40 rounded-xl p-4 hover:border-[#ff7c11]/30 hover:bg-white/80 transition-all group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <h3 className="text-sm font-medium text-[#1a1c24] truncate group-hover:text-[#ff7c11] transition-colors">
                        {m.title}
                      </h3>
                      <Badge
                        variant="outline"
                        className={`text-[10px] shrink-0 ${typeBadgeStyles[m.type]}`}
                      >
                        {typeLabel[m.type]}
                      </Badge>
                    </div>
                    <p className="text-xs text-[#535766] line-clamp-2 leading-relaxed">
                      {m.summary}
                    </p>

                    {/* Attendees chips */}
                    {m.attendees.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        {m.attendees.slice(0, 5).map((a, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 bg-[#e9e7df]/60 rounded-full px-2 py-0.5"
                          >
                            <Avatar className="w-3.5 h-3.5">
                              <AvatarFallback className="bg-[#d3cfc6]/60 text-[7px] text-[#535766]">
                                {a[0]}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-[10px] text-[#535766]">
                              {a}
                            </span>
                          </span>
                        ))}
                        {m.attendees.length > 5 && (
                          <span className="text-[10px] text-[#535766]/60">
                            +{m.attendees.length - 5} mas
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className="text-[10px] text-[#535766]">
                      {format(new Date(m.date), "d MMM yyyy", { locale: es })}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Avatar className="w-5 h-5">
                        <AvatarFallback className="bg-[#e9e7df]/80 text-[9px] text-[#535766]">
                          {m.author.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-[10px] text-[#535766]">
                        {m.author.name}
                      </span>
                    </div>
                    {actionItems.length > 0 && (
                      <span className="text-[10px] text-[#535766]/60">
                        {actionItems.length} accion
                        {actionItems.length !== 1 ? "es" : ""}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Drawers */}
      <CreateMeetingDrawer
        open={showCreate}
        onOpenChange={setShowCreate}
        onCreated={handleCreated}
        users={users}
      />

      <MeetingDetailDrawer
        meeting={selectedMeeting}
        onClose={() => setSelectedMeeting(null)}
        users={users}
        onUpdated={handleUpdated}
        onDeleted={handleDeleted}
      />
    </div>
  );
}
