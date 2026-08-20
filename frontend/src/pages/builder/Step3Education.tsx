import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "motion/react";
import { Eye, EyeOff, GripVertical, Trash2 } from "lucide-react";
import { useResumeStore } from "../../store/resumeStore";
import type { EducationItem } from "../../types/resume";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/Input";
import { MonthPicker } from "../../components/ui/MonthPicker";
import { RichTextEditor } from "../../components/ui/RichTextEditor";
import { cn } from "../../lib/utils";
import { AiRewriteButton } from "./AiRewriteButton";
import { SmartRewriteSuggestions } from "./SmartRewriteSuggestions";
import { useSmartRewrite } from "./useSmartRewrite";

function fmtDate(value: string) {
  if (!value) return "";
  const [y, m] = value.split("-").map(Number);
  if (!y || !m) return value;
  return new Date(y, m - 1).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

export default function Step3Education() {
  const { t } = useTranslation();
  const education = useResumeStore((s) => s.resume.education);
  const addEducation = useResumeStore((s) => s.addEducation);
  const updateEducation = useResumeStore((s) => s.updateEducation);
  const removeEducation = useResumeStore((s) => s.removeEducation);
  const reorderEducation = useResumeStore((s) => s.reorderEducation);

  const [expandedId, setExpandedId] = useState<string | null>(
    education.length > 0 ? education[education.length - 1].id : null,
  );
  // briefly highlights + scrolls to the entry that was just added
  const [justAddedId, setJustAddedId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);

  const addEducationExpanded = () => {
    addEducation();
    const list = useResumeStore.getState().resume.education;
    const newId = list[list.length - 1].id;
    setExpandedId(newId);
    setJustAddedId(newId);
  };
  const autoAddedRef = useRef(false);
  useEffect(() => {
    if (autoAddedRef.current) return;
    if (useResumeStore.getState().resume.education.length > 0) return;
    autoAddedRef.current = true;
    addEducationExpanded();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6 lg:px-6 lg:pr-10">
      <div>
        <h2 className="text-2xl font-bold">{t("builder.education.title")}</h2>
        <p className="text-sm text-text-secondary mt-1">
          {t("builder.education.subtitle")}
        </p>
      </div>

      <div className="space-y-3">
        <AnimatePresence initial={false}>
          {education.map((edu, i) => (
            <EducationCard
              key={edu.id}
              index={i}
              edu={edu}
              expanded={expandedId === edu.id}
              onToggle={() =>
                setExpandedId((cur) => (cur === edu.id ? null : edu.id))
              }
              onRemove={() => {
                removeEducation(edu.id);
                if (expandedId === edu.id) setExpandedId(null);
              }}
              onChange={(patch) => updateEducation(edu.id, patch)}
              draggable={education.length > 1}
              onDragStart={() => setDragId(edu.id)}
              onDropOn={() => {
                if (dragId) reorderEducation(dragId, edu.id);
                setDragId(null);
              }}
              isNew={justAddedId === edu.id}
              onEntranceComplete={() =>
                setTimeout(
                  () => setJustAddedId((cur) => (cur === edu.id ? null : cur)),
                  900,
                )
              }
              t={t}
            />
          ))}
        </AnimatePresence>
      </div>

      <Button
        className="w-full"
        size="compact"
        onClick={() => addEducationExpanded()}
      >
        {t("builder.education.addAnother")}
      </Button>
    </div>
  );
}

function EducationCard({
  index,
  edu,
  expanded,
  onToggle,
  onRemove,
  onChange,
  draggable,
  onDragStart,
  onDropOn,
  isNew,
  onEntranceComplete,
  t,
}: {
  index: number;
  edu: EducationItem;
  expanded: boolean;
  onToggle: () => void;
  onRemove: () => void;
  onChange: (patch: Partial<EducationItem>) => void;
  draggable: boolean;
  onDragStart: () => void;
  onDropOn: () => void;
  isNew?: boolean;
  onEntranceComplete?: () => void;
  t: (key: string) => string;
}) {
  const dates =
    edu.startDate || edu.endDate || edu.current
      ? `${fmtDate(edu.startDate)} - ${edu.current ? t("builder.education.present") : fmtDate(edu.endDate)}`
      : "";

  const cardRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!isNew) return;
    const timeout = setTimeout(() => {
      cardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 300);
    return () => clearTimeout(timeout);
  }, []);
  const descriptionRewrite = useSmartRewrite("education");

  return (
    <motion.div
      ref={cardRef}
      style={{ scrollMarginTop: "100px" }}
      layout="position"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
      transition={{ type: "tween", duration: 0.28, ease: "easeOut" }}
      onAnimationComplete={() => isNew && onEntranceComplete?.()}
      className={cn(
        "rounded-xl border transition-colors duration-500",
        isNew ? "border-brand ring-2 ring-brand/30" : "border-line",
      )}
    >
      {/* ---------- card header ---------- */}
      <div
        draggable={draggable}
        onDragStart={onDragStart}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDropOn}
        className={cn(
          "flex items-center gap-1 px-2 sm:px-3 py-2 bg-surface-2 rounded-t-xl",
          draggable && "cursor-grab active:cursor-grabbing",
          !expanded && "rounded-b-xl",
          expanded && "sticky top-(--step-bar-height) z-20 shadow-sm",
        )}
      >
        {draggable && (
          <span className="hidden sm:inline-flex shrink-0 items-center justify-center size-7 text-text-placeholder">
            <GripVertical size={16} />
          </span>
        )}
        <span className="size-7 shrink-0 rounded-full bg-brand text-white inline-flex items-center justify-center text-sm font-semibold">
          {index + 1}
        </span>
        <button onClick={onToggle} className="flex-1 min-w-0 text-left px-2">
          <p className="font-medium truncate">
            {edu.degree || t("builder.education.untitled")}
          </p>
          <p className="text-xs text-text-secondary truncate">
            {[edu.school, dates].filter(Boolean).join("  -  ")}
          </p>
        </button>

        <button
          onClick={onRemove}
          className="size-9 shrink-0 rounded-md text-destructive hover:bg-surface inline-flex items-center justify-center"
          aria-label={t("builder.education.deleteEntry")}
        >
          <Trash2 size={16} />
        </button>
        <button
          onClick={onToggle}
          className="size-9 shrink-0 rounded-md text-brand hover:bg-surface inline-flex items-center justify-center"
          aria-label={
            expanded
              ? t("builder.education.collapse")
              : t("builder.education.expand")
          }
        >
          {expanded ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>

      {/* ---------- card body ---------- */}
      <motion.div
        initial={false}
        animate={{ height: expanded ? "auto" : 0, opacity: expanded ? 1 : 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="overflow-hidden rounded-b-xl"
      >
        <div className="p-4 md:p-5 space-y-4 bg-bg" inert={!expanded}>
          <Input
            label={t("builder.education.degree")}
            placeholder={t("builder.education.degreePlaceholder")}
            value={edu.degree}
            onChange={(e) => onChange({ degree: e.target.value })}
          />

          <Input
            label={t("builder.education.school")}
            placeholder={t("builder.education.schoolPlaceholder")}
            value={edu.school}
            onChange={(e) => onChange({ school: e.target.value })}
          />

          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              label={t("builder.education.gpa")}
              placeholder={t("builder.education.gpaPlaceholder")}
              value={edu.gpa}
              onChange={(e) => onChange({ gpa: e.target.value })}
            />
            <div className="min-w-0 space-y-1.5">
              <label className="text-sm font-medium text-text">
                {t("builder.education.duration")}
              </label>

              <div className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <MonthPicker
                    value={edu.startDate}
                    max={edu.endDate || undefined}
                    onChange={(startDate) => onChange({ startDate })}
                    placeholder={t("builder.education.startDate")}
                  />
                </div>
                <span className="text-text-placeholder shrink-0">-</span>
                <div className="flex-1 min-w-0">
                  <MonthPicker
                    value={edu.endDate}
                    min={edu.startDate || undefined}
                    disabled={edu.current}
                    onChange={(endDate) => onChange({ endDate })}
                    placeholder={t("builder.education.endDate")}
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-text-secondary pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={edu.current}
                  onChange={(e) =>
                    onChange({ current: e.target.checked, endDate: "" })
                  }
                  className="accent-brand"
                />
                {t("builder.education.current")}
              </label>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-text">
                {t("builder.education.achievements")}
              </label>
              <AiRewriteButton
                loading={descriptionRewrite.loading}
                disabled={!edu.description.replace(/<[^>]*>/g, "").trim()}
                onClick={() => descriptionRewrite.generate(edu.description)}
              />
            </div>
            <RichTextEditor
              value={edu.description}
              onChange={(description) => onChange({ description })}
              placeholder={t("builder.education.achievementsPlaceholder")}
            />
            <p className="text-xs text-text-placeholder">
              {t("builder.education.achievementsHint")}
            </p>
            {descriptionRewrite.variations && (
              <SmartRewriteSuggestions
                variations={descriptionRewrite.variations}
                onSelect={(chosen) => {
                  onChange({ description: chosen });
                  descriptionRewrite.dismiss();
                }}
                onDismiss={descriptionRewrite.dismiss}
              />
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
