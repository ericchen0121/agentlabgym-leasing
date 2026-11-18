import { isAdmin, unauthorized } from "@/server/admin";
import { readSnapshot } from "@/server/snapshot";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  if (!isAdmin(request)) return unauthorized();
  const snapshot = await readSnapshot();
  return Response.json(snapshot);
}
