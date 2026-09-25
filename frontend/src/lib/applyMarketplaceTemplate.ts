import { emptyResume, type Customization, type Resume } from "../types/resume";
import { designWithoutHeadingLanguage } from "../data/templates";
import { resumeExists, saveResumeToDashboard } from "./api";
import { supabase } from "./supabase";
import { useResumeStore } from "../store/resumeStore";

export function shouldKeepCurrentResume(
  resume: Resume,
  nextTemplateId: string,
): boolean {
  if (resume.customization.template === nextTemplateId) return false;
  if (resume.id) return true;
  return resume.customization.template !== emptyResume.customization.template;
}

async function resolveUserId(userId?: string) {
  if (userId) return userId;
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id;
}

async function persistActiveResume(userId: string) {
  const resume = useResumeStore.getState().resume;
  const id = await saveResumeToDashboard(resume, userId);
  useResumeStore.getState().markSaved(id);
}

export async function applyMarketplaceTemplate(opts: {
  customization: Partial<Customization>;
  templateId: string;
  title: string;
  userId?: string;
  asNewResume?: boolean;
}) {
  const userId = await resolveUserId(opts.userId);
  const current = useResumeStore.getState().resume;

  if (current.id && userId) {
    const stillSaved = await resumeExists(current.id, userId).catch(() => true);
    if (!stillSaved) {
      useResumeStore
        .getState()
        .startResumeFromTemplate(opts.customization, opts.title);
      await persistActiveResume(userId);
      return;
    }
  }
  const startBlank =
    opts.asNewResume === true &&
    shouldKeepCurrentResume(current, opts.templateId);

  if (startBlank) {
    if (userId) await persistActiveResume(userId);
    useResumeStore
      .getState()
      .startResumeFromTemplate(opts.customization, opts.title);
  } else {
    useResumeStore.getState().updateCustomization(
      designWithoutHeadingLanguage(
        opts.customization,
        useResumeStore.getState().resume.customization.headingLanguage,
      ),
    );
    const after = useResumeStore.getState().resume;
    if (!after.title || after.title === emptyResume.title) {
      useResumeStore.getState().setTitle(opts.title);
    }
  }

  if (userId) await persistActiveResume(userId);
}
