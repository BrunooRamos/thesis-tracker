"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CheckSquare,
  BookOpen,
  FlaskConical,
  Scale,
  Calendar,
  FolderOpen,
  Loader2,
} from "lucide-react";

interface SearchResults {
  tasks: Array<{
    id: string;
    title: string;
    assignees: Array<{ name: string }>;
    phase: { name: string } | null;
    createdAt: string;
  }>;
  research: Array<{
    id: string;
    title: string;
    type: string;
    user: { name: string };
    createdAt: string;
  }>;
  experiments: Array<{
    id: string;
    name: string;
    status: string;
    user: { name: string };
    createdAt: string;
  }>;
  decisions: Array<{
    id: string;
    title: string;
    status: string;
    madeBy: { name: string };
    createdAt: string;
  }>;
  meetings: Array<{
    id: string;
    title: string;
    type: string;
    author: { name: string };
    date: string;
  }>;
  resources: Array<{
    id: string;
    name: string;
    category: string;
    createdAt: string;
  }>;
}

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchResults = useCallback(async (q: string) => {
    if (!q || q.length < 2) {
      setResults(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.results || null);
    } catch {
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchResults(query), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, fetchResults]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults(null);
      setLoading(false);
    }
  }, [open]);

  function navigate(path: string) {
    onOpenChange(false);
    router.push(path);
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("es-AR", {
      day: "numeric",
      month: "short",
    });
  }

  const hasResults =
    results &&
    (results.tasks.length > 0 ||
      results.research.length > 0 ||
      results.experiments.length > 0 ||
      results.decisions.length > 0 ||
      results.meetings.length > 0 ||
      results.resources.length > 0);

  const searched = query.length >= 2;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="top-[30%] translate-y-0 overflow-hidden rounded-xl p-0 sm:max-w-lg border border-[#d3cfc6] bg-white"
        showCloseButton={false}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Buscar</DialogTitle>
        </DialogHeader>
        <Command
          className="bg-white"
          shouldFilter={false}
        >
          <CommandInput
            placeholder="Buscar tareas, research, experimentos..."
            value={query}
            onValueChange={setQuery}
          />
          <CommandList className="max-h-80">
            {loading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-[#ff7c11]" />
              </div>
            )}

            {!loading && !searched && (
              <CommandEmpty className="text-[#535766] text-xs">
                Busca tareas, research, experimentos...
              </CommandEmpty>
            )}

            {!loading && searched && !hasResults && (
              <CommandEmpty className="text-[#535766] text-xs">
                Sin resultados para &lsquo;{query}&rsquo;
              </CommandEmpty>
            )}

            {!loading && hasResults && (
              <>
                {results.tasks.length > 0 && (
                  <CommandGroup heading="Tareas">
                    {results.tasks.map((task) => (
                      <CommandItem
                        key={task.id}
                        value={`task-${task.id}`}
                        onSelect={() => navigate("/tasks")}
                        className="cursor-pointer"
                      >
                        <CheckSquare className="w-4 h-4 text-[#ff7c11] shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-[#1a1c24] truncate">
                            {task.title}
                          </p>
                          <p className="text-xs text-[#535766] truncate">
                            {task.assignees
                              .map((a) => a.name)
                              .join(", ") || "Sin asignar"}
                            {task.phase && ` \u00B7 ${task.phase.name}`}
                          </p>
                        </div>
                        <span className="text-[10px] text-[#535766]/60 shrink-0">
                          {formatDate(task.createdAt)}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {results.tasks.length > 0 && results.research.length > 0 && (
                  <CommandSeparator />
                )}

                {results.research.length > 0 && (
                  <CommandGroup heading="Research">
                    {results.research.map((entry) => (
                      <CommandItem
                        key={entry.id}
                        value={`research-${entry.id}`}
                        onSelect={() => navigate("/research")}
                        className="cursor-pointer"
                      >
                        <BookOpen className="w-4 h-4 text-[#ff7c11] shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-[#1a1c24] truncate">
                            {entry.title}
                          </p>
                          <p className="text-xs text-[#535766] truncate">
                            {entry.type} &middot; {entry.user.name}
                          </p>
                        </div>
                        <span className="text-[10px] text-[#535766]/60 shrink-0">
                          {formatDate(entry.createdAt)}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {results.research.length > 0 &&
                  results.experiments.length > 0 && <CommandSeparator />}

                {results.experiments.length > 0 && (
                  <CommandGroup heading="Experimentos">
                    {results.experiments.map((exp) => (
                      <CommandItem
                        key={exp.id}
                        value={`experiment-${exp.id}`}
                        onSelect={() => navigate("/experiments")}
                        className="cursor-pointer"
                      >
                        <FlaskConical className="w-4 h-4 text-[#ff7c11] shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-[#1a1c24] truncate">
                            {exp.name}
                          </p>
                          <p className="text-xs text-[#535766] truncate">
                            {exp.status} &middot; {exp.user.name}
                          </p>
                        </div>
                        <span className="text-[10px] text-[#535766]/60 shrink-0">
                          {formatDate(exp.createdAt)}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {results.experiments.length > 0 &&
                  results.decisions.length > 0 && <CommandSeparator />}

                {results.decisions.length > 0 && (
                  <CommandGroup heading="Decisiones">
                    {results.decisions.map((dec) => (
                      <CommandItem
                        key={dec.id}
                        value={`decision-${dec.id}`}
                        onSelect={() => navigate("/decisions")}
                        className="cursor-pointer"
                      >
                        <Scale className="w-4 h-4 text-[#ff7c11] shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-[#1a1c24] truncate">
                            {dec.title}
                          </p>
                          <p className="text-xs text-[#535766] truncate">
                            {dec.status} &middot; {dec.madeBy.name}
                          </p>
                        </div>
                        <span className="text-[10px] text-[#535766]/60 shrink-0">
                          {formatDate(dec.createdAt)}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {results.decisions.length > 0 &&
                  results.meetings.length > 0 && <CommandSeparator />}

                {results.meetings.length > 0 && (
                  <CommandGroup heading="Reuniones">
                    {results.meetings.map((meeting) => (
                      <CommandItem
                        key={meeting.id}
                        value={`meeting-${meeting.id}`}
                        onSelect={() => navigate("/meetings")}
                        className="cursor-pointer"
                      >
                        <Calendar className="w-4 h-4 text-[#ff7c11] shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-[#1a1c24] truncate">
                            {meeting.title}
                          </p>
                          <p className="text-xs text-[#535766] truncate">
                            {meeting.type} &middot; {meeting.author.name}
                          </p>
                        </div>
                        <span className="text-[10px] text-[#535766]/60 shrink-0">
                          {formatDate(meeting.date)}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {results.meetings.length > 0 &&
                  results.resources.length > 0 && <CommandSeparator />}

                {results.resources.length > 0 && (
                  <CommandGroup heading="Recursos">
                    {results.resources.map((resource) => (
                      <CommandItem
                        key={resource.id}
                        value={`resource-${resource.id}`}
                        onSelect={() => navigate("/resources")}
                        className="cursor-pointer"
                      >
                        <FolderOpen className="w-4 h-4 text-[#ff7c11] shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-[#1a1c24] truncate">
                            {resource.name}
                          </p>
                          <p className="text-xs text-[#535766] truncate">
                            {resource.category}
                          </p>
                        </div>
                        <span className="text-[10px] text-[#535766]/60 shrink-0">
                          {formatDate(resource.createdAt)}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
