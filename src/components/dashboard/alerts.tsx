import { AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import type { Task } from "@/types";

export function Alerts({ overdueTasks }: { overdueTasks: Task[] }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50/50 p-5">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-4 h-4 text-red-500" />
        <h3 className="text-xs font-semibold text-red-600 uppercase tracking-wider">
          Tareas vencidas ({overdueTasks.length})
        </h3>
      </div>
      <div className="space-y-2">
        {overdueTasks.slice(0, 5).map((task) => (
          <div key={task.id} className="flex items-center justify-between py-1.5">
            <span className="text-xs text-[#383c48] truncate max-w-[70%]">
              {task.title}
            </span>
            <span className="text-[10px] text-red-400 font-mono">
              {task.dueDate &&
                formatDistanceToNow(task.dueDate, { addSuffix: true, locale: es })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
