import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "motion/react";
import {
  Briefcase,
  ChevronDown,
  ChevronUp,
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
import type { ExperienceItem } from "../../types/resume";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/Input";
import { RichTextEditor } from "../../components/ui/RichTextEditor";
import { cn } from "../../lib/utils";
import mascot from "../../assets/logo/tip_mascot.png";

/** Formats "2023-06" → "Jun 2023" (for the collapsed card subtitle) */
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
  const choice = useResumeStore((s) => s.resume.experienceChoice);
  const setChoice = useResumeStore((s) => s.setExperienceChoice);
  const addExperience = useResumeStore((s) => s.addExperience);
  const updateExperience = useResumeStore((s) => s.updateExperience);
  const removeExperience = useResumeStore((s) => s.removeExperience);
  const reorderExperience = useResumeStore((s) => s.reorderExperience);

  // which entry is expanded (only one at a time, like the design)
  const [expandedId, setExpandedId] = useState<string | null>(
    experience.length > 0 ? experience[experience.length - 1].id : null,
  );
  const [dragId, setDragId] = useState<string | null>(null);
  // modal shows until the user has made a choice (or already has entries)
  const [modalDismissed, setModalDismissed] = useState(false);
  const modalOpen =
    !modalDismissed && choice === null && experience.length === 0;

  const chooseHas = () => {
    setChoice("has");
    addExperienceExpanded();
  };
  const chooseNone = () => setChoice("none");

  const addExperienceExpanded = () => {
    addExperience();
    // the new entry is appended — expand it once state settles
    const list = useResumeStore.getState().resume.experience;
    setExpandedId(list[list.length - 1].id);
  };

  return (
    <div className="space-y-6 px-6 pr-10">
      <div>
        <h2 className="text-2xl font-bold">{t("builder.experience.title")}</h2>
        <p className="text-sm text-text-secondary mt-1">
          {t("builder.experience.subtitle")}
        </p>
      </div>

      {/* ---------- fresh graduate empty state ---------- */}
      {choice === "none" && experience.length === 0 && (
        <div className="rounded-xl border border-line bg-surface p-6 space-y-3">
          <p className="font-medium flex items-center gap-2">
            <GraduationCap size={18} className="text-brand" />
            {t("builder.experience.freshTitle")}
          </p>
          <p className="text-sm text-text-secondary">
            {t("builder.experience.freshBody")}
          </p>
          <Button size="sm" variant="outline" onClick={addExperienceExpanded}>
            {t("builder.experience.addAnyway")}
          </Button>
        </div>
      )}

      {/* ---------- entry cards ---------- */}
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
              onMoveUp={
                i > 0
                  ? () => reorderExperience(exp.id, experience[i - 1].id)
                  : undefined
              }
              onMoveDown={
                i < experience.length - 1
                  ? () => reorderExperience(exp.id, experience[i + 1].id)
                  : undefined
              }
              t={t}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* ---------- add button ---------- */}
      {(choice === "has" || experience.length > 0) && (
        <Button className="w-full" size="compact" onClick={addExperienceExpanded}>
          {t("builder.experience.addAnother")}
        </Button>
      )}

      {/* ---------- choice modal ---------- */}
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
              className="relative w-full max-w-2xl bg-bg rounded-3xl p-8 md:p-12 shadow-2xl"
            >
              <button
                onClick={() => setModalDismissed(true)}
                className="absolute top-6 right-6 size-9 rounded-lg text-text-secondary hover:bg-surface-2 hover:text-text inline-flex items-center justify-center"
                aria-label={t("builder.close")}
              >
                <X size={18} />
              </button>

              <div className="grid md:grid-cols-[1fr_auto] gap-8 items-center">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold">
                      {t("builder.experience.modalTitle")}
                    </h3>
                    <p className="text-sm text-text-secondary mt-2">
                      {t("builder.experience.modalSubtitle")}
                    </p>
                  </div>

                  <div className="space-y-3">
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
      </AnimatePresence>
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
      className="w-full flex items-center gap-4 rounded-xl border border-line p-4 text-left hover:border-brand hover:bg-surface transition-colors group"
    >
      <span className="text-text-secondary group-hover:text-brand transition-colors">
        {icon}
      </span>
      <span className="flex-1">
        <span className="block font-medium">{title}</span>
        <span className="block text-sm text-text-secondary">{desc}</span>
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
  onMoveUp,
  onMoveDown,
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
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  t: (key: string) => string;
}) {
  const dates =
    exp.startDate || exp.endDate || exp.current
      ? `${fmtDate(exp.startDate)} – ${exp.current ? t("builder.experience.present") : fmtDate(exp.endDate)}`
      : "";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.15 } }}
      transition={{ type: "spring", stiffness: 500, damping: 35 }}
      className="rounded-xl border border-line overflow-hidden"
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
            {[exp.company, dates].filter(Boolean).join("  ")}
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
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            <div className="p-4 md:p-5 space-y-4 bg-bg">
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
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-text">
                    {t("builder.experience.duration")}
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <Input
                        type="month"
                        value={exp.startDate}
                        max={exp.endDate || undefined}
                        onChange={(e) =>
                          onChange({ startDate: e.target.value })
                        }
                      />
                    </div>
                    <span className="text-text-placeholder shrink-0">–</span>
                    <div className="flex-1 min-w-0">
                      <Input
                        type="month"
                        className={exp.current ? "opacity-50" : undefined}
                        value={exp.endDate}
                        min={exp.startDate || undefined}
                        disabled={exp.current}
                        onChange={(e) => onChange({ endDate: e.target.value })}
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
        )}
      </AnimatePresence>
    </motion.div>
  );
}
