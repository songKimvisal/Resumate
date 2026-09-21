import { pdf } from "@react-pdf/renderer";
import { ResumeDocument } from "../components/resume/pdf/ResumeDocument";
import { deliverPdf } from "./pdfDelivery";
import type { Resume } from "../types/resume";


export async function downloadResumePdf(resume: Resume) {
  const filename = `${personalFileName(resume) || "resume"}.pdf`;
  const blob = await renderPdfBlob(resume);
  return deliverPdf(blob, filename);
}

async function renderPdfBlob(resume: Resume) {
  const instance = pdf(<ResumeDocument resume={resume} />);
  // first pass can be incomplete, second one is the real render
  await instance.toBlob();
  return instance.toBlob();
}

function personalFileName(resume: Resume) {
  return resume.personal.fullName.trim().replace(/\s+/g, "_");
}
