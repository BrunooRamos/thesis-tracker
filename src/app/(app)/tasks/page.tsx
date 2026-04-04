import { prisma } from "@/lib/prisma";
import { TaskBoard } from "@/components/tasks/task-board";

export default async function TasksPage() {
  const [tasks, users, phases, tags] = await Promise.all([
    prisma.task.findMany({
      include: {
        assignee: true,
        creator: true,
        tags: true,
        phase: true,
        resource: true,
        researchEntry: { include: { user: true } },
        comments: { include: { user: true }, orderBy: { createdAt: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany(),
    prisma.phase.findMany({ orderBy: { number: "asc" } }),
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="max-w-7xl mx-auto">
      <TaskBoard
        initialTasks={JSON.parse(JSON.stringify(tasks))}
        users={JSON.parse(JSON.stringify(users))}
        phases={JSON.parse(JSON.stringify(phases))}
        tags={JSON.parse(JSON.stringify(tags))}
      />
    </div>
  );
}
