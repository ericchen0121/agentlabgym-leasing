import { expect, test } from "@playwright/test";
import { compose, openThread, resetSeed, snapshot } from "./support";

test.beforeEach(async ({ request }) => {
  await resetSeed(request, 7);
});

test("workplace shell and four apps render seeded records", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Good morning/ })).toBeVisible();
  await expect(page.getByTestId("workplace-clock")).toContainText("April 15, 2026");
  await expect(page.getByTestId("env-seed")).toContainText("Dataset 7");

  await page.getByRole("link", { name: "Desk", exact: true }).click();
  await page.getByRole("link", { name: "Properties" }).click();
  await expect(page.getByRole("heading", { name: "Cedar Hollow Apartments" })).toBeVisible();
  await page.getByRole("link", { name: "Cedar Hollow Apartments" }).click();
  await expect(page.getByRole("link", { name: "2", exact: true })).toBeVisible();

  await page.goto("/stoop");
  await expect(page.getByRole("heading", { name: /courtyard one-bedroom/ })).toBeVisible();
  await page.goto("/stoop/portal");
  await expect(page.getByRole("link", { name: /still listed by mistake/ })).toBeVisible();
  await page.goto("/stoop/inbox");
  await expect(page.getByText("Sam Nguyen")).toBeVisible();

  await page.goto("/mail");
  await expect(page.getByRole("link", { name: /Welcome to the Larkspur desk/ })).toBeVisible();
  await page.goto("/calendar");
  await expect(page.getByRole("link", { name: /Leasing standup/ })).toBeVisible();
  await page.goto("/calendar/new");
  await expect(page.getByRole("heading", { name: "New event" })).toBeVisible();
});

test("mail search, labels, and scripted persona replies", async ({ page }) => {
  await page.goto("/mail");
  await page.getByLabel("Search mail").fill("Welcome");
  await page.getByRole("button", { name: "Search" }).click();
  await expect(page.getByRole("link", { name: /Welcome to the Larkspur desk/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /You won a boat/ })).toHaveCount(0);

  await compose(page, "sam.nguyen@persona.example", "Hello there", "Hello there, just checking in.");
  await page.goto("/mail");
  await openThread(page, "Hello there");
  await expect(page.getByText("Hello back from Sam. I am still looking.")).toBeVisible();

  await compose(page, "sam.nguyen@persona.example", "Keys", "A note about keys for the courtyard.");
  await openThread(page, "Keys");
  await expect(page.getByText("Thanks, I got your note.")).toBeVisible();
});

test("public inquiry lands in Postroom and a portal listing can be published", async ({ page }) => {
  await page.goto("/stoop");
  await page.getByRole("link", { name: /courtyard one-bedroom/ }).click();
  await page.getByLabel("Name").fill("Pat Example");
  await page.getByLabel("Email").fill("pat.example@persona.example");
  await page.getByLabel("Message").fill("Is the courtyard flat still open?");
  await page.getByRole("button", { name: "Send inquiry" }).click();
  await expect(page.getByRole("status")).toContainText("Saved");

  await page.goto("/mail");
  await expect(page.getByRole("link", { name: /Inquiry: Cedar Hollow 2/ })).toBeVisible();
  await page.goto("/stoop/inbox");
  await expect(page.getByText("Pat Example")).toBeVisible();

  await page.goto("/stoop/portal/listings/new?unit=bg_u_brick_2");
  await expect(page.getByTestId("source-rent")).toHaveText("$1,680.00");
  await page.getByLabel("Listing title").fill("Test loft");
  await page.getByLabel("Description").fill("A small loft used by the smoke test.");
  await page.getByLabel("Status").selectOption("published");
  await page.getByRole("button", { name: "Save listing" }).click();
  await expect(page.getByRole("status")).toContainText("Saved");
  await page.goto("/stoop");
  await expect(page.getByRole("heading", { name: "Test loft" })).toBeVisible();
});

test("reset is deterministic and the admin API rejects a missing token", async ({ request }) => {
  await resetSeed(request, 42);
  const first = await snapshot(request);
  await resetSeed(request, 42);
  const second = await snapshot(request);
  expect(second).toEqual(first);

  await resetSeed(request, 43);
  const third = await snapshot(request);
  expect(third).not.toEqual(first);
  const notes = (rows: Record<string, unknown>) =>
    (rows.properties as { id: string; notes: string }[]).find((property) => property.id === "bg_prop_cedar")?.notes;
  expect(notes(first)).toContain("Dataset 42");
  expect(notes(third)).toContain("Dataset 43");
  expect(notes(first)).not.toEqual(notes(third));

  const denied = await request.post("/api/env/reset", { data: { seed: 1 } });
  expect(denied.status()).toBe(401);
});
