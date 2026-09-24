import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUp } from "lucide-react";

export default function BackToTop() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // show once the viewer is past roughly the hero + one more screen
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 1.5);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          aria-label={t("home.backToTop")}
          title={t("home.backToTop")}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          whileTap={{ scale: 0.92 }}
          transition={{ duration: 0.2 }}
          className="fixed right-[max(1rem,env(safe-area-inset-right))] bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 inline-flex size-11 items-center justify-center rounded-full border-2 border-brand bg-bg text-text shadow-lg transition-colors hover:bg-brand hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:right-6 sm:bottom-6 sm:size-12"
        >
          <ArrowUp className="size-4.5 sm:size-5" strokeWidth={2.5} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
