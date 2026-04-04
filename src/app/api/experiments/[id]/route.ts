import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const experiment = await prisma.experiment.findUnique({
    where: { id },
    include: {
      user: true,
      comments: { include: { user: true }, orderBy: { createdAt: "asc" } },
      childExperiments: true,
      parentExperiment: true,
    },
  });

  if (!experiment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(experiment);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  const updateData: Record<string, unknown> = {};
  const allowedFields = [
    "name",
    "description",
    "hypothesis",
    "architecture",
    "dataset",
    "status",
    "exhaustivity",
    "precision",
    "latency",
    "cost",
    "tokenCount",
    "results",
    "analysis",
    "nextSteps",
  ];

  for (const field of allowedFields) {
    if (field in body) {
      updateData[field] = body[field];
    }
  }

  if ("configuration" in body) {
    updateData.configuration = body.configuration;
  }

  const experiment = await prisma.experiment.update({
    where: { id },
    data: updateData,
    include: {
      user: true,
      comments: { include: { user: true }, orderBy: { createdAt: "asc" } },
      childExperiments: true,
      parentExperiment: true,
    },
  });

  return NextResponse.json(experiment);
}
