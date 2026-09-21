import { create } from "zustand";

export type PdfDelivery = "shared" | "downloaded" | "pending";

function ua() {
  return typeof navigator === "undefined" ? "" : navigator.userAgent || "";
}

export function isIos() {
  return (
    /iPad|iPhone|iPod/.test(ua()) ||
    (/Macintosh/.test(ua()) && (navigator.maxTouchPoints ?? 0) > 1)
  );
}

export function isAndroid() {
  return /Android/.test(ua());
}

export function isInAppBrowser() {
  const u = ua();
  if (/FBAN|FBAV|FB_IAB|FBIOS|Instagram|Line\/|TikTok|MicroMessenger/.test(u)) {
    return true;
  }
  return isAndroid() && /;\s*wv\b/.test(u);
}

function prefersShareSheet() {
  return isIos() || isInAppBrowser();
}

function canShareFile(file: File) {
  return (
    typeof navigator !== "undefined" &&
    typeof navigator.share === "function" &&
    typeof navigator.canShare === "function" &&
    navigator.canShare({ files: [file] })
  );
}

function isAbort(err: unknown) {
  return err instanceof DOMException && err.name === "AbortError";
}

function anchorDownload(file: File) {
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  a.rel = "noopener";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

function openInTab(file: File) {
  const url = URL.createObjectURL(file);
  window.open(url, "_blank", "noopener");
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export async function deliverPdf(
  blob: Blob,
  filename: string,
): Promise<PdfDelivery> {
  const file = new File([blob], filename, { type: "application/pdf" });

  if (prefersShareSheet() && canShareFile(file)) {
    try {
      await navigator.share({ files: [file], title: filename });
      return "shared";
    } catch (err) {
      if (isAbort(err)) return "shared";
      usePdfSaveSheet.getState().open(file);
      return "pending";
    }
  }

  if (prefersShareSheet()) {
    usePdfSaveSheet.getState().open(file);
    return "pending";
  }

  anchorDownload(file);
  return "downloaded";
}

export async function savePdfFromGesture(file: File): Promise<PdfDelivery> {
  if (canShareFile(file)) {
    try {
      await navigator.share({ files: [file], title: file.name });
      return "shared";
    } catch (err) {
      if (isAbort(err)) return "shared";
    }
  }
  if (prefersShareSheet()) {
    openInTab(file);
    return "pending";
  }
  anchorDownload(file);
  return "downloaded";
}

interface PdfSaveSheetState {
  file: File | null;
  open: (file: File) => void;
  close: () => void;
}

export const usePdfSaveSheet = create<PdfSaveSheetState>((set) => ({
  file: null,
  open: (file) => set({ file }),
  close: () => set({ file: null }),
}));
