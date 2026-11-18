export function adminToken(): string {
  const token = process.env.ENV_ADMIN_TOKEN;
  if (!token) throw new Error("ENV_ADMIN_TOKEN is not set.");
  return token;
}

export function isAdmin(request: Request): boolean {
  return request.headers.get("x-env-token") === adminToken();
}

export function unauthorized(): Response {
  return Response.json({ ok: false, error: "Admin token required." }, { status: 401 });
}
