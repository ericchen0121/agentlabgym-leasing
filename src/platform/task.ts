import type { SeedContext } from "@/domain/types";
import type { Snapshot } from "@/domain/types";
import type { GradeReport } from "./grade";

/**
 * Vertical-agnostic task contract.
 * HUD and Prime adapters map `id`, `prompt`, `seed`, and `grade` onto their own runners.
 * Graders read snapshots. They do not inspect pixels.
 */
export type Difficulty = "easy" | "medium" | "hard";

export type TaskDefinition = {
  id: string;
  slug: string;
  title: string;
  difficulty: Difficulty;
  seed: number;
  tags: string[];
  prompt: string;
  setup: (ctx: SeedContext) => Promise<void>;
  grade: (input: { current: Snapshot; initial: Snapshot }) => GradeReport;
};

export type TaskPublic = {
  id: string;
  slug: string;
  title: string;
  difficulty: Difficulty;
  seed: number;
  tags: string[];
  prompt: string;
};

export function publishTask(task: TaskDefinition): TaskPublic {
  return {
    id: task.id,
    slug: task.slug,
    title: task.title,
    difficulty: task.difficulty,
    seed: task.seed,
    tags: task.tags,
    prompt: task.prompt,
  };
}
