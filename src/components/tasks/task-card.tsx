import { Calendar, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/ui/user-avatar";
import type { TaskWithRelations } from "./task-board";

const priorityDot: Record<string, string> = {
  LOW: "bg-[#535766]",
  MEDIUM: "bg-[#ff7c11]",
  HIGH: "bg-amber-500",
  URGENT: "bg-red-500",
};

export function TaskCard({
  task,
  isDragging,
}: {
  task: TaskWithRelations;
  isDragging: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl bg-white border border-[#d3cfc6]/50 p-3 transition-all cursor-pointer hover:border-[#d3cfc6] hover:shadow-sm",
        isDragging && "shadow-lg shadow-[#ff7c11]/10 border-[#ff7c11]/40 rotate-1 scale-[1.03]"
      )}
    >
      {task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.tags.slice(0, 3).map((tag) => (
            <span
              key={tag.id}
              className="px-1.5 py-0.5 rounded text-[9px] font-medium"
              style={{
                backgroundColor: tag.color + "15",
                color: tag.color,
              }}
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}

      <p className="text-xs text-[#1a1c24] font-medium leading-relaxed mb-2">
        {task.title}
      </p>

      <div className="flex items-center gap-2 text-[10px]">
        <span className={`w-1.5 h-1.5 rounded-full ${priorityDot[task.priority]}`} />

        {task.wbsCode && (
          <span className="text-[#535766] font-mono">{task.wbsCode}</span>
        )}

        {task.dueDate && (
          <span
            className={cn(
              "flex items-center gap-1",
              new Date(task.dueDate) < new Date() && task.status !== "DONE"
                ? "text-red-500"
                : "text-[#535766]"
            )}
          >
            <Calendar className="w-2.5 h-2.5" />
            {format(new Date(task.dueDate), "dd/MM")}
          </span>
        )}

        <div className="flex-1" />

        {task.comments.length > 0 && (
          <span className="flex items-center gap-0.5 text-[#535766]">
            <MessageSquare className="w-2.5 h-2.5" />
            {task.comments.length}
          </span>
        )}

        {task.assignees.length > 0 && (
          <div className="flex -space-x-1.5">
            {task.assignees.slice(0, 3).map(a => (
              <UserAvatar key={a.id} user={a} size="xs" />
            ))}
            {task.assignees.length > 3 && <span className="text-[8px] text-[#535766] ml-1">+{task.assignees.length - 3}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
