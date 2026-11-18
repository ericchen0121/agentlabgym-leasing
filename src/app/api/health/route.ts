import { queryOne } from "@/server/db";
import { ensureBootstrapped } from "@/server/seed";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  try {
    await ensureBootstrapped();
    const row = await queryOne<{ seed: number; task_id: string | null; clock: string }>(
      "SELECT seed, task_id, clock::text FROM env_state WHERE id = 1",
    );
    return Response.json({ ok: true, seed: row?.seed ?? null, taskId: row?.task_id ?? null, clock: row?.clock ?? null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unhealthy";
    return Response.json({ ok: false, error: message }, { status: 503 });
  }
}
