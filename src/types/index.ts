// Re-export Prisma model types with simpler names
export type {
  UserModel as User,
  PhaseModel as Phase,
  MilestoneModel as Milestone,
  TaskModel as Task,
  TagModel as Tag,
  ResearchEntryModel as ResearchEntry,
  ExperimentModel as Experiment,
  DecisionModel as Decision,
  MeetingNoteModel as MeetingNote,
  CommentModel as Comment,
  ActivityLogModel as ActivityLog,
} from "@/generated/prisma/models";

export type {
  PhaseStatus,
  MilestoneStatus,
  TaskStatus,
  Priority,
  ResearchType,
  Relevance,
  ExperimentStatus,
  DecisionStatus,
  MeetingType,
} from "@/generated/prisma/enums";
