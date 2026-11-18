import { isAdmin, unauthorized } from "@/server/admin";
import { listTasks } from "@/tasks";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  if (!isAdmin(request)) return unauthorized();
  return Response.json({ ok: true, tasks: listTasks() });
}
