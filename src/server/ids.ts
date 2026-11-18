import { randomUUID } from "crypto";

export function nid(prefix: string): string {
  return `${prefix}_${randomUUID().slice(0, 8)}`;
}
