import type { User, Task } from "@/types";

type UserWithTasks = User & {
  assignedTasks: Task[];
  _count: { assignedTasks: number; researchEntries: number };
};

const avatarColors = [
  "from-[#ff7c11] to-[#ff9a3e]",
  "from-[#9a4a00] to-[#ff7c11]",
  "from-[#1a1c24] to-[#383c48]",
];

export function TeamCards({ users }: { users: UserWithTasks[] }) {
  return (
    <div className="rounded-2xl bg-white/60 border border-[#d3cfc6]/40 p-5">
      <h3 className="text-[10px] uppercase tracking-widest text-[#535766] mb-4">
        Equipo
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {users.map((user, i) => {
          const activeTasks = user.assignedTasks.filter(
            (t) => t.status !== "DONE"
          );
          const inProgress = activeTasks.filter(
            (t) => t.status === "IN_PROGRESS"
          );

          return (
            <div
              key={user.id}
              className="rounded-xl bg-[#f2f0ea]/80 border border-[#d3cfc6]/30 p-4 hover:border-[#d3cfc6]/60 transition-colors"
            >
              <div className="flex items-center gap-2.5 mb-3">
                <div
                  className={`w-8 h-8 rounded-full bg-gradient-to-br ${avatarColors[i % avatarColors.length]} flex items-center justify-center text-[11px] text-white font-semibold`}
                >
                  {user.name[0]}
                </div>
                <div>
                  <p className="text-sm font-medium text-[#1a1c24]">{user.name}</p>
                  <p className="text-[10px] text-[#535766]">{user.email}</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#535766]">En progreso</span>
                  <span className="text-xs font-mono text-[#ff7c11] font-medium">
                    {inProgress.length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#535766]">Pendientes</span>
                  <span className="text-xs font-mono text-[#383c48]">
                    {activeTasks.length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#535766]">Research</span>
                  <span className="text-xs font-mono text-[#9a4a00]">
                    {user._count.researchEntries}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
