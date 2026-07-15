import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "motion/react";
import {
  Briefcase,
  Eye,
  EyeOff,
  GraduationCap,
  ChevronRight,
  GripVertical,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { useResumeStore } from "../../store/resumeStore";
import type {
  ExperienceItem,
  NoExperienceItem,
  NoExperienceType,
} from "../../types/resume";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/Input";
import { MonthPicker } from "../../components/ui/MonthPicker";
import { RichTextEditor } from "../../components/ui/RichTextEditor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { cn } from "../../lib/utils";
import mascot from "../../assets/logo/tip_mascot.png";

function fmtDate(value: string) {
  if (!value) return "";
  const [y, m] = value.split("-").map(Number);
  if (!y || !m) return value;
  return new Date(y, m - 1).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

export default function Step2Experience() {
  const { t } = useTranslation();
  const experience = useResumeStore((s) => s.resume.experience);
  const noExperience = useResumeStore((s) => s.resume.noExperience);
  const choice = useResumeStore((s) => s.resume.experienceChoice);
  const setChoice = useResumeStore((s) => s.setExperienceChoice);
  const addExperience = useResumeStore((s) => s.addExperience);
  const updateExperience = useResumeStore((s) => s.updateExperience);
  const removeExperience = useResumeStore((s) => s.removeExperience);
  const reorderExperience = useResumeStore((s) => s.reorderExperience);
  const addNoExperience = useResumeStore((s) => s.addNoExperience);
  const updateNoExperience = useResumeStore((s) => s.updateNoExperience);
  const removeNoExperience = useResumeStore((s) => s.removeNoExperience);
  const reorderNoExperience = useResumeStore((s) => s.reorderNoExperience);

  const [expandedId, setExpandedId] = useState<string | null>(
    experience.length > 0
      ? experience[experience.length - 1].id
      : noExperience.length > 0
        ? noExperience[noExperience.length - 1].id
        : null,
  );
  const [justAddedId, setJustAddedId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [modalDismissed, setModalDismissed] = useState(false);
  const modalOpen =
    !modalDismissed &&
    choice === null &&
    experience.length === 0 &&
    noExperience.length === 0;

  const chooseHas = () => {
    setChoice("has");
    addExperienceExpanded();
  };
  const chooseNone = () => {
    setChoice("none");
    addNoExperienceExpanded();
  };

  const addExperienceExpanded = () => {
    addExperience();

    const list = useResumeStore.getState().resume.experience;
    const newId = list[list.length - 1].id;
    setExpandedId(newId);
    setJustAddedId(newId);
  };

  const addNoExperienceExpanded = () => {
    addNoExperience();
    const list = useResumeStore.getState().resume.noExperience;
    const newId = list[list.length - 1].id;
    setExpandedId(newId);
    setJustAddedId(newId);
  };

  return (
    <div className="space-y-6 lg:px-6 lg:pr-10">
      <div>
        <h2 className="text-2xl font-bold">
          {choice === "none"
            ? t("builder.experience.noExperienceTitle")
            : t("builder.experience.title")}
        </h2>
        <p className="text-sm text-text-secondary mt-1">
          {choice === "none"
            ? t("builder.experience.noExperienceSubtitle")
            : t("builder.experience.subtitle")}
        </p>
      </div>

      {/* ---------- has-experience entry cards ---------- */}
      {choice !== "none" && (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {experience.map((exp, i) => (
              <ExperienceCard
                key={exp.id}
                index={i}
                exp={exp}
                expanded={expandedId === exp.id}
                onToggle={() =>
                  setExpandedId((cur) => (cur === exp.id ? null : exp.id))
                }
                onRemove={() => {
                  removeExperience(exp.id);
                  if (expandedId === exp.id) setExpandedId(null);
                }}
                onChange={(patch) => updateExperience(exp.id, patch)}
                draggable={experience.length > 1}
                onDragStart={() => setDragId(exp.id)}
                onDropOn={() => {
                  if (dragId) reorderExperience(dragId, exp.id);
                  setDragId(null);
                }}
                isNew={justAddedId === exp.id}
                onEntranceComplete={() =>
                  setTimeout(
                    () =>
                      setJustAddedId((cur) => (cur === exp.id ? null : cur)),
                    900,
                  )
                }
                t={t}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* ---------- no-experience entry cards ---------- */}
      {choice === "none" && (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {noExperience.map((exp, i) => (
              <NoExperienceCard
                key={exp.id}
                index={i}
                exp={exp}
                expanded={expandedId === exp.id}
                onToggle={() =>
                  setExpandedId((cur) => (cur === exp.id ? null : exp.id))
                }
                onRemove={() => {
                  removeNoExperience(exp.id);
                  if (expandedId === exp.id) setExpandedId(null);
                }}
                onChange={(patch) => updateNoExperience(exp.id, patch)}
                draggable={noExperience.length > 1}
                onDragStart={() => setDragId(exp.id)}
                onDropOn={() => {
                  if (dragId) reorderNoExperience(dragId, exp.id);
                  setDragId(null);
                }}
                isNew={justAddedId === exp.id}
                onEntranceComplete={() =>
                  setTimeout(
                    () =>
                      setJustAddedId((cur) => (cur === exp.id ? null : cur)),
                    900,
                  )
                }
                t={t}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* ---------- add button ---------- */}
      {(choice === "has" || experience.length > 0) && (
        <Button
          className="w-full"
          size="compact"
          onClick={addExperienceExpanded}
        >
          {t("builder.experience.addAnother")}
        </Button>
      )}
      {choice === "none" && (
        <Button
          className="w-full"
          size="compact"
          onClick={addNoExperienceExpanded}
        >
          {t("builder.experience.addAnother")}
        </Button>
      )}
      {createPortal(
        <AnimatePresence>
          {modalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
              onClick={() => setModalDismissed(true)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 16 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-bg rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-12 shadow-2xl"
              >
                <button
                  onClick={() => setModalDismissed(true)}
                  className="absolute top-3 right-3 sm:top-6 sm:right-6 size-8 sm:size-9 rounded-lg text-text-secondary hover:bg-surface-2 hover:text-text inline-flex items-center justify-center"
                  aria-label={t("builder.close")}
                >
                  <X size={18} />
                </button>

                <div className="grid md:grid-cols-[1fr_auto] gap-4 sm:gap-8 items-center">
                  <div className="space-y-4 sm:space-y-6">
                    <div>
                      <h3 className="text-lg sm:text-2xl font-bold pr-8 sm:pr-0">
                        {t("builder.experience.modalTitle")}
                      </h3>
                      <p className="text-sm text-text-secondary mt-1 sm:mt-2">
                        {t("builder.experience.modalSubtitle")}
                      </p>
                    </div>

                    <div className="space-y-2 sm:space-y-3">
                      <ChoiceCard
                        icon={<Briefcase size={20} />}
                        title={t("builder.experience.hasTitle")}
                        desc={t("builder.experience.hasDesc")}
                        onClick={chooseHas}
                      />
                      <ChoiceCard
                        icon={<GraduationCap size={20} />}
                        title={t("builder.experience.noneTitle")}
                        desc={t("builder.experience.noneDesc")}
                        onClick={chooseNone}
                      />
                    </div>
                  </div>

                  <img
                    src={mascot}
                    alt=""
                    className="hidden md:block w-40 justify-self-center"
                  />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  );
}

function ChoiceCard({
  icon,
  title,
  desc,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 sm:gap-4 rounded-xl border border-line p-3 sm:p-4 text-left hover:border-brand hover:bg-surface transition-colors group"
    >
      <span className="text-text-secondary group-hover:text-brand transition-colors">
        {icon}
      </span>
      <span className="flex-1">
        <span className="block text-sm sm:text-base font-medium">{title}</span>
        <span className="block text-xs sm:text-sm text-text-secondary">
          {desc}
        </span>
      </span>
      <ChevronRight
        size={18}
        className="text-text-placeholder group-hover:text-brand transition-colors"
      />
    </button>
  );
}

function ExperienceCard({
  index,
  exp,
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
  exp: ExperienceItem;
  expanded: boolean;
  onToggle: () => void;
  onRemove: () => void;
  onChange: (patch: Partial<ExperienceItem>) => void;
  draggable: boolean;
  onDragStart: () => void;
  onDropOn: () => void;
  isNew?: boolean;
  onEntranceComplete?: () => void;
  t: (key: string) => string;
}) {
  const dates =
    exp.startDate || exp.endDate || exp.current
      ? `${fmtDate(exp.startDate)} - ${exp.current ? t("builder.experience.present") : fmtDate(exp.endDate)}`
      : "";

  const cardRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!isNew) return;
    const timeout = setTimeout(() => {
      cardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 300);
    return () => clearTimeout(timeout);
  }, []);

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
        "rounded-xl border overflow-hidden transition-colors duration-500",
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
          "flex items-center gap-1 px-2 sm:px-3 py-2 bg-surface-2",
          draggable && "cursor-grab active:cursor-grabbing",
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
            {exp.jobTitle || t("builder.experience.untitled")}
          </p>
          <p className="text-xs text-text-secondary truncate">
            {[exp.company, dates].filter(Boolean).join("  -  ")}
          </p>
        </button>

        <button
          onClick={onRemove}
          className="size-9 shrink-0 rounded-md text-destructive hover:bg-surface inline-flex items-center justify-center"
          aria-label={t("builder.experience.deleteEntry")}
        >
          <Trash2 size={16} />
        </button>
        <button
          onClick={onToggle}
          className="size-9 shrink-0 rounded-md text-brand hover:bg-surface inline-flex items-center justify-center"
          aria-label={
            expanded
              ? t("builder.experience.collapse")
              : t("builder.experience.expand")
          }
        >
          {expanded ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>

      {/* ---------- card body ----------*/}
      <motion.div
        initial={false}
        animate={{ height: expanded ? "auto" : 0, opacity: expanded ? 1 : 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="overflow-hidden"
      >
        <div className="p-4 md:p-5 space-y-4 bg-bg" inert={!expanded}>
          <Input
            label={t("builder.experience.jobTitle")}
            placeholder="Junior Accountant"
            value={exp.jobTitle}
            onChange={(e) => onChange({ jobTitle: e.target.value })}
          />

          <Input
            label={t("builder.experience.company")}
            placeholder="ABA Bank"
            value={exp.company}
            onChange={(e) => onChange({ company: e.target.value })}
          />

          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              label={t("builder.experience.location")}
              placeholder="Phnom Penh, Cambodia"
              value={exp.location}
              onChange={(e) => onChange({ location: e.target.value })}
            />
            <div className="min-w-0 space-y-1.5">
              <label className="text-sm font-medium text-text">
                {t("builder.experience.duration")}
              </label>

              <div className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <MonthPicker
                    value={exp.startDate}
                    max={exp.endDate || undefined}
                    onChange={(startDate) => onChange({ startDate })}
                    placeholder={t("builder.experience.startDate")}
                  />
                </div>
                <span className="text-text-placeholder shrink-0">–</span>
                <div className="flex-1 min-w-0">
                  <MonthPicker
                    value={exp.endDate}
                    min={exp.startDate || undefined}
                    disabled={exp.current}
                    onChange={(endDate) => onChange({ endDate })}
                    placeholder={t("builder.experience.endDate")}
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-text-secondary pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={exp.current}
                  onChange={(e) =>
                    onChange({ current: e.target.checked, endDate: "" })
                  }
                  className="accent-brand"
                />
                {t("builder.experience.current")}
              </label>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-text">
                {t("builder.experience.achievements")}
              </label>
              <Button size="sm" title={t("builder.comingSoon")}>
                <Sparkles size={14} />
                {t("builder.personal.aiRewrite")}
              </Button>
            </div>
            <RichTextEditor
              value={exp.description}
              onChange={(description) => onChange({ description })}
              placeholder={t("builder.experience.achievementsPlaceholder")}
            />
            <p className="text-xs text-text-placeholder">
              {t("builder.experience.achievementsHint")}
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

const NO_EXPERIENCE_TYPES: NoExperienceType[] = [
  "university",
  "volunteer",
  "competition",
  "internship",
  "partTime",
];
const NO_EXPERIENCE_HAS_URL: Record<NoExperienceType, boolean> = {
  university: true,
  volunteer: false,
  competition: false,
  internship: false,
  partTime: false,
};

function NoExperienceCard({
  index,
  exp,
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
  exp: NoExperienceItem;
  expanded: boolean;
  onToggle: () => void;
  onRemove: () => void;
  onChange: (patch: Partial<NoExperienceItem>) => void;
  draggable: boolean;
  onDragStart: () => void;
  onDropOn: () => void;
  isNew?: boolean;
  onEntranceComplete?: () => void;
  t: (key: string) => string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const hasUrl = NO_EXPERIENCE_HAS_URL[exp.type];
  const dates =
    exp.startDate || exp.endDate || exp.current
      ? `${fmtDate(exp.startDate)} – ${exp.current ? t("builder.experience.present") : fmtDate(exp.endDate)}`
      : "";

  useEffect(() => {
    if (!isNew) return;
    const timeout = setTimeout(() => {
      cardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 300);
    return () => clearTimeout(timeout);
  }, []);

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
        "rounded-xl border overflow-hidden transition-colors duration-500",
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
          "flex items-center gap-1 px-2 sm:px-3 py-2 bg-surface-2",
          draggable && "cursor-grab active:cursor-grabbing",
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
            {t(`builder.experience.noExperienceTypes.${exp.type}`)}
          </p>
          <p className="text-xs text-text-secondary truncate">
            {[exp.title, exp.subtitle, dates].filter(Boolean).join("  -  ")}
          </p>
        </button>

        <button
          onClick={onRemove}
          className="size-9 shrink-0 rounded-md text-destructive hover:bg-surface inline-flex items-center justify-center"
          aria-label={t("builder.experience.deleteEntry")}
        >
          <Trash2 size={16} />
        </button>
        <button
          onClick={onToggle}
          className="size-9 shrink-0 rounded-md text-brand hover:bg-surface inline-flex items-center justify-center"
          aria-label={
            expanded
              ? t("builder.experience.collapse")
              : t("builder.experience.expand")
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
        className="overflow-hidden"
      >
        <div className="p-4 md:p-5 space-y-4 bg-bg" inert={!expanded}>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text">
              {t("builder.experience.noExperienceTypeLabel")}
            </label>
            <Select
              value={exp.type}
              onValueChange={(value) =>
                onChange({ type: value as NoExperienceType })
              }
            >
              <SelectTrigger className="w-full h-10! rounded-lg border-line bg-bg text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NO_EXPERIENCE_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {t(`builder.experience.noExperienceTypes.${type}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Input
            label={t(`builder.experience.noExperienceFields.${exp.type}.title`)}
            placeholder={t(
              `builder.experience.noExperienceFields.${exp.type}.titlePlaceholder`,
            )}
            value={exp.title}
            onChange={(e) => onChange({ title: e.target.value })}
          />

          <Input
            label={t(
              `builder.experience.noExperienceFields.${exp.type}.subtitle`,
            )}
            placeholder={t(
              `builder.experience.noExperienceFields.${exp.type}.subtitlePlaceholder`,
            )}
            value={exp.subtitle}
            onChange={(e) => onChange({ subtitle: e.target.value })}
          />

          {hasUrl ? (
            <div className="grid sm:grid-cols-2 gap-4">
              <Input
                label={t(
                  "builder.experience.noExperienceFields.university.url",
                )}
                placeholder={t(
                  "builder.experience.noExperienceFields.university.urlPlaceholder",
                )}
                value={exp.url}
                onChange={(e) => onChange({ url: e.target.value })}
              />
              <NoExperienceDuration exp={exp} onChange={onChange} t={t} />
            </div>
          ) : (
            <NoExperienceDuration exp={exp} onChange={onChange} t={t} />
          )}

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-text">
                {t(
                  `builder.experience.noExperienceFields.${exp.type}.description`,
                )}
              </label>
              <Button size="sm" title={t("builder.comingSoon")}>
                <Sparkles size={14} />
                {t("builder.personal.aiRewrite")}
              </Button>
            </div>
            <RichTextEditor
              value={exp.description}
              onChange={(description) => onChange({ description })}
              placeholder={t(
                `builder.experience.noExperienceFields.${exp.type}.descriptionPlaceholder`,
              )}
            />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function NoExperienceDuration({
  exp,
  onChange,
  t,
}: {
  exp: NoExperienceItem;
  onChange: (patch: Partial<NoExperienceItem>) => void;
  t: (key: string) => string;
}) {
  return (
    <div className="min-w-0 space-y-1.5">
      <label className="text-sm font-medium text-text">
        {t("builder.experience.duration")}
      </label>
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <MonthPicker
            value={exp.startDate}
            max={exp.endDate || undefined}
            onChange={(startDate) => onChange({ startDate })}
            placeholder={t("builder.experience.startDate")}
          />
        </div>
        <span className="text-text-placeholder shrink-0">-</span>
        <div className="flex-1 min-w-0">
          <MonthPicker
            value={exp.endDate}
            min={exp.startDate || undefined}
            disabled={exp.current}
            onChange={(endDate) => onChange({ endDate })}
            placeholder={t("builder.experience.endDate")}
          />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-text-secondary pt-1 cursor-pointer">
        <input
          type="checkbox"
          checked={exp.current}
          onChange={(e) => onChange({ current: e.target.checked, endDate: "" })}
          className="accent-brand"
        />
        {t("builder.experience.current")}
      </label>
    </div>
  );
}
