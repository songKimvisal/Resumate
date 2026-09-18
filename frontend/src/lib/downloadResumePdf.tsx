import { pdf } from "@react-pdf/renderer";
import { ResumeDocument } from "../components/resume/pdf/ResumeDocument";
import type { Resume } from "../types/resume";


export async function downloadResumePdf(resume: Resume) {
  const filename = `${personalFileName(resume) || "resume"}.pdf`;
  const blob = await renderPdfBlob(resume);
  triggerDownload(blob, filename);
}

async function renderPdfBlob(resume: Resume) {
  const instance = pdf(<ResumeDocument resume={resume} />);
  // first pass can be incomplete, second one is the real render
  await instance.toBlob();
  return instance.toBlob();
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

function personalFileName(resume: Resume) {
  return resume.personal.fullName.trim().replace(/\s+/g, "_");
}
