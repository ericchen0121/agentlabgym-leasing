import { redirect } from "next/navigation";
import {
  decideApplication,
  postLedger,
  publicInquiry,
  saveEvent,
  saveListing,
  saveNote,
  saveWorkOrder,
  sendMail,
  setMessageFolder,
  setMessageLabels,
  updateLeadStatus,
  updateLeaseRent,
} from "./write";

function safeReturn(value: FormDataEntryValue | null, fallback: string): string {
  const text = String(value ?? "");
  if (text.startsWith("/") && !text.startsWith("//") && !text.includes("\\")) return text;
  return fallback;
}

function isRedirect(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    String((error as { digest?: string }).digest).startsWith("NEXT_REDIRECT")
  );
}

export async function handleForm(request: Request): Promise<never> {
  const form = await request.formData();
  const op = String(form.get("op") ?? "");
  const back = safeReturn(form.get("return"), "/");
  try {
    const next = await dispatch(op, form);
    redirect(withNotice(next || back, "Saved."));
  } catch (error) {
    if (isRedirect(error)) throw error;
    const message = error instanceof Error ? error.message : "Request failed.";
    console.error(error);
    redirect(withParam(back, "error", message));
  }
}

async function dispatch(op: string, form: FormData): Promise<string | void> {
  switch (op) {
    case "send-mail":
      await sendMail(form);
      return;
    case "set-folder":
      await setMessageFolder(form);
      return;
    case "set-labels":
      await setMessageLabels(form);
      return;
    case "save-listing":
      return saveListing(form);
    case "save-event":
      return saveEvent(form);
    case "save-note":
      await saveNote(form);
      return;
    case "lead-status":
      await updateLeadStatus(form);
      return;
    case "decide-application":
      await decideApplication(form);
      return;
    case "post-ledger":
      await postLedger(form);
      return;
    case "update-lease-rent":
      await updateLeaseRent(form);
      return;
    case "save-work-order":
      return saveWorkOrder(form);
    case "public-inquiry":
      await publicInquiry(form);
      return;
    default:
      throw new Error("Unknown form.");
  }
}

function withParam(path: string, key: string, value: string): string {
  const [pathname, query = ""] = path.split("?");
  const params = new URLSearchParams(query);
  params.set(key, value);
  return `${pathname}?${params.toString()}`;
}

function withNotice(path: string, notice: string): string {
  return withParam(path, "notice", notice);
}
