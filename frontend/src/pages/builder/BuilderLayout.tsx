import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "motion/react";
import {
  Sun,
  Moon,
  LayoutGrid,
  FileText,
  ArrowLeft,
  Eye,
  Lightbulb,
  Plus,
  X,
} from "lucide-react";
import { useTheme } from "../../hooks/UseTheme";
import { useAuth } from "../../hooks/UseAuth";
import {
  useResumeStore,
  useResumeStoreHydrated,
} from "../../store/resumeStore";
import { saveResumeToDashboard } from "../../lib/api";
import ResumePreview from "../../components/resume/ResumePreview";
import { Button } from "../../components/ui/button";
import { cn } from "../../lib/utils";
import Step1Personal from "./Step1Personal";
import Step2Experience from "./Step2experience";
import Step3Education from "./Step3Education";
import Step4Skills from "./Step4Skills";
import Step5Review from "./Step5Review";
import CustomizePage from "./CustomizePage";
import { ResumeLanguageToggle } from "./ResumeLanguageToggle";
import logo from "../../assets/logo/logo.png";
import mascot from "../../assets/logo/tip_mascot.png";

const TOTAL_STEPS = 5;
const A4_WIDTH_PX = 210 * (96 / 25.4);
const AUTOSAVE_MS = 800;

function clampBuilderStep(n: unknown) {
  if (typeof n !== "number" || !Number.isFinite(n)) return 1;
  return Math.min(TOTAL_STEPS, Math.max(1, Math.round(n)));
}

type TipCard = { lead: string; points: string[] };

function normalizeTip(raw: unknown): TipCard {
  if (raw && typeof raw === "object" && !Array.isArray(raw) && "lead" in raw) {
    const tip = raw as { lead?: unknown; points?: unknown };
    return {
      lead: typeof tip.lead === "string" ? tip.lead : "",
      points: Array.isArray(tip.points)
        ? tip.points.filter((point): point is string => typeof point === "string")
        : [],
    };
  }
  if (typeof raw === "string") {
    return { lead: raw, points: [] };
  }
  return { lead: "", points: [] };
}

function experienceTipKey(hasJobs: boolean, hasOther: boolean) {
  if (hasJobs) return "builder.tipHasExperience";
  if (hasOther) return "builder.tipFreshExperience";
  return "builder.tipExperienceChoice";
}

function TipCardContent({
  title,
  heading,
  closeLabel,
  tip,
  onClose,
  bodyClassName,
  hideHeading,
}: {
  title: string;
  heading: string;
  closeLabel: string;
  tip: TipCard;
  onClose: () => void;
  bodyClassName?: string;
  hideHeading?: boolean;
}) {
  return (
    <>
      <div className="flex items-start gap-2.5 px-4 pt-3 pb-2">
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
          <Lightbulb size={16} strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold tracking-wider uppercase text-brand">
            {title}
          </p>
          {!hideHeading && (
            <p className="mt-0.5 text-sm font-semibold text-text">{heading}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={closeLabel}
          className="size-8 shrink-0 rounded-full text-text-secondary hover:bg-primary hover:text-primary-foreground inline-flex items-center justify-center transition-colors"
        >
          <X size={14} strokeWidth={2} />
        </button>
      </div>
      <div className={cn("px-4 pb-4 overflow-y-auto scrollbar-thin", bodyClassName)}>
        {tip.lead ? (
          <p className="text-sm text-text leading-relaxed">{tip.lead}</p>
        ) : null}
        {tip.points.length > 0 ? (
          <ul className="mt-2.5 space-y-2">
            {tip.points.map((point, i) => (
              <li
                key={point || `tip-${i}`}
                className="flex gap-2.5 text-sm text-text-secondary leading-relaxed"
              >
                <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-brand" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </>
  );
}

export default function BuilderLayout() {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const toggleLanguage = () =>
    i18n.changeLanguage(i18n.language === "en" ? "km" : "en");
  const resumeHydrated = useResumeStoreHydrated();
  const resumeId = useResumeStore((s) => s.resume.id);
  const resume = useResumeStore((s) => s.resume);
  const headingLanguage = useResumeStore(
    (s) => s.resume.customization.headingLanguage ?? "en",
  );
  const updateCustomization = useResumeStore((s) => s.updateCustomization);
  const hasJobs = useResumeStore((s) => s.resume.experience.length > 0);
  const hasOtherExperience = useResumeStore((s) => s.resume.noExperience.length > 0);
  const dirty = useResumeStore((s) => s.dirty);
  const setBuilderStep = useResumeStore((s) => s.setBuilderStep);
  const markSaved = useResumeStore((s) => s.markSaved);
  const [step, setStep] = useState(() =>
    clampBuilderStep(useResumeStore.getState().resume.builderStep),
  );
  const persistTimerRef = useRef<number | null>(null);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [tipOpen, setTipOpen] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const tipRef = useRef<HTMLDivElement>(null);

  const stepLabels = t("builder.steps", { returnObjects: true }) as string[];
  const tips = t("builder.tips", { returnObjects: true }) as unknown[];
  const stepTip = normalizeTip(
    step === 2
      ? t(experienceTipKey(hasJobs, hasOtherExperience), { returnObjects: true })
      : tips[step - 1],
  );
  const tipHeading =
    step === 2
      ? t("builder.experience.title")
      : stepLabels[step - 1];

  useEffect(() => {
    if (!resumeHydrated) return;
    setStep(clampBuilderStep(useResumeStore.getState().resume.builderStep));
  }, [resumeHydrated, resumeId]);

  useEffect(() => {
    if (!resumeHydrated) return;
    setBuilderStep(step);
  }, [step, setBuilderStep, resumeHydrated]);

  useEffect(() => {
    if (!user || !dirty) return;

    if (persistTimerRef.current != null) {
      window.clearTimeout(persistTimerRef.current);
    }
    persistTimerRef.current = window.setTimeout(async () => {
      const resume = useResumeStore.getState().resume;
      try {
        const id = await saveResumeToDashboard(resume, user.id);
        markSaved(id);
      } catch {
        // Keep dirty so the next change or page hide can retry.
      }
    }, AUTOSAVE_MS);

    return () => {
      if (persistTimerRef.current != null) {
        window.clearTimeout(persistTimerRef.current);
      }
    };
  }, [user, dirty, resume, markSaved]);

  useEffect(() => {
    if (!user) return;

    const flush = () => {
      if (persistTimerRef.current != null) {
        window.clearTimeout(persistTimerRef.current);
        persistTimerRef.current = null;
      }
      const { resume, dirty: isDirty } = useResumeStore.getState();
      if (!isDirty) return;
      void saveResumeToDashboard(resume, user.id)
        .then((id) => markSaved(id))
        .catch(() => undefined);
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, [user, markSaved]);

  // close the mascot tip when clicking outside of it on desktop
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (window.matchMedia("(max-width: 1023px)").matches) return;
      if (tipRef.current && !tipRef.current.contains(e.target as Node)) {
        setTipOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    setTipOpen(false);
    setFabOpen(false);
  }, [step]);

  useEffect(() => {
    if (previewOpen || customizeOpen) {
      setTipOpen(false);
      setFabOpen(false);
    }
  }, [previewOpen, customizeOpen]);

  useEffect(() => {
    if (tipOpen) setFabOpen(false);
  }, [tipOpen]);

  useEffect(() => {
    if (!tipOpen && !fabOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (tipOpen) setTipOpen(false);
      else setFabOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [tipOpen, fabOpen]);

  const formPaneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.overflow;
    const prevBody = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    return () => {
      html.style.overflow = prevHtml;
      body.style.overflow = prevBody;
    };
  }, []);

  useEffect(() => {
    if (!previewOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPreviewOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [previewOpen]);

  const scrollFormToTop = () => {
    formPaneRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const next = () => {
    setStep((s) => Math.min(TOTAL_STEPS, s + 1));
    scrollFormToTop();
  };
  const back = () => {
    setStep((s) => Math.max(1, s - 1));
    scrollFormToTop();
  };
  const goToStep = (n: number) => {
    setStep(n);
    scrollFormToTop();
  };
  const openCustomize = (open: boolean) => {
    setCustomizeOpen(open);
    scrollFormToTop();
  };

  const resumeLang = headingLanguage === "km" ? "km" : "en";
  const renderResumeLangToggle = () => (
    <ResumeLanguageToggle
      value={resumeLang}
      onChange={(lang) => updateCustomization({ headingLanguage: lang })}
    />
  );

  if (!resumeHydrated) {
    return <div className="h-dvh bg-bg" />;
  }

  return (
    <div className="h-dvh overflow-hidden bg-bg text-text flex flex-col">
      {/* ================= header ================= */}
      <header className="shrink-0 max-w-7xl w-full mx-auto flex items-center justify-between px-4 h-16">
        <Link to="/my-resumes">
          <img src={logo} alt="ResuMate" className="h-9 w-auto" />
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleLanguage}
            className="size-9 rounded-lg text-text-secondary hover:bg-primary hover:text-primary-foreground transition-colors text-sm font-medium"
            aria-label={t("builder.siteLanguage")}
          >
            {i18n.language === "en" ? "ខ្មែរ" : "EN"}
          </button>

          <button
            onClick={toggleTheme}
            className="size-9 rounded-lg text-text-secondary hover:bg-primary hover:text-primary-foreground transition-colors inline-flex items-center justify-center"
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
      <div className="shrink-0 z-30 bg-bg">
        {customizeOpen ? (
          <div className="max-w-7xl w-full mx-auto px-4 lg:px-1.5 py-3">
            <Button size="sm" onClick={() => openCustomize(false)}>
              <ArrowLeft size={15} strokeWidth={2} />
              {t("builder.back")}
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-5 max-w-7xl w-full mx-auto px-4 lg:px-1.5 pt-2">
              {stepLabels.map((label, i) => {
                const n = i + 1;
                const active = n === step;
                const done = n < step;
                return (
                  <button
                    key={i}
                    onClick={() => goToStep(n)}
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
            <div className="lg:hidden flex justify-end max-w-7xl mx-auto px-4 pb-2">
              {renderResumeLangToggle()}
            </div>
          </>
        )}
      </div>

      {/* ================= form + preview ================= */}
      <div className="flex-1 min-h-0 min-w-0 max-w-7xl mx-auto w-full px-4 lg:px-0 grid lg:grid-cols-[minmax(0,45fr)_auto_minmax(0,55fr)]">
        {/* ---------- left: current step / customize ---------- */}
        <div
          ref={formPaneRef}
          data-builder-form-pane
          lang={headingLanguage === "km" ? "km" : "en"}
          className="min-h-0 min-w-0 overflow-y-auto overflow-x-hidden overscroll-contain scrollbar-thin pt-8 lg:pt-10 pb-44 lg:pb-28 pr-1"
        >
          <AnimatePresence mode="popLayout">
            {customizeOpen ? (
              <motion.div
                key="customize"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                <CustomizePage />
              </motion.div>
            ) : (
              <motion.div
                key={step}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                {step === 1 && <Step1Personal />}
                {step === 2 && <Step2Experience />}
                {step === 3 && <Step3Education />}
                {step === 4 && <Step4Skills />}
                {step === 5 && <Step5Review onGoToStep={goToStep} />}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="hidden lg:flex min-h-0 justify-center self-stretch px-8">
          <div className="w-px h-full bg-line" />
        </div>

        {/* ---------- right: live preview ---------- */}
        <div className="hidden lg:flex min-h-0 min-w-0 flex-col overflow-hidden pt-8 lg:pt-10 pb-20">
          <div className="flex items-center justify-between gap-3 mb-5 shrink-0">
            <Button
              size="compact"
              onClick={() => openCustomize(!customizeOpen)}
            >
              {customizeOpen ? (
                <>
                  <FileText size={15} strokeWidth={2} />
                  {t("builder.customizePage.contentButton")}
                </>
              ) : (
                <>
                  <LayoutGrid size={15} strokeWidth={2} />
                  {t("builder.customize")}
                </>
              )}
            </Button>
            {!customizeOpen && renderResumeLangToggle()}
          </div>

          <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain scrollbar-thin">
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="block w-full min-w-0 text-left cursor-zoom-in"
            >
              <ResumePreview />
            </button>
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
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed top-4 left-4 right-4 z-[60] flex items-center justify-between gap-3 pointer-events-none"
            >
              <div className="pointer-events-auto rounded-lg bg-bg px-3 py-2 shadow-lg">
                {renderResumeLangToggle()}
              </div>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                aria-label={t("builder.closePreview")}
                className="size-9 rounded-full bg-white text-neutral-900 shadow-lg hover:bg-neutral-100 inline-flex items-center justify-center transition-colors pointer-events-auto"
              >
                <X size={18} strokeWidth={2} />
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ================= floating mascot tip ================= */}
      {!customizeOpen && (
        <>
          <AnimatePresence>
            {tipOpen && (
              <>
                <motion.div
                  className="lg:hidden fixed inset-0 z-50 bg-black/40"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setTipOpen(false)}
                />
                <motion.div
                  role="dialog"
                  aria-label={t("builder.tipsTitle")}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 24 }}
                  transition={{ duration: 0.2 }}
                  className="lg:hidden fixed inset-x-3 bottom-[4.75rem] z-[51] max-h-[min(42dvh,20rem)] overflow-hidden rounded-2xl border border-line bg-bg shadow-xl"
                >
                  <TipCardContent
                    title={t("builder.tipsTitle")}
                    heading={tipHeading}
                    closeLabel={t("builder.tipClose")}
                    tip={stepTip}
                    onClose={() => setTipOpen(false)}
                    hideHeading
                    bodyClassName="max-h-[min(32dvh,14.5rem)] pb-4"
                  />
                </motion.div>
              </>
            )}
          </AnimatePresence>

          <div
            ref={tipRef}
            className="fixed z-40 hidden lg:bottom-20 lg:right-6 lg:block"
          >
            <AnimatePresence>
              {tipOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.94, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.94, y: 12 }}
                  transition={{ duration: 0.2 }}
                  className="absolute bottom-full right-0 mb-3 hidden w-[26rem] rounded-2xl border border-line bg-bg shadow-xl lg:block"
                >
                  <TipCardContent
                    title={t("builder.tipsTitle")}
                    heading={tipHeading}
                    closeLabel={t("builder.tipClose")}
                    tip={stepTip}
                    onClose={() => setTipOpen(false)}
                    bodyClassName="max-h-[min(28rem,calc(100dvh-11rem))]"
                  />
                  <span className="absolute top-full right-7 -mt-px size-3 rotate-45 border-b border-r border-line bg-bg" />
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              type="button"
              onClick={() => setTipOpen((o) => !o)}
              aria-label={t("builder.tipsTitle")}
              aria-expanded={tipOpen}
              className="hidden lg:block text-center"
              animate={tipOpen ? { y: 0 } : { y: [0, -6, 0] }}
              transition={
                tipOpen
                  ? { duration: 0.2 }
                  : { duration: 2.4, repeat: Infinity, ease: "easeInOut" }
              }
            >
              <img
                src={mascot}
                alt=""
                className="mx-auto w-16 drop-shadow-lg"
              />
              {!tipOpen && (
                <span className="mt-0.5 block text-[11px] font-medium text-brand">
                  {t("builder.tipHint")}
                </span>
              )}
            </motion.button>
          </div>
        </>
      )}

      {/* ================= floating tools (mobile speed dial) =================*/}
      {customizeOpen ? (
        <div className="lg:hidden fixed bottom-20 right-4 z-40">
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            aria-label={t("builder.previewButton")}
            className="size-12 rounded-full bg-brand text-white shadow-lg inline-flex items-center justify-center"
          >
            <Eye size={20} strokeWidth={2} />
          </button>
        </div>
      ) : (
        <>
          <AnimatePresence>
            {fabOpen && (
              <motion.button
                key="fab-backdrop"
                type="button"
                aria-label={t("builder.closeTools")}
                className="lg:hidden fixed inset-0 z-[39] bg-black/20"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setFabOpen(false)}
              />
            )}
          </AnimatePresence>
          <div className="lg:hidden fixed bottom-20 right-4 z-40 flex flex-col items-end gap-3">
            <AnimatePresence>
              {fabOpen && (
                <motion.div
                  key="fab-actions"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 12 }}
                  transition={{ duration: 0.18 }}
                  className="flex flex-col items-end gap-3"
                >
                  <button
                    type="button"
                    onClick={() => setTipOpen(true)}
                    aria-label={t("builder.tipsTitle")}
                    className="size-12 rounded-full bg-bg border border-line text-brand shadow-lg inline-flex items-center justify-center"
                  >
                    <Lightbulb size={20} strokeWidth={2} />
                  </button>
                  <button
                    type="button"
                    onClick={() => openCustomize(true)}
                    aria-label={t("builder.customize")}
                    className="size-12 rounded-full bg-bg border border-line text-brand shadow-lg inline-flex items-center justify-center"
                  >
                    <LayoutGrid size={20} strokeWidth={2} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewOpen(true)}
                    aria-label={t("builder.previewButton")}
                    className="size-12 rounded-full bg-brand text-white shadow-lg inline-flex items-center justify-center"
                  >
                    <Eye size={20} strokeWidth={2} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
            <button
              type="button"
              onClick={() => setFabOpen((o) => !o)}
              aria-label={fabOpen ? t("builder.closeTools") : t("builder.openTools")}
              aria-expanded={fabOpen}
              className="size-12 rounded-full bg-brand text-white shadow-lg inline-flex items-center justify-center"
            >
              <Plus
                size={22}
                strokeWidth={2}
                className={cn("transition-transform duration-200", fabOpen && "rotate-45")}
              />
            </button>
          </div>
        </>
      )}

      {/* ================= floating bottom bar ================= */}
      {!customizeOpen && (
        <div className="fixed bottom-0 inset-x-0 bg-bg/90 backdrop-blur border-t border-line">
          <div className="max-w-7xl mx-auto px-4 lg:px-1.5 h-14 flex items-center justify-between">
            {step > 1 ? (
              <Button
                size="sm"
                variant="outline"
                className="hover:bg-primary hover:text-primary-foreground"
                onClick={back}
              >
                ← {t("builder.back")}
              </Button>
            ) : (
              <Link to="/my-resumes">
                <Button
                  size="sm"
                  variant="outline"
                  className="hover:bg-primary hover:text-primary-foreground"
                >
                  ← {t("builder.back")}
                </Button>
              </Link>
            )}

            <p className="text-sm text-text-secondary truncate min-w-0 flex-1 text-center px-3">
              {t("builder.stepOf", { current: step, total: TOTAL_STEPS })}
              <span className="hidden sm:inline">
                {" "}
                – {stepLabels[step - 1]}
              </span>
            </p>

            {step < TOTAL_STEPS ? (
              <Button size="sm" onClick={next}>
                {t("builder.next")} →
              </Button>
            ) : (
              <Button
                size="sm"
                className="invisible pointer-events-none"
                tabIndex={-1}
                aria-hidden="true"
              >
                {t("builder.next")} →
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
