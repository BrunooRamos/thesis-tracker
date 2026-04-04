"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { revalidatePath } from "next/cache";
import type { ExperimentStatus } from "@/types";
import type { Prisma } from "@/generated/prisma/client";

export async function createExperiment(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const name = formData.get("name") as string;
  const hypothesis = formData.get("hypothesis") as string | null;
  const architecture = formData.get("architecture") as string;
  const configurationRaw = formData.get("configuration") as string | null;
  const dataset = formData.get("dataset") as string | null;
  const status = (formData.get("status") as ExperimentStatus) || "PLANNED";

  let configuration: unknown = undefined;
  if (configurationRaw) {
    try {
      configuration = JSON.parse(configurationRaw);
    } catch {
      configuration = undefined;
    }
  }

  const experiment = await prisma.experiment.create({
    data: {
      name,
      hypothesis: hypothesis || undefined,
      architecture,
      configuration: configuration ?? undefined,
      dataset: dataset || undefined,
      status,
      userId: session.user.id!,
    },
  });

  await logActivity("created_experiment", "experiment", experiment.id, experiment.name);
  revalidatePath("/experiments");
  revalidatePath("/");
  return experiment;
}

export async function updateExperiment(
  id: string,
  data: {
    name?: string;
    hypothesis?: string | null;
    architecture?: string;
    configuration?: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput;
    dataset?: string | null;
    status?: ExperimentStatus;
    exhaustivity?: number | null;
    precision?: number | null;
    latency?: number | null;
    cost?: number | null;
    tokenCount?: number | null;
    results?: string | null;
    analysis?: string | null;
    nextSteps?: string | null;
  }
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const experiment = await prisma.experiment.update({
    where: { id },
    data,
  });

  await logActivity("updated_experiment", "experiment", experiment.id, experiment.name);
  revalidatePath("/experiments");
  revalidatePath("/");
  return experiment;
}

export async function deleteExperiment(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const experiment = await prisma.experiment.findUnique({ where: { id } });
  if (!experiment) throw new Error("Experiment not found");

  await prisma.experiment.delete({ where: { id } });
  await logActivity("deleted_experiment", "experiment", id, experiment.name);
  revalidatePath("/experiments");
  revalidatePath("/");
}

export async function addExperimentComment(experimentId: string, content: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const comment = await prisma.comment.create({
    data: {
      content,
      userId: session.user.id!,
      experimentId,
    },
    include: { user: true },
  });

  const experiment = await prisma.experiment.findUnique({ where: { id: experimentId } });
  if (experiment) {
    await logActivity("added_comment", "experiment", experimentId, experiment.name);
  }

  revalidatePath("/experiments");
  return comment;
}
