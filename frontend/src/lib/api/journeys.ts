import { supabase } from "../supabase";
import type { JourneyDraft } from "../../store/journeyStore";

export type JourneyRow = {
  resumeId: string;
  data: JourneyDraft;
  updatedAt: string;
};

export async function getJourneysByUser(userId: string): Promise<JourneyRow[]> {
  const { data, error } = await supabase
    .from("job_journeys")
    .select("resume_id, data, updated_at")
    .eq("user_id", userId);

  if (error) throw error;

  return (data ?? []).map((row) => ({
    resumeId: row.resume_id as string,
    data: (row.data ?? {}) as JourneyDraft,
    updatedAt: row.updated_at as string,
  }));
}

export async function upsertJourney(
  userId: string,
  resumeId: string,
  draft: JourneyDraft,
) {
  const updatedAt = draft.updatedAt ?? new Date().toISOString();
  const { error } = await supabase.from("job_journeys").upsert(
    {
      resume_id: resumeId,
      user_id: userId,
      data: { ...draft, updatedAt },
      updated_at: updatedAt,
    },
    { onConflict: "resume_id" },
  );
  if (error) throw error;
}

export async function deleteJourney(userId: string, resumeId: string) {
  const { error } = await supabase
    .from("job_journeys")
    .delete()
    .eq("user_id", userId)
    .eq("resume_id", resumeId);
  if (error) throw error;
}
