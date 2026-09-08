import { pdf } from "@react-pdf/renderer";
import { ResumeDocument } from "../components/resume/pdf/ResumeDocument";
import type { Resume } from "../types/resume";

/** Renders the resume to a PDF and saves it on the user's device. */
export async function downloadResumePdf(resume: Resume) {
  const filename = `${personalFileName(resume) || "resume"}.pdf`;

  // open Save dialog now, before the click gesture expires
  const fileHandle = await requestSaveHandle(filename);

  const blob = await renderPdfBlob(resume);

  if (fileHandle) {
    const writable = await fileHandle.createWritable();
    await writable.write(blob);
    await writable.close();
    return;
  }

  triggerDownload(blob, filename);
}

async function renderPdfBlob(resume: Resume) {
  const instance = pdf(<ResumeDocument resume={resume} />);
  // first pass can be incomplete, second one is the real render
  await instance.toBlob();
  return instance.toBlob();
}

async function requestSaveHandle(filename: string) {
  const picker = window.showSaveFilePicker;
  if (typeof picker !== "function") return null;
  try {
    return await picker({
      suggestedName: filename,
      types: [
        {
          description: "PDF",
          accept: { "application/pdf": [".pdf"] },
        },
      ],
    });
  } catch (err) {
    if (isAbort(err)) throw err;
    return null;
  }
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

function isAbort(err: unknown) {
  return err instanceof DOMException && err.name === "AbortError";
}

function personalFileName(resume: Resume) {
  return resume.personal.fullName.trim().replace(/\s+/g, "_");
}

export function isDownloadAbort(err: unknown) {
  return isAbort(err);
}
