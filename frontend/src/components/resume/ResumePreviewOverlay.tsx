import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import ResumePreview from "./ResumePreview";
import type { Resume } from "../../types/resume";

const A4_WIDTH_PX = 210 * (96 / 25.4);
// Sits just outside the page's right edge; falls back to the corner when there's no room.
const CLOSE_BUTTON_RIGHT = `max(1rem, calc((100vw - ${A4_WIDTH_PX}px) / 2 - 2.75rem))`;

export default function ResumePreviewOverlay({
  resume,
  open,
  onClose,
  closeLabel,
}: {
  resume: Resume | null | undefined;
  open: boolean;
  onClose: () => void;
  closeLabel: string;
}) {
  return (
    <AnimatePresence>
      {open && resume && (
        <>
          <motion.div
            className="fixed inset-0 z-[80] overflow-y-auto bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          >
            <div className="flex min-h-full items-center justify-center p-4 py-8 sm:p-8">
              <motion.div
                className="relative w-full"
                style={{ maxWidth: A4_WIDTH_PX }}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                onClick={(e) => e.stopPropagation()}
              >
                <ResumePreview
                  resume={resume}
                  pageLabelClassName="text-white/80"
                />
              </motion.div>
            </div>
          </motion.div>
          <motion.button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ right: CLOSE_BUTTON_RIGHT }}
            className="fixed top-4 sm:top-8 z-[90] size-9 rounded-full bg-white text-neutral-900 shadow-lg hover:bg-neutral-100 inline-flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </motion.button>
        </>
      )}
    </AnimatePresence>
  );
}
