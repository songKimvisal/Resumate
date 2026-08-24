import type { ExperienceItem, NoExperienceItem } from "../types/resume";

/** Display order for jobs + internships/projects. Missing/legacy saves
 *  fall back to jobs first, then the other entries. */
export function resolveExperienceOrder(
  jobIds: string[],
  otherIds: string[],
  stored?: string[] | null,
): string[] {
  const known = new Set([...jobIds, ...otherIds]);
  const fromStore = (stored ?? []).filter((id) => known.has(id));
  const seen = new Set(fromStore);
  const missing = [...jobIds, ...otherIds].filter((id) => !seen.has(id));
  return [...fromStore, ...missing];
}

export type OrderedExperienceEntry =
  | { kind: "job"; item: ExperienceItem }
  | { kind: "other"; item: NoExperienceItem };

/** Jobs + internships/projects in the same mixed order as Step 2. */
export function orderedExperienceEntries(resume: {
  experience: ExperienceItem[];
  noExperience: NoExperienceItem[];
  experienceOrder?: string[] | null;
}): OrderedExperienceEntry[] {
  const jobs = resume.experience ?? [];
  const others = resume.noExperience ?? [];
  const jobMap = new Map(jobs.map((item) => [item.id, item]));
  const otherMap = new Map(others.map((item) => [item.id, item]));
  return resolveExperienceOrder(
    jobs.map((item) => item.id),
    others.map((item) => item.id),
    resume.experienceOrder,
  )
    .map((id) => {
      const job = jobMap.get(id);
      if (job) return { kind: "job" as const, item: job };
      const other = otherMap.get(id);
      if (other) return { kind: "other" as const, item: other };
      return null;
    })
    .filter((entry): entry is OrderedExperienceEntry => entry !== null);
}

export function moveIdBefore(order: string[], dragId: string, overId: string) {
  if (dragId === overId) return order;
  const from = order.indexOf(dragId);
  const to = order.indexOf(overId);
  if (from === -1 || to === -1) return order;
  const next = [...order];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}
