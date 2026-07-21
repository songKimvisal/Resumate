import { supabase } from "./supabase";
import type { Resume } from "../types/resume";
export async function saveResumeToDashboard(resume: Resume, userId: string) {
  const payload: Record<string, unknown> = {
    user_id: userId,
    title: resume.title,
    data: resume,
    updated_at: new Date().toISOString(),
  };
  if (resume.id) payload.id = resume.id;

  const { data, error } = await supabase
    .from("resumes")
    .upsert(payload)
    .select("id")
    .single();

  if (error) throw error;
  return data.id as string;
}
