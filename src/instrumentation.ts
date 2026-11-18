export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { ensureBootstrapped } = await import("./server/seed");
  await ensureBootstrapped();
}
