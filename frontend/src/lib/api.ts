import { supabase } from "./supabase";
import type { Resume } from "../types/resume";
export async function saveResumeToDashboard(resume: Resume, userId: string) {
  const payload: Record<string, unknown> = {
    user_id: userId,
    title: resume.title,
    data: resume,
    updated_at: new Date().toISOString(),
  };

  if (resume.id) {
    const { data, error } = await supabase
      .from("resumes")
      .update(payload)
      .eq("id", resume.id)
      .eq("user_id", userId)
      .select("id")
      .maybeSingle();
    if (error) throw error;
    if (data?.id) return data.id as string;
  }

  const { data, error } = await supabase
    .from("resumes")
    .insert(payload)
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

export async function renameResume(id: string, title: string) {
  const { error } = await supabase
    .from("resumes")
    .update({ title, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteResume(id: string) {
  const { error } = await supabase.from("resumes").delete().eq("id", id);
  if (error) throw error;
}

export async function deleteResumes(ids: string[]) {
  if (ids.length === 0) return;
  const { error } = await supabase.from("resumes").delete().in("id", ids);
  if (error) throw error;
}

export async function resumeExists(id: string, userId: string) {
  const { data, error } = await supabase
    .from("resumes")
    .select("id")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return Boolean(data?.id);
}

export async function deleteAllResumes(userId: string) {
  const { error } = await supabase
    .from("resumes")
    .delete()
    .eq("user_id", userId);
  if (error) throw error;
}
