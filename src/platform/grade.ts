/**
 * Grade reports are the shared scoring shape for every vertical.
 * `passed` is true only when every check passes.
 * A failed critical check zeros the score (reward-hack / safety rail).
 */
export type GradeCheck = {
  id: string;
  weight: number;
  passed: boolean;
  detail: string;
  critical?: boolean;
};

export type GradeReport = {
  taskId: string;
  difficulty: "easy" | "medium" | "hard";
  score: number;
  passed: boolean;
  checks: GradeCheck[];
};

export function check(input: GradeCheck): GradeCheck {
  return input;
}

export function finalize(
  taskId: string,
  difficulty: GradeReport["difficulty"],
  checks: GradeCheck[],
): GradeReport {
  const weighted = checks.filter((item) => item.weight > 0);
  const weight = weighted.reduce((sum, item) => sum + item.weight, 0);
  const earned = weighted.filter((item) => item.passed).reduce((sum, item) => sum + item.weight, 0);
  let score = weight === 0 ? 0 : earned / weight;
  if (checks.some((item) => item.critical && !item.passed)) score = 0;
  score = Math.max(0, Math.min(1, Math.round(score * 10000) / 10000));
  return {
    taskId,
    difficulty,
    score,
    passed: checks.every((item) => item.passed),
    checks,
  };
}
