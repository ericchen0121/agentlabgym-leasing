import { isAdmin, unauthorized } from "@/server/admin";
import { readInitialSnapshot, readSnapshot } from "@/server/snapshot";
import { getTask } from "@/tasks";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  if (!isAdmin(request)) return unauthorized();
  const body = (await request.json().catch(() => ({}))) as { taskId?: string };
  const current = await readSnapshot();
  const taskId = body.taskId || current.meta.task_id;
  if (!taskId) return Response.json({ ok: false, error: "taskId is required." }, { status: 400 });
  const task = getTask(taskId);
  if (!task) return Response.json({ ok: false, error: `Unknown task ${taskId}` }, { status: 404 });
  const initial = await readInitialSnapshot();
  if (!initial) return Response.json({ ok: false, error: "No initial snapshot. Reset the task first." }, { status: 409 });
  const report = task.grade({ current, initial });
  return Response.json({ ok: true, ...report });
}
