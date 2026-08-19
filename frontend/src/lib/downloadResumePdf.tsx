import { pdf } from "@react-pdf/renderer";
import { ResumeDocument } from "../components/resume/pdf/ResumeDocument";
import type { Resume } from "../types/resume";

/** Renders the resume to an A4 PDF and triggers a browser download. */
export async function downloadResumePdf(resume: Resume) {
  const blob = await pdf(<ResumeDocument resume={resume} />).toBlob();
  const url = URL.createObjectURL(blob);
  const filename = (personalFileName(resume) || "resume") + ".pdf";

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function personalFileName(resume: Resume) {
  return resume.personal.fullName.trim().replace(/\s+/g, "_");
}
