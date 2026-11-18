const base = process.env.BASE_URL || "http://localhost:3000";
const token = process.env.ENV_ADMIN_TOKEN || "dev-admin-token";

const [command, ...rest] = process.argv.slice(2);

function flag(name: string): string | undefined {
  const index = rest.indexOf(`--${name}`);
  if (index === -1) return undefined;
  return rest[index + 1];
}

function out(value: unknown): void {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

async function api(path: string, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers);
  headers.set("x-env-token", token);
  if (init?.body && !headers.has("content-type")) headers.set("content-type", "application/json");
  return fetch(new URL(path, base), { ...init, headers });
}

async function main(): Promise<void> {
  if (!command || command === "help" || command === "--help") {
    out({
      ok: true,
      commands: {
        list: "List tasks",
        reset: "Reset to a task or seed. Flags: --task, --seed",
        grade: "Grade the current state. Flag: --task",
        snapshot: "Export the database snapshot",
        run: "Reset a task and print its prompt. Flag: --task",
      },
    });
    return;
  }

  if (command === "list") {
    const response = await api("/api/env/tasks");
    const body = await response.json();
    out(body);
    if (!response.ok) process.exit(2);
    return;
  }

  if (command === "snapshot") {
    const response = await api("/api/env/snapshot");
    const body = await response.json();
    out(body);
    if (!response.ok) process.exit(2);
    return;
  }

  if (command === "reset" || command === "run") {
    const taskId = flag("task");
    const seedText = flag("seed");
    const payload: { taskId?: string; seed?: number } = {};
    if (taskId) payload.taskId = taskId;
    if (seedText) payload.seed = Number(seedText);
    const response = await api("/api/env/reset", { method: "POST", body: JSON.stringify(payload) });
    const resetBody = await response.json();
    if (!response.ok) {
      out(resetBody);
      process.exit(2);
    }
    if (command === "reset") {
      out(resetBody);
      return;
    }
    const tasksResponse = await api("/api/env/tasks");
    const tasksBody = (await tasksResponse.json()) as { tasks?: { id: string; prompt: string }[] };
    const task = tasksBody.tasks?.find((item) => item.id === (taskId || resetBody.taskId));
    out({ ok: true, reset: resetBody, task: task ?? null });
    return;
  }

  if (command === "grade") {
    const taskId = flag("task");
    const response = await api("/api/env/grade", {
      method: "POST",
      body: JSON.stringify(taskId ? { taskId } : {}),
    });
    const body = await response.json();
    out(body);
    if (!response.ok) process.exit(2);
    process.exit(body.passed ? 0 : 1);
  }

  out({ ok: false, error: `Unknown command ${command}` });
  process.exit(2);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "CLI failed";
  out({ ok: false, error: message });
  process.exit(2);
});
