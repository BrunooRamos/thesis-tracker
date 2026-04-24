import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { TaskBoard } from "@/components/tasks/task-board";

export const dynamic = "force-dynamic";


export default async function TasksPage() {
  const session = await auth();
  const [tasks, users, phases, tags] = await Promise.all([
    prisma.task.findMany({
      include: {
        assignees: true,
        creator: true,
        tags: true,
        phase: true,
        resource: true,
        researchEntry: { include: { user: true } },
        decision: true,
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
        currentUserId={session?.user?.id || ""}
      />
    </div>
  );
}
