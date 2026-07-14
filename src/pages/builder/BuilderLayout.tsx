import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "motion/react";
import { Sun, Moon, LayoutGrid, Eye, X } from "lucide-react";
import { useTheme } from "../../hooks/UseTheme";
import { useResumeStore } from "../../store/resumeStore";
import ResumePreview from "../../components/resume/ResumePreview";
import { Button } from "../../components/ui/button";
import Step1Personal from "./Step1Personal";
import Step2Experience from "./Step2experience";
import logo from "../../assets/logo/logo.png";
import mascot from "../../assets/logo/tip_mascot.png";
import { cn } from "../../lib/utils";

const TOTAL_STEPS = 5;
const ACCENT_COLORS = ["#C1121F", "#1D4ED8", "#0F766E", "#7C3AED", "#374151"];
// 210mm in real CSS px (1in = 96px)
const A4_WIDTH_PX = 210 * (96 / 25.4);

export default function BuilderLayout() {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const toggleLanguage = () =>
    i18n.changeLanguage(i18n.language === "en" ? "km" : "en");
  const [step, setStep] = useState(1);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [tipOpen, setTipOpen] = useState(false);
  const tipRef = useRef<HTMLDivElement>(null);

  const dirty = useResumeStore((s) => s.dirty);
  const customization = useResumeStore((s) => s.resume.customization);
  const updateCustomization = useResumeStore((s) => s.updateCustomization);

  const stepLabels = t("builder.steps", { returnObjects: true }) as string[];
  const tips = t("builder.tips", { returnObjects: true }) as string[];

  // close the mascot tip when clicking outside of it
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (tipRef.current && !tipRef.current.contains(e.target as Node)) {
        setTipOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  // measure the sticky step-indicator bar so the preview panel can stick
  // flush beneath it, regardless of locale/text length affecting its height
  const stepBarRef = useRef<HTMLDivElement>(null);
  const [stepBarHeight, setStepBarHeight] = useState(80);

  useEffect(() => {
    const el = stepBarRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) =>
      setStepBarHeight(entry.contentRect.height),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!previewOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPreviewOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [previewOpen]);

  // CSS `position: sticky` wasn't holding inside this grid layout, so pin
  // the preview panel below the step bar manually based on scroll position
  const previewWrapperRef = useRef<HTMLDivElement>(null);
  const previewPanelRef = useRef<HTMLDivElement>(null);
  const previewHeaderRef = useRef<HTMLDivElement>(null);
  // measures the unclamped content height, so the wrapper always reserves
  // enough space even once the panel is pinned and scrolls internally
  const previewContentRef = useRef<HTMLButtonElement>(null);
  const [previewPanelHeight, setPreviewPanelHeight] = useState(0);
  const [previewHeaderHeight, setPreviewHeaderHeight] = useState(0);
  const [previewFixedRect, setPreviewFixedRect] = useState<{
    left: number;
    width: number;
  } | null>(null);

  useEffect(() => {
    const header = previewHeaderRef.current;
    const content = previewContentRef.current;
    if (!header || !content) return;
    const update = () => {
      setPreviewHeaderHeight(header.offsetHeight);
      setPreviewPanelHeight(header.offsetHeight + content.offsetHeight);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(header);
    observer.observe(content);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const wrapper = previewWrapperRef.current;
    if (!wrapper) return;
    const update = () => {
      const rect = wrapper.getBoundingClientRect();
      setPreviewFixedRect(
        rect.top <= stepBarHeight
          ? { left: rect.left, width: rect.width }
          : null,
      );
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [stepBarHeight]);

  const next = () => setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  const back = () => setStep((s) => Math.max(1, s - 1));

  return (
    <div className="min-h-screen bg-bg text-text flex flex-col">
      {/* ================= header ================= */}
      <header className="flex items-center justify-between px-6 h-16">
        <Link to="/dashboard">
          <img src={logo} alt="ResuMate" className="h-9 w-auto" />
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleLanguage}
            className="size-9 rounded-lg text-text-secondary hover:bg-surface-2 hover:text-text transition-colors text-sm font-medium"
            aria-label="Switch language"
          >
            {i18n.language === "en" ? "ខ្មែរ" : "EN"}
          </button>

          <button
            onClick={toggleTheme}
            className="size-9 rounded-lg text-text-secondary hover:bg-surface-2 hover:text-text transition-colors inline-flex items-center justify-center"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun size={17} strokeWidth={2} />
            ) : (
              <Moon size={17} strokeWidth={2} />
            )}
          </button>

          
          <span className="flex items-center gap-2 text-sm border border-line rounded-full px-3 sm:px-4 py-1.5 whitespace-nowrap">
            <span
              className={`size-2 rounded-full shrink-0 ${dirty ? "bg-amber-500" : "bg-success"}`}
            />
            <span className="hidden sm:inline">
              {dirty ? t("builder.unsaved") : t("builder.saved")}
            </span>
          </span>
        </div>
      </header>

      {/* ================= step indicator ================= */}
      <div
        ref={stepBarRef}
        className="sticky top-0 z-30 bg-bg/95 backdrop-blur-sm"
      >
        <div className="grid grid-cols-5 max-w-5xl w-full mx-auto px-4 pt-2">
          {stepLabels.map((label, i) => {
            const n = i + 1;
            const active = n === step;
            const done = n < step;
            return (
              <button
                key={i}
                onClick={() => setStep(n)}
                className={`flex flex-col items-center gap-2 pb-3 border-b-2 transition-colors ${
                  active ? "border-brand" : "border-line"
                }`}
              >
                <span
                  className={`size-7 rounded-full inline-flex items-center justify-center text-xs font-semibold border ${
                    active
                      ? "border-brand text-brand"
                      : done
                        ? "bg-brand border-brand text-white"
                        : "border-line text-text-secondary"
                  }`}
                >
                  {done ? "✓" : n}
                </span>
                <span
                  className={`hidden sm:block text-sm ${
                    active ? "text-brand font-medium" : "text-text-secondary"
                  }`}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ================= form + preview ================= */}
      
      <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-10 pb-28 grid lg:grid-cols-[45fr_55fr] lg:divide-x divide-line gap-10 items-start">
        {/* ---------- left: current step ---------- */}
        <div>
          <AnimatePresence mode="popLayout">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.25 }}
            >
              {step === 1 && <Step1Personal />}
              {step === 2 && <Step2Experience />}
              {step > 2 && (
                <div className="py-16 text-center text-text-secondary">
                  <p className="font-medium">{stepLabels[step - 1]}</p>
                  <p className="text-sm mt-2">{t("builder.comingSoon")}</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ---------- right: live preview ---------- */}
        <div
          ref={previewWrapperRef}
          className="hidden lg:block"
          style={{ minHeight: previewPanelHeight || undefined }}
        >
          <div
            ref={previewPanelRef}
            style={
              previewFixedRect
                ? {
                    position: "fixed",
                    top: stepBarHeight,
                    left: previewFixedRect.left,
                    width: previewFixedRect.width,
                  }
                : undefined
            }
          >
            <div ref={previewHeaderRef} className="flex items-center justify-between mb-5">
              {/* customize popover */}
              <div className="relative">
                <Button
                  size="compact"
                  onClick={() => setCustomizeOpen((o) => !o)}
                >
                  <LayoutGrid size={15} strokeWidth={2} />
                  {t("builder.customize")}
                </Button>

                {customizeOpen && (
                  <div className="absolute left-0 top-full mt-2 z-20 w-64 rounded-xl border border-line bg-bg shadow-lg p-4 space-y-4">
                    <div className="space-y-2">
                      <p className="text-xs font-semibold tracking-widest uppercase text-text-secondary">
                        {t("builder.accentColor")}
                      </p>
                      <div className="flex gap-2">
                        {ACCENT_COLORS.map((c) => (
                          <button
                            key={c}
                            onClick={() =>
                              updateCustomization({ accentColor: c })
                            }
                            className={`size-7 rounded-full border-2 transition-transform hover:scale-110 ${
                              customization.accentColor === c
                                ? "border-text"
                                : "border-transparent"
                            }`}
                            style={{ backgroundColor: c }}
                            aria-label={c}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-semibold tracking-widest uppercase text-text-secondary">
                        {t("builder.fontSize")}
                      </p>
                      <div className="flex gap-2">
                        {(["small", "medium", "large"] as const).map((size) => (
                          <button
                            key={size}
                            onClick={() =>
                              updateCustomization({ fontSize: size })
                            }
                            className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                              customization.fontSize === size
                                ? "border-brand text-brand font-medium"
                                : "border-line text-text-secondary hover:bg-surface-2"
                            }`}
                          >
                            {t(`builder.fontSizes.${size}`)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <span className="flex items-center gap-2 text-sm text-brand font-medium">
                <span className="size-2 rounded-full bg-brand animate-pulse" />
                {t("builder.livePreview")}
              </span>
            </div>

            <div
              className={cn(
                previewFixedRect && "scrollbar-thin overflow-y-auto",
              )}
              style={{
                maxWidth: A4_WIDTH_PX,
                ...(previewFixedRect && {
                  // leave room for the floating bottom bar so the pinned
                  // preview never hides its own controls behind it
                  maxHeight: `calc(100vh - ${stepBarHeight}px - 4.5rem - ${previewHeaderHeight}px)`,
                }),
              }}
            >
              <button
                ref={previewContentRef}
                type="button"
                onClick={() => setPreviewOpen(true)}
                className="block w-full text-left cursor-zoom-in"
              >
                <ResumePreview />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ================= preview overlay ================= */}
      <AnimatePresence>
        {previewOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 backdrop-blur-sm p-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPreviewOpen(false)}
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
                <ResumePreview pageLabelClassName="text-white/80" />
              </motion.div>
            </motion.div>

            {/* fixed to the viewport (not the scrollable content) so it
                stays reachable no matter how far you've scrolled through a
                multi-page resume, with strong contrast against any page */}
            <motion.button
              type="button"
              onClick={() => setPreviewOpen(false)}
              aria-label={t("builder.closePreview")}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed top-4 right-4 z-[60] size-9 rounded-full bg-white text-neutral-900 shadow-lg hover:bg-neutral-100 inline-flex items-center justify-center transition-colors"
            >
              <X size={18} strokeWidth={2} />
            </motion.button>
          </>
        )}
      </AnimatePresence>

      {/* ================= floating mascot tip =================
          desktop-only: below lg there's no preview panel for it to float
          beside, so it just drifts over the full-width form instead */}
      <div ref={tipRef} className="hidden lg:block fixed bottom-20 right-6 z-40">
        <AnimatePresence>
          {tipOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ duration: 0.18 }}
              className="absolute bottom-full right-0 mb-3 w-64 rounded-xl border border-line bg-bg shadow-lg p-4"
            >
              <p className="text-xs font-semibold tracking-widest uppercase text-brand">
                {t("builder.tipsTitle")}
              </p>
              <p className="mt-1.5 text-sm text-text leading-relaxed">
                {tips[step - 1]}
              </p>
              <span className="absolute top-full right-6 -mt-px size-3 rotate-45 border-b border-r border-line bg-bg" />
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          type="button"
          onClick={() => setTipOpen((o) => !o)}
          aria-label={t("builder.tipsTitle")}
          className="block"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        >
          <img src={mascot} alt="" className="w-16 drop-shadow-lg" />
        </motion.button>
      </div>

      {/* ================= floating preview button =================
          mobile-only: the live preview column above is desktop-only (lg+),
          so smaller screens need their own way into the overlay. Fixed in
          place (not just in the header) so it stays reachable no matter
          how far the user has scrolled down the form. */}
      <motion.button
        type="button"
        onClick={() => setPreviewOpen(true)}
        aria-label={t("builder.previewButton")}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="lg:hidden fixed bottom-20 right-4 z-40 size-12 rounded-full bg-brand text-white shadow-lg inline-flex items-center justify-center"
      >
        <Eye size={20} strokeWidth={2} />
      </motion.button>

      {/* ================= floating bottom bar ================= */}
      <div className="fixed bottom-0 inset-x-0 bg-bg/90 backdrop-blur border-t border-line">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          {step > 1 ? (
            <Button size="sm" variant="outline" onClick={back}>
              ← {t("builder.back")}
            </Button>
          ) : (
            <Link to="/dashboard">
              <Button size="sm" variant="outline">
                ← {t("builder.back")}
              </Button>
            </Link>
          )}

          <p className="text-sm text-text-secondary truncate min-w-0 flex-1 text-center px-3">
            {t("builder.stepOf", { current: step, total: TOTAL_STEPS })}
            <span className="hidden sm:inline"> – {stepLabels[step - 1]}</span>
          </p>

          <Button size="sm" onClick={next} disabled={step === TOTAL_STEPS}>
            {t("builder.next")} →
          </Button>
        </div>
      </div>
    </div>
  );
}
