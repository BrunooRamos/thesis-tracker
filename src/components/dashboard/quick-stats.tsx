import { CheckCircle2, BookOpen, FlaskConical, ListTodo } from "lucide-react";

export function QuickStats({
  totalTasks,
  completedTasks,
  papersRead,
  experimentsRun,
}: {
  totalTasks: number;
  completedTasks: number;
  papersRead: number;
  experimentsRun: number;
}) {
  const stats = [
    {
      label: "Tareas",
      value: `${completedTasks}/${totalTasks}`,
      icon: ListTodo,
      color: "text-[#ff7c11]",
      bg: "bg-[#ff7c11]/10",
    },
    {
      label: "Completadas",
      value: `${totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%`,
      icon: CheckCircle2,
      color: "text-emerald-500",
      bg: "bg-emerald-50",
    },
    {
      label: "Papers",
      value: papersRead.toString(),
      icon: BookOpen,
      color: "text-[#9a4a00]",
      bg: "bg-[#9a4a00]/10",
    },
    {
      label: "Experimentos",
      value: experimentsRun.toString(),
      icon: FlaskConical,
      color: "text-amber-500",
      bg: "bg-amber-50",
    },
  ];

  return (
    <div className="rounded-2xl bg-white/60 border border-[#d3cfc6]/40 p-5">
      <h3 className="text-[10px] uppercase tracking-widest text-[#535766] mb-4">
        Resumen
      </h3>
      <div className="grid grid-cols-2 gap-2.5">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl bg-[#f2f0ea]/80 border border-[#d3cfc6]/30 p-3"
          >
            <div className={`w-7 h-7 rounded-lg ${s.bg} flex items-center justify-center mb-2`}>
              <s.icon className={`w-3.5 h-3.5 ${s.color}`} />
            </div>
            <p className="text-lg font-semibold text-[#1a1c24] font-mono">
              {s.value}
            </p>
            <p className="text-[10px] text-[#535766] uppercase tracking-wider">
              {s.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
