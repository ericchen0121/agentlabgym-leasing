import { expect, type APIRequestContext, type Page } from "@playwright/test";

const token = process.env.ENV_ADMIN_TOKEN || "dev-admin-token";

export type Grade = {
  passed: boolean;
  score: number;
  checks: { id: string; passed: boolean; detail: string }[];
};

async function ok(response: Awaited<ReturnType<APIRequestContext["post"]>>): Promise<void> {
  if (!response.ok()) throw new Error(`${response.status()} ${await response.text()}`);
}

export async function resetTask(request: APIRequestContext, taskId: string): Promise<void> {
  const response = await request.post("/api/env/reset", {
    headers: { "x-env-token": token },
    data: { taskId },
  });
  await ok(response);
}

export async function resetSeed(request: APIRequestContext, seed: number): Promise<void> {
  const response = await request.post("/api/env/reset", {
    headers: { "x-env-token": token },
    data: { seed },
  });
  await ok(response);
}

export async function grade(request: APIRequestContext, taskId: string): Promise<Grade> {
  const response = await request.post("/api/env/grade", {
    headers: { "x-env-token": token },
    data: { taskId },
  });
  await ok(response);
  return response.json() as Promise<Grade>;
}

export async function snapshot(request: APIRequestContext): Promise<Record<string, unknown>> {
  const response = await request.get("/api/env/snapshot", { headers: { "x-env-token": token } });
  await ok(response);
  return response.json();
}

export function expectPassed(report: Grade): void {
  const failed = report.checks.filter((item) => !item.passed).map((item) => `${item.id}: ${item.detail}`);
  expect(failed, failed.join("\n")).toEqual([]);
  expect(report.passed).toBe(true);
  expect(report.score).toBe(1);
}

export function expectFailed(report: Grade, checkId: string): void {
  expect(report.passed).toBe(false);
  expect(report.score).toBeLessThan(1);
  expect(report.checks.find((item) => item.id === checkId)?.passed).toBe(false);
}

export async function openThread(page: Page, subject: string): Promise<void> {
  await page.goto("/mail");
  await page.getByRole("link", { name: new RegExp(subject, "i") }).first().click();
}

export async function reply(page: Page, body: string): Promise<void> {
  await page.getByLabel("Reply").fill(body);
  await page.getByRole("button", { name: "Send reply" }).click();
  await expect(page.getByRole("status")).toContainText("Saved");
}

export async function compose(page: Page, to: string, subject: string, body: string): Promise<void> {
  await page.goto("/mail/compose");
  await page.getByLabel("To").fill(to);
  await page.getByLabel("Subject").fill(subject);
  await page.getByLabel("Message").fill(body);
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Saved");
}

export async function bookShowing(
  page: Page,
  input: { title: string; start: string; end: string; unitId: string; email: string; name: string },
): Promise<void> {
  await page.goto("/calendar/new");
  await page.getByLabel("Title").fill(input.title);
  await page.getByLabel("Starts").fill(input.start);
  await page.getByLabel("Ends").fill(input.end);
  await page.getByLabel("Kind").selectOption("showing");
  await page.getByLabel("Status").selectOption("confirmed");
  await page.getByLabel("Unit").selectOption(input.unitId);
  await page.getByLabel("Attendee email").fill(input.email);
  await page.getByLabel("Attendee name").fill(input.name);
  await page.getByRole("button", { name: "Save event" }).click();
  await expect(page.getByRole("status")).toContainText("Saved");
}
