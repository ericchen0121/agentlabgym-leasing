import { handleForm } from "@/server/forms";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  return handleForm(request);
}
