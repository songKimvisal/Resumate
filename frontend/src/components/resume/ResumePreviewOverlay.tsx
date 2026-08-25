import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import ResumePreview from "./ResumePreview";
import type { Resume } from "../../types/resume";

const A4_WIDTH_PX = 210 * (96 / 25.4);

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
            className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-black/60 backdrop-blur-sm p-4 py-8 sm:p-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          >
            <motion.div
              className="relative w-full"
              style={{ maxWidth: A4_WIDTH_PX }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
            >
              <ResumePreview resume={resume} pageLabelClassName="text-white/80" />
            </motion.div>
          </motion.div>
          <motion.button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed top-4 right-4 z-[90] size-9 rounded-full bg-white text-neutral-900 shadow-lg hover:bg-neutral-100 inline-flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </motion.button>
        </>
      )}
    </AnimatePresence>
  );
}
