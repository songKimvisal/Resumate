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

export interface DashboardResume {
  resume: Resume;
  updatedAt: string;
}

export async function getResumesByUser(
  userId: string,
): Promise<DashboardResume[]> {
  const { data, error } = await supabase
    .from("resumes")
    .select("id, title, data, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    resume: {
      ...(row.data as Resume),
      id: row.id as string,
      title: row.title as string,
    },
    updatedAt: row.updated_at as string,
  }));
}

export async function deleteResume(id: string) {
  const { error } = await supabase.from("resumes").delete().eq("id", id);
  if (error) throw error;
}

export async function deleteAllResumes(userId: string) {
  const { error } = await supabase
    .from("resumes")
    .delete()
    .eq("user_id", userId);
  if (error) throw error;
}
