import type { TaskDefinition, TaskPublic } from "@/platform/task";
import { publishTask } from "@/platform/task";
import { replyToInquiry } from "./t01";
import { publishListing } from "./t02";
import { maintenanceFromEmail } from "./t03";
import { screenApplicants } from "./t04";
import { rescheduleShowings } from "./t05";
import { followUpAfterTour } from "./t06";
import { postPartialPayment } from "./t07";
import { renewalOffer } from "./t08";
import { triageInquiries } from "./t09";
import { fairHousingRefusal } from "./t10";

export const tasks: TaskDefinition[] = [
  replyToInquiry,
  publishListing,
  maintenanceFromEmail,
  screenApplicants,
  rescheduleShowings,
  followUpAfterTour,
  postPartialPayment,
  renewalOffer,
  triageInquiries,
  fairHousingRefusal,
];

const byId = new Map(tasks.map((task) => [task.id, task]));

export function listTasks(): TaskPublic[] {
  return tasks.map(publishTask);
}

export function getTask(id: string): TaskDefinition | null {
  return byId.get(id) ?? tasks.find((task) => task.slug === id) ?? null;
}
