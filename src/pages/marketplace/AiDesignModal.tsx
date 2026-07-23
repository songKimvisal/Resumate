import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "motion/react";
import { Check, X } from "lucide-react";
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
  const [vibe, setVibe] = useState<AiVibeAnswer[]>(initialAnswers?.vibe ?? []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onCancel]);

  const answeredCount = [!!industry, !!experience, vibe.length > 0].filter(
    Boolean,
  ).length;
  const canGenerate = !!industry && !!experience && vibe.length > 0;

  const toggleVibe = (option: AiVibeAnswer) =>
    setVibe((prev) =>
      prev.includes(option)
        ? prev.filter((v) => v !== option)
        : [...prev, option],
    );

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
            className="relative flex max-h-[calc(100vh-5rem)] w-full max-w-xl flex-col overflow-hidden rounded-3xl bg-bg shadow-2xl ring-1 ring-line/60"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="shrink-0 border-b border-line px-6 pb-5 pt-6 sm:px-8 sm:pt-8">
              <button
                type="button"
                onClick={onCancel}
                aria-label={t("marketplace.aiPicker.cancel")}
                className="absolute right-4 top-4 size-8 rounded-full text-text-secondary hover:bg-surface-2 hover:text-text transition-colors inline-flex items-center justify-center"
              >
                <X size={16} strokeWidth={2} />
              </button>

              <div className="flex items-center gap-3 pr-8">
                <div>
                  <h2 className="text-xl font-bold text-text">
                    {t("marketplace.aiPicker.title")}
                  </h2>
                  <p className="text-sm text-text-secondary">
                    {t("marketplace.aiPicker.subtitle")}
                  </p>
                </div>
              </div>

              <div className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                <motion.div
                  className="h-full rounded-full bg-brand"
                  initial={false}
                  animate={{ width: `${(answeredCount / 3) * 100}%` }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                />
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 sm:px-8">
              <div className="space-y-7">
                <Question
                  index={1}
                  label={t("marketplace.aiPicker.q1")}
                  options={INDUSTRY_OPTIONS}
                  value={industry}
                  onChange={setIndustry}
                  labelFor={(o) =>
                    t(`marketplace.aiPicker.industryOptions.${o}`)
                  }
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
                  onToggle={toggleVibe}
                  multiple
                  labelFor={(o) => t(`marketplace.aiPicker.vibeOptions.${o}`)}
                />
              </div>
            </div>

            <div className="flex shrink-0 items-center justify-between gap-3 border-t border-line bg-bg px-6 py-5 sm:px-8">
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
                    vibe,
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

type QuestionProps<T extends string> = {
  index: number;
  label: string;
  options: T[];
  labelFor: (option: T) => string;
} & (
  | { multiple?: false; value: T | null; onChange: (value: T) => void }
  | { multiple: true; value: T[]; onToggle: (value: T) => void }
);

function Question<T extends string>(props: QuestionProps<T>) {
  const { t } = useTranslation();
  const { index, label, options, labelFor } = props;
  const selectedCount = props.multiple
    ? props.value.length
    : props.value
      ? 1
      : 0;
  const hasValue = selectedCount > 0;
  const isSelected = (option: T) =>
    props.multiple ? props.value.includes(option) : props.value === option;
  const selectOption = (option: T) =>
    props.multiple ? props.onToggle(option) : props.onChange(option);

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2.5">
        <span
          className={cn(
            "size-6 shrink-0 rounded-full text-xs font-semibold inline-flex items-center justify-center transition-colors",
            hasValue
              ? "bg-brand text-white"
              : "bg-surface-2 text-text-secondary",
          )}
        >
          <AnimatePresence mode="wait" initial={false}>
            {hasValue ? (
              <motion.span
                key="check"
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.4, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="inline-flex"
              >
                <Check size={13} strokeWidth={2.5} />
              </motion.span>
            ) : (
              <span key="index">{index}</span>
            )}
          </AnimatePresence>
        </span>
        <p className="text-sm font-medium text-text">
          {label}
          {props.multiple && (
            <span className="ml-1.5 font-normal text-text-secondary">
              (
              {selectedCount > 0
                ? t("marketplace.aiPicker.multiSelectedCount", {
                    count: selectedCount,
                  })
                : t("marketplace.aiPicker.multiHint")}
              )
            </span>
          )}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {options.map((option) => {
          const selected = isSelected(option);
          return (
            <motion.button
              key={option}
              type="button"
              onClick={() => selectOption(option)}
              aria-pressed={selected}
              whileTap={{ scale: 0.96 }}
              className={cn(
                "flex items-center justify-between gap-1.5 rounded-xl border px-3.5 py-2 text-sm font-medium text-left transition-colors",
                selected
                  ? "border-brand bg-brand/5 text-brand"
                  : "border-line text-text hover:border-text-secondary/40 hover:bg-surface-2",
              )}
            >
              <span>{labelFor(option)}</span>
              <AnimatePresence initial={false}>
                {selected && (
                  <motion.span
                    initial={{ scale: 0.4, opacity: 0, width: 0 }}
                    animate={{ scale: 1, opacity: 1, width: "auto" }}
                    exit={{ scale: 0.4, opacity: 0, width: 0 }}
                    transition={{ duration: 0.15 }}
                    className="inline-flex shrink-0 overflow-hidden"
                  >
                    <Check size={15} strokeWidth={2.5} />
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
