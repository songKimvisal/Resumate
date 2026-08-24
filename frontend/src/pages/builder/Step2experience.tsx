import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "motion/react";
import {
  Briefcase,
  Building2,
  Check,
  Clock,
  Eye,
  EyeOff,
  GraduationCap,
  GripVertical,
  Heart,
  Link as LinkIcon,
  Plus,
  Trash2,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { useResumeStore } from "../../store/resumeStore";
import type {
  ExperienceItem,
  NoExperienceItem,
  NoExperienceType,
} from "../../types/resume";
import { buttonVariants } from "../../components/ui/button";
import { Input } from "../../components/ui/Input";
import { MonthPicker } from "../../components/ui/MonthPicker";
import { RichTextEditor } from "../../components/ui/RichTextEditor";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../components/ui/popover";
import { cn } from "../../lib/utils";
import { resolveExperienceOrder } from "../../lib/experienceOrder";
import { AiRewriteButton } from "./AiRewriteButton";
import { SmartRewriteSuggestions } from "./SmartRewriteSuggestions";
import { useSmartRewrite } from "./useSmartRewrite";

const isValidLink = (value: string) =>
  /^(https?:\/\/)?([\w-]+\.)+[a-z]{2,}([/?#].*)?$/i.test(value.trim());

function fmtDate(value: string) {
  if (!value) return "";
  const [y, m] = value.split("-").map(Number);
  if (!y || !m) return value;
  return new Date(y, m - 1).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

const OTHER_TYPES: NoExperienceType[] = [
  "internship",
  "university",
  "volunteer",
  "competition",
  "partTime",
];

const TYPE_ICONS: Record<"job" | NoExperienceType, LucideIcon> = {
  job: Briefcase,
  internship: Building2,
  university: GraduationCap,
  volunteer: Heart,
  competition: Trophy,
  partTime: Clock,
};

const HAS_URL: Record<NoExperienceType, boolean> = {
  university: true,
  volunteer: false,
  competition: false,
  internship: false,
  partTime: false,
};

type TFn = (key: string) => string;

export default function Step2Experience() {
  const { t } = useTranslation();
  const experience = useResumeStore((s) => s.resume.experience);
  const noExperience = useResumeStore((s) => s.resume.noExperience);
  const experienceOrder = useResumeStore((s) => s.resume.experienceOrder);
  const choice = useResumeStore((s) => s.resume.experienceChoice);
  const setChoice = useResumeStore((s) => s.setExperienceChoice);
  const addExperience = useResumeStore((s) => s.addExperience);
  const updateExperience = useResumeStore((s) => s.updateExperience);
  const removeExperience = useResumeStore((s) => s.removeExperience);
  const reorderExperienceList = useResumeStore((s) => s.reorderExperienceList);
  const addNoExperience = useResumeStore((s) => s.addNoExperience);
  const updateNoExperience = useResumeStore((s) => s.updateNoExperience);
  const removeNoExperience = useResumeStore((s) => s.removeNoExperience);

  const [expandedId, setExpandedId] = useState<string | null>(
    experience.length > 0
      ? experience[experience.length - 1].id
      : noExperience.length > 0
        ? noExperience[noExperience.length - 1].id
        : null,
  );
  const [justAddedId, setJustAddedId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const addExperienceExpanded = () => {
    addExperience();
    const list = useResumeStore.getState().resume.experience;
    const newId = list[list.length - 1].id;
    setExpandedId(newId);
    setJustAddedId(newId);
  };

  const addNoExperienceExpanded = (type: NoExperienceType) => {
    addNoExperience(type);
    const list = useResumeStore.getState().resume.noExperience;
    const newId = list[list.length - 1].id;
    setExpandedId(newId);
    setJustAddedId(newId);
  };

  const addByKind = (kind: "job" | NoExperienceType) => {
    if (kind === "job") {
      setChoice("has");
      addExperienceExpanded();
    } else {
      if (choice !== "has") setChoice("none");
      addNoExperienceExpanded(kind);
    }
    setAddOpen(false);
  };

  const jobCount = experience.length;
  const isEmpty = jobCount === 0 && noExperience.length === 0;
  const orderedIds = resolveExperienceOrder(
    experience.map((item) => item.id),
    noExperience.map((item) => item.id),
    experienceOrder,
  );
  const canDrag = orderedIds.length > 1;
  const jobsById = new Map(experience.map((item) => [item.id, item]));
  const othersById = new Map(noExperience.map((item) => [item.id, item]));

  const addOptions: { kind: "job" | NoExperienceType; descKey: string }[] = [
    { kind: "job", descKey: "builder.experience.addTypes.jobDesc" },
    { kind: "internship", descKey: "builder.experience.addTypes.internshipDesc" },
    { kind: "university", descKey: "builder.experience.addTypes.universityDesc" },
    { kind: "volunteer", descKey: "builder.experience.addTypes.volunteerDesc" },
    { kind: "competition", descKey: "builder.experience.addTypes.competitionDesc" },
    { kind: "partTime", descKey: "builder.experience.addTypes.partTimeDesc" },
  ];

  return (
    <div className="space-y-6 lg:px-6 lg:pr-10">
      <div>
        <h2 className="text-2xl font-bold">{t("builder.experience.title")}</h2>
        <p className="text-sm text-text-secondary mt-1">
          {t("builder.experience.subtitle")}
        </p>
      </div>

      {isEmpty && (
        <div className="rounded-2xl border border-line bg-bg px-5 py-10 text-center">
          <span className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-brand/10 text-brand">
            <Briefcase size={20} strokeWidth={1.75} />
          </span>
          <p className="font-semibold text-text">
            {t("builder.experience.emptyTitle")}
          </p>
          <p className="mt-1.5 mx-auto max-w-sm text-sm text-text-secondary">
            {t("builder.experience.emptyHint")}
          </p>
        </div>
      )}

      {!isEmpty && (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {orderedIds.map((id, i) => {
              const job = jobsById.get(id);
              if (job) {
                return (
                  <ExperienceCard
                    key={job.id}
                    index={i}
                    exp={job}
                    expanded={expandedId === job.id}
                    onToggle={() =>
                      setExpandedId((cur) => (cur === job.id ? null : job.id))
                    }
                    onRemove={() => {
                      removeExperience(job.id);
                      if (expandedId === job.id) setExpandedId(null);
                    }}
                    onChange={(patch) => updateExperience(job.id, patch)}
                    draggable={canDrag}
                    onDragStart={() => setDragId(job.id)}
                    onDropOn={() => {
                      if (dragId) reorderExperienceList(dragId, job.id);
                      setDragId(null);
                    }}
                    isNew={justAddedId === job.id}
                    onEntranceComplete={() =>
                      setTimeout(
                        () =>
                          setJustAddedId((cur) =>
                            cur === job.id ? null : cur,
                          ),
                        900,
                      )
                    }
                    t={t}
                  />
                );
              }
              const other = othersById.get(id);
              if (!other) return null;
              return (
                <NoExperienceCard
                  key={other.id}
                  index={i}
                  exp={other}
                  expanded={expandedId === other.id}
                  onToggle={() =>
                    setExpandedId((cur) =>
                      cur === other.id ? null : other.id,
                    )
                  }
                  onRemove={() => {
                    removeNoExperience(other.id);
                    if (expandedId === other.id) setExpandedId(null);
                  }}
                  onChange={(patch) => updateNoExperience(other.id, patch)}
                  draggable={canDrag}
                  onDragStart={() => setDragId(other.id)}
                  onDropOn={() => {
                    if (dragId) reorderExperienceList(dragId, other.id);
                    setDragId(null);
                  }}
                  isNew={justAddedId === other.id}
                  onEntranceComplete={() =>
                    setTimeout(
                      () =>
                        setJustAddedId((cur) =>
                          cur === other.id ? null : cur,
                        ),
                      900,
                    )
                  }
                  t={t}
                />
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <Popover open={addOpen} onOpenChange={setAddOpen}>
        <PopoverTrigger
          type="button"
          className={cn(buttonVariants({ size: "compact" }), "w-full")}
        >
          <Plus size={16} />
          {t("builder.experience.addAnother")}
        </PopoverTrigger>
        <PopoverContent
          align="center"
          sideOffset={8}
          className="w-[min(22rem,calc(100vw-2rem))] gap-0 p-1.5"
        >
          <p className="px-3 pt-2 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand">
            {t("builder.experience.pickTypeTitle")}
          </p>
          {addOptions.map(({ kind, descKey }) => {
            const Icon = TYPE_ICONS[kind];
            const title =
              kind === "job"
                ? t("builder.experience.addTypes.job")
                : t(`builder.experience.noExperienceTypes.${kind}`);
            return (
              <button
                key={kind}
                type="button"
                onClick={() => addByKind(kind)}
                className="group flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center text-brand group-hover:text-primary-foreground">
                  <Icon size={18} strokeWidth={1.75} />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-text group-hover:text-primary-foreground">
                    {title}
                  </span>
                  <span className="mt-0.5 block text-xs text-text-secondary group-hover:text-primary-foreground/80">
                    {t(descKey)}
                  </span>
                </span>
              </button>
            );
          })}
        </PopoverContent>
      </Popover>
    </div>
  );
}

function dateRange(
  start: string,
  end: string,
  current: boolean,
  presentLabel: string,
) {
  const from = fmtDate(start);
  const to = current ? presentLabel : fmtDate(end);
  if (from && to) return `${from} – ${to}`;
  return from || to;
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
  t: TFn;
}) {
  const dates = dateRange(
    exp.startDate,
    exp.endDate,
    exp.current,
    t("builder.experience.present"),
  );
  const cardRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!isNew) return;
    const timeout = setTimeout(() => {
      cardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 300);
    return () => clearTimeout(timeout);
  }, []);
  const achievementsRewrite = useSmartRewrite("experience");

  return (
    <motion.div
      ref={cardRef}
      style={{ scrollMarginTop: "16px" }}
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
      <CardHeader
        index={index}
        draggable={draggable}
        onDragStart={onDragStart}
        onDropOn={onDropOn}
        title={exp.jobTitle || t("builder.experience.untitled")}
        meta={[
          t("builder.experience.addTypes.job"),
          exp.company,
          dates,
        ]}
        expanded={expanded}
        onToggle={onToggle}
        onRemove={onRemove}
        t={t}
      />

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
            <DurationFields
              startDate={exp.startDate}
              endDate={exp.endDate}
              current={exp.current}
              currentLabel={t("builder.experience.current")}
              onChange={onChange}
              t={t}
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-text">
                {t("builder.experience.achievements")}
              </label>
              <AiRewriteButton
                loading={achievementsRewrite.loading}
                disabled={!exp.description.replace(/<[^>]*>/g, "").trim()}
                onClick={() => achievementsRewrite.generate(exp.description)}
              />
            </div>
            <RichTextEditor
              value={exp.description}
              onChange={(description) => onChange({ description })}
              placeholder={t("builder.experience.achievementsPlaceholder")}
            />
            <p className="text-xs text-text-placeholder">
              {t("builder.experience.achievementsHint")}
            </p>
            {achievementsRewrite.variations && (
              <SmartRewriteSuggestions
                variations={achievementsRewrite.variations}
                onSelect={(chosen) => {
                  onChange({ description: chosen });
                  achievementsRewrite.dismiss();
                }}
                onDismiss={achievementsRewrite.dismiss}
              />
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

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
  t: TFn;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const hasUrl = HAS_URL[exp.type];
  const [urlOpen, setUrlOpen] = useState(false);
  const invalidUrl = exp.url.trim() !== "" && !isValidLink(exp.url);
  const descriptionRewrite = useSmartRewrite("experience");
  const dates = dateRange(
    exp.startDate,
    exp.endDate,
    exp.current,
    t("builder.experience.present"),
  );

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
      style={{ scrollMarginTop: "16px" }}
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
      <CardHeader
        index={index}
        draggable={draggable}
        onDragStart={onDragStart}
        onDropOn={onDropOn}
        title={exp.title || t("builder.experience.untitledNoExperience")}
        meta={[
          t(`builder.experience.noExperienceTypes.${exp.type}`),
          exp.subtitle,
          dates,
        ]}
        expanded={expanded}
        onToggle={onToggle}
        onRemove={onRemove}
        t={t}
      />

      <motion.div
        initial={false}
        animate={{ height: expanded ? "auto" : 0, opacity: expanded ? 1 : 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="overflow-hidden"
      >
        <div className="p-4 md:p-5 space-y-4 bg-bg" inert={!expanded}>
          <div className="space-y-2">
            <p className="text-sm font-medium text-text">
              {t("builder.experience.noExperienceTypeLabel")}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {OTHER_TYPES.map((type) => {
                const selected = exp.type === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => onChange({ type })}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                      selected
                        ? "border-brand bg-brand/10 text-brand"
                        : "border-line text-text-secondary hover:border-primary hover:bg-primary hover:text-primary-foreground",
                    )}
                  >
                    {t(`builder.experience.noExperienceTypes.${type}`)}
                  </button>
                );
              })}
            </div>
          </div>

          {hasUrl ? (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text">
                {t(`builder.experience.noExperienceFields.${exp.type}.title`)}
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder={t(
                    `builder.experience.noExperienceFields.${exp.type}.titlePlaceholder`,
                  )}
                  value={exp.title}
                  onChange={(e) => onChange({ title: e.target.value })}
                  className="w-full h-10 pl-3 pr-9 rounded-lg border border-line bg-bg text-sm text-text placeholder:text-text-placeholder focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setUrlOpen((v) => !v)}
                  className={cn(
                    "absolute right-2 top-1/2 -translate-y-1/2 size-6 rounded-md inline-flex items-center justify-center hover:bg-primary hover:text-primary-foreground",
                    exp.url ? "text-brand" : "text-text-placeholder",
                  )}
                  aria-label={t("builder.personal.linkUrl")}
                >
                  <LinkIcon size={15} />
                </button>
                {urlOpen && (
                  <div className="absolute z-10 left-0 top-[calc(100%+0.5rem)] w-full min-w-[16rem] bg-bg border border-line rounded-xl shadow-lg p-3 space-y-1.5">
                    <p className="text-xs font-medium text-text-secondary">
                      {t("builder.personal.linkUrl")}
                    </p>
                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        autoFocus
                        value={exp.url}
                        placeholder="https://..."
                        onChange={(e) => onChange({ url: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            setUrlOpen(false);
                          }
                        }}
                        className={cn(
                          "flex-1 h-9 px-3 rounded-lg border bg-bg text-sm text-text placeholder:text-text-placeholder focus:outline-none focus:ring-2 focus:ring-ring/50 transition-colors",
                          invalidUrl
                            ? "border-destructive"
                            : "border-line focus:border-ring",
                        )}
                      />
                      <button
                        type="button"
                        onClick={() => setUrlOpen(false)}
                        className="size-9 shrink-0 rounded-lg bg-emerald-600 text-white inline-flex items-center justify-center hover:bg-emerald-700 transition-colors"
                        aria-label={t("builder.confirm")}
                      >
                        <Check size={16} />
                      </button>
                    </div>
                    {invalidUrl && (
                      <p className="text-xs text-destructive">
                        {t("builder.personal.invalidLink")}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <Input
              label={t(
                `builder.experience.noExperienceFields.${exp.type}.title`,
              )}
              placeholder={t(
                `builder.experience.noExperienceFields.${exp.type}.titlePlaceholder`,
              )}
              value={exp.title}
              onChange={(e) => onChange({ title: e.target.value })}
            />
          )}

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

          <DurationFields
            startDate={exp.startDate}
            endDate={exp.endDate}
            current={exp.current}
            currentLabel={t("builder.experience.current")}
            onChange={onChange}
            t={t}
          />

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-text">
                {t(
                  `builder.experience.noExperienceFields.${exp.type}.description`,
                )}
              </label>
              <AiRewriteButton
                loading={descriptionRewrite.loading}
                disabled={!exp.description.replace(/<[^>]*>/g, "").trim()}
                onClick={() => descriptionRewrite.generate(exp.description)}
              />
            </div>
            <RichTextEditor
              value={exp.description}
              onChange={(description) => onChange({ description })}
              placeholder={t(
                `builder.experience.noExperienceFields.${exp.type}.descriptionPlaceholder`,
              )}
            />
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

function CardHeader({
  index,
  draggable,
  onDragStart,
  onDropOn,
  title,
  meta,
  expanded,
  onToggle,
  onRemove,
  t,
}: {
  index: number;
  draggable: boolean;
  onDragStart: () => void;
  onDropOn: () => void;
  title: string;
  meta: string[];
  expanded: boolean;
  onToggle: () => void;
  onRemove: () => void;
  t: TFn;
}) {
  const [typeLabel, ...rest] = meta.filter(Boolean);
  return (
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
        <p className="font-medium truncate">{title}</p>
        <p className="text-xs text-text-secondary truncate">
          {typeLabel && (
            <span className="font-medium text-brand">{typeLabel}</span>
          )}
          {typeLabel && rest.length > 0 && (
            <span className="mx-1.5 inline-block size-1 rounded-full bg-brand/50 align-middle" />
          )}
          {rest.join("  ·  ")}
        </p>
      </button>
      <button
        onClick={onRemove}
        className="size-9 shrink-0 rounded-md text-destructive hover:bg-primary hover:text-primary-foreground inline-flex items-center justify-center"
        aria-label={t("builder.experience.deleteEntry")}
      >
        <Trash2 size={16} />
      </button>
      <button
        onClick={onToggle}
        className="size-9 shrink-0 rounded-md text-brand hover:bg-primary hover:text-primary-foreground inline-flex items-center justify-center"
        aria-label={
          expanded
            ? t("builder.experience.collapse")
            : t("builder.experience.expand")
        }
      >
        {expanded ? <EyeOff size={17} /> : <Eye size={17} />}
      </button>
    </div>
  );
}

function DurationFields({
  startDate,
  endDate,
  current,
  currentLabel,
  onChange,
  t,
}: {
  startDate: string;
  endDate: string;
  current: boolean;
  currentLabel: string;
  onChange: (patch: { startDate?: string; endDate?: string; current?: boolean }) => void;
  t: TFn;
}) {
  return (
    <div className="min-w-0 space-y-1.5">
      <label className="text-sm font-medium text-text">
        {t("builder.experience.duration")}
      </label>
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <MonthPicker
            value={startDate}
            max={endDate || undefined}
            onChange={(next) => onChange({ startDate: next })}
            placeholder={t("builder.experience.startDate")}
          />
        </div>
        <span className="text-text-placeholder shrink-0">–</span>
        <div className="flex-1 min-w-0">
          <MonthPicker
            value={endDate}
            min={startDate || undefined}
            disabled={current}
            onChange={(next) => onChange({ endDate: next })}
            placeholder={t("builder.experience.endDate")}
          />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-text-secondary pt-1 cursor-pointer">
        <input
          type="checkbox"
          checked={current}
          onChange={(e) =>
            onChange({ current: e.target.checked, endDate: "" })
          }
          className="accent-brand"
        />
        {currentLabel}
      </label>
    </div>
  );
}
