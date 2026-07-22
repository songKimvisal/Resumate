import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { Button } from "../../components/ui/button";
import { cn } from "../../lib/utils";
import type {
  AiAnswers,
  AiExperienceAnswer,
  AiIndustryAnswer,
  AiVibeAnswer,
} from "../../data/templates";

const INDUSTRY_OPTIONS: AiIndustryAnswer[] = [
  "banking",
  "ngo",
  "tech",
  "hospitality",
  "freshgrad",
  "designer",
  "government",
];
const EXPERIENCE_OPTIONS: AiExperienceAnswer[] = [
  "fresh",
  "junior",
  "mid",
  "senior",
];
const VIBE_OPTIONS: AiVibeAnswer[] = [
  "professional",
  "modernCreative",
  "cleanMinimal",
  "boldConfident",
  "friendly",
  "elegantRefined",
];

export default function AiDesignModal({
  open,
  initialAnswers,
  onCancel,
  onGenerate,
}: {
  open: boolean;
  initialAnswers: AiAnswers | null;
  onCancel: () => void;
  onGenerate: (answers: AiAnswers) => void;
}) {
  const { t } = useTranslation();
  // the parent remounts this component (via a changing `key`) each time it
  // opens, so seeding state from `initialAnswers` here is enough — no
  // effect/ref needed to "reset on reopen"
  const [industry, setIndustry] = useState<AiIndustryAnswer | null>(
    initialAnswers?.industry ?? null,
  );
  const [experience, setExperience] = useState<AiExperienceAnswer | null>(
    initialAnswers?.experience ?? null,
  );
  const [vibe, setVibe] = useState<AiVibeAnswer | null>(
    initialAnswers?.vibe ?? null,
  );

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onCancel]);

  const canGenerate = !!industry && !!experience && !!vibe;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 backdrop-blur-sm p-4 py-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
        >
          <motion.div
            className="relative w-full max-w-lg rounded-2xl bg-bg p-6 sm:p-8 shadow-xl"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={onCancel}
              aria-label={t("marketplace.aiPicker.cancel")}
              className="absolute right-4 top-4 size-8 rounded-full text-text-secondary hover:bg-surface-2 hover:text-text transition-colors inline-flex items-center justify-center"
            >
              <X size={16} strokeWidth={2} />
            </button>

            <h2 className="text-xl font-bold text-text pr-8">
              {t("marketplace.aiPicker.title")}
            </h2>
            <p className="text-sm text-text-secondary mt-1">
              {t("marketplace.aiPicker.subtitle")}
            </p>

            <div className="mt-6 space-y-6">
              <Question
                index={1}
                label={t("marketplace.aiPicker.q1")}
                options={INDUSTRY_OPTIONS}
                value={industry}
                onChange={setIndustry}
                labelFor={(o) => t(`marketplace.aiPicker.industryOptions.${o}`)}
              />
              <Question
                index={2}
                label={t("marketplace.aiPicker.q2")}
                options={EXPERIENCE_OPTIONS}
                value={experience}
                onChange={setExperience}
                labelFor={(o) =>
                  t(`marketplace.aiPicker.experienceOptions.${o}`)
                }
              />
              <Question
                index={3}
                label={t("marketplace.aiPicker.q3")}
                options={VIBE_OPTIONS}
                value={vibe}
                onChange={setVibe}
                labelFor={(o) => t(`marketplace.aiPicker.vibeOptions.${o}`)}
              />
            </div>

            <div className="mt-8 flex items-center justify-between gap-3">
              <Button size="compact" variant="outline" onClick={onCancel}>
                {t("marketplace.aiPicker.cancel")}
              </Button>
              <Button
                size="compact"
                disabled={!canGenerate}
                onClick={() =>
                  canGenerate &&
                  onGenerate({
                    industry: industry!,
                    experience: experience!,
                    vibe: vibe!,
                  })
                }
              >
                {t("marketplace.aiPicker.generate")} →
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Question<T extends string>({
  index,
  label,
  options,
  value,
  onChange,
  labelFor,
}: {
  index: number;
  label: string;
  options: T[];
  value: T | null;
  onChange: (value: T) => void;
  labelFor: (option: T) => string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2.5">
        <span className="size-6 shrink-0 rounded-full bg-brand text-white text-xs font-semibold inline-flex items-center justify-center">
          {index}
        </span>
        <p className="text-sm font-medium text-text">{label}</p>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {options.map((option) => {
          const selected = value === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              className={cn(
                "rounded-full border-2 px-4 py-2.5 text-sm font-medium text-left transition-colors",
                selected
                  ? "border-brand bg-brand/5 text-brand"
                  : "border-line text-text hover:bg-surface-2",
              )}
            >
              {labelFor(option)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
