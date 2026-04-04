import { prisma } from "@/lib/prisma";
import { ExperimentLab } from "@/components/experiments/experiment-lab";

export default async function ExperimentsPage() {
  const [experiments, users] = await Promise.all([
    prisma.experiment.findMany({
      include: {
        user: true,
        comments: { include: { user: true }, orderBy: { createdAt: "asc" } },
        childExperiments: true,
        parentExperiment: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany(),
  ]);

  return (
    <div className="max-w-7xl mx-auto">
      <ExperimentLab
        initialExperiments={JSON.parse(JSON.stringify(experiments))}
        users={JSON.parse(JSON.stringify(users))}
      />
    </div>
  );
}
