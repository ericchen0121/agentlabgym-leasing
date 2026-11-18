import { isAdmin, unauthorized } from "@/server/admin";
import { resetDatabase } from "@/server/seed";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  if (!isAdmin(request)) return unauthorized();
  const body = (await request.json().catch(() => ({}))) as { taskId?: string; seed?: number };
  try {
    const result = await resetDatabase({ taskId: body.taskId, seed: body.seed });
    return Response.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Reset failed.";
    const status = message.startsWith("Unknown task") ? 404 : 400;
    return Response.json({ ok: false, error: message }, { status });
  }
}
