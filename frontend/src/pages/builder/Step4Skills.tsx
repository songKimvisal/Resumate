import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "motion/react";
import { Eye, EyeOff, Trash2 } from "lucide-react";
import { useResumeStore } from "../../store/resumeStore";
import type {
  SkillItem,
  LanguageItem,
  ReferenceItem,
} from "../../types/resume";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/Input";
import { DotRating } from "../../components/ui/DotRating";
import { Switch } from "../../components/ui/Switch";
import { cn } from "../../lib/utils";

type Tab = "skills" | "languages" | "references";

const isValidEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

export default function Step4Skills() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>("skills");

  const tabs: { key: Tab; label: string }[] = [
    { key: "skills", label: t("builder.skillsMore.tabs.skills") },
    { key: "languages", label: t("builder.skillsMore.tabs.languages") },
    { key: "references", label: t("builder.skillsMore.tabs.references") },
  ];

  return (
    <div className="space-y-6 lg:px-6 lg:pr-10">
      <div>
        <h2 className="text-2xl font-bold">{t("builder.skillsMore.title")}</h2>
        <p className="text-sm text-text-secondary mt-1">
          {t("builder.skillsMore.subtitle")}
        </p>
      </div>

      <div className="inline-flex w-full items-center rounded-full border border-line p-1">
        {tabs.map((tb) => (
          <Button
            key={tb.key}
            type="button"
            size="compact"
            variant={tab === tb.key ? "default" : "ghost"}
            onClick={() => setTab(tb.key)}
            className={cn(
              "flex-1",
              tab !== tb.key &&
                "text-text-secondary hover:bg-transparent hover:text-text-secondary",
            )}
          >
            {tb.label}
          </Button>
        ))}
      </div>

      {tab === "skills" && <SkillsPanel t={t} />}
      {tab === "languages" && <LanguagesPanel t={t} />}
      {tab === "references" && <ReferencesPanel t={t} />}
    </div>
  );
}

/* =========================================================== skills === */

function SkillsPanel({ t }: { t: (key: string) => string }) {
  const skills = useResumeStore((s) => s.resume.skills);
  const addSkill = useResumeStore((s) => s.addSkill);
  const updateSkill = useResumeStore((s) => s.updateSkill);
  const removeSkill = useResumeStore((s) => s.removeSkill);

  const [expandedId, setExpandedId] = useState<string | null>(
    skills.length > 0 ? skills[skills.length - 1].id : null,
  );

  const autoAddedRef = useRef(false);
  useEffect(() => {
    if (autoAddedRef.current) return;
    if (useResumeStore.getState().resume.skills.length > 0) return;
    autoAddedRef.current = true;
    addSkill();
    const list = useResumeStore.getState().resume.skills;
    setExpandedId(list[list.length - 1].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addSkillExpanded = () => {
    addSkill();
    const list = useResumeStore.getState().resume.skills;
    setExpandedId(list[list.length - 1].id);
  };

  return (
    <div className="space-y-3">
      <AnimatePresence initial={false}>
        {skills.map((skill, i) => (
          <SkillCard
            key={skill.id || `skill-${i}`}
            index={i}
            skill={skill}
            expanded={expandedId === skill.id}
            onToggle={() =>
              setExpandedId((cur) => (cur === skill.id ? null : skill.id))
            }
            onRemove={() => {
              removeSkill(skill.id);
              if (expandedId === skill.id) setExpandedId(null);
            }}
            onChange={(patch) => updateSkill(skill.id, patch)}
            t={t}
          />
        ))}
      </AnimatePresence>

      <Button className="w-full" size="compact" onClick={addSkillExpanded}>
        {t("builder.skillsMore.skills.addNewSkill")}
      </Button>
    </div>
  );
}

function SkillCard({
  index,
  skill,
  expanded,
  onToggle,
  onRemove,
  onChange,
  t,
}: {
  index: number;
  skill: SkillItem;
  expanded: boolean;
  onToggle: () => void;
  onRemove: () => void;
  onChange: (patch: Partial<SkillItem>) => void;
  t: (key: string) => string;
}) {
  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
      transition={{ type: "tween", duration: 0.28, ease: "easeOut" }}
      className="rounded-xl border border-line"
    >
      <div
        className={cn(
          "flex items-center gap-1 px-2 sm:px-3 py-2 bg-surface-2 rounded-t-xl",
          !expanded && "rounded-b-xl",
        )}
      >
        <span className="size-7 shrink-0 rounded-full bg-brand text-white inline-flex items-center justify-center text-sm font-semibold">
          {index + 1}
        </span>
        <button onClick={onToggle} className="flex-1 min-w-0 text-left px-2">
          <p className="font-medium truncate">
            {skill.name || t("builder.skillsMore.skills.untitled")}
          </p>
        </button>

        <button
          onClick={onRemove}
          className="size-9 shrink-0 rounded-md text-destructive inline-flex items-center justify-center"
          aria-label={t("builder.skillsMore.skills.deleteEntry")}
        >
          <Trash2 size={16} />
        </button>
        <button
          onClick={onToggle}
          className="size-9 shrink-0 rounded-md text-brand inline-flex items-center justify-center"
          aria-label={
            expanded
              ? t("builder.skillsMore.skills.collapse")
              : t("builder.skillsMore.skills.expand")
          }
        >
          {expanded ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>

      <motion.div
        initial={false}
        animate={{ height: expanded ? "auto" : 0, opacity: expanded ? 1 : 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="overflow-hidden rounded-b-xl"
      >
        <div
          className="p-4 md:p-5 grid sm:grid-cols-[1fr_auto] gap-4 items-end bg-bg"
          inert={!expanded}
        >
          <Input
            label={t("builder.skillsMore.skills.technicalSkills")}
            placeholder={t(
              "builder.skillsMore.skills.technicalSkillsPlaceholder",
            )}
            value={skill.name}
            onChange={(e) => onChange({ name: e.target.value })}
          />
          <div className="space-y-1.5">
            <p className="text-sm font-medium text-text">
              {t("builder.skillsMore.skills.skillLevel")}
            </p>
            <DotRating
              value={skill.level}
              onChange={(level) => onChange({ level })}
              label={t("builder.skillsMore.skills.skillLevel")}
            />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ======================================================== languages === */

function LanguagesPanel({ t }: { t: (key: string) => string }) {
  const languages = useResumeStore((s) => s.resume.languages);
  const addLanguage = useResumeStore((s) => s.addLanguage);
  const updateLanguage = useResumeStore((s) => s.updateLanguage);
  const removeLanguage = useResumeStore((s) => s.removeLanguage);

  const autoAddedRef = useRef(false);
  useEffect(() => {
    if (autoAddedRef.current) return;
    if (useResumeStore.getState().resume.languages.length > 0) return;
    autoAddedRef.current = true;
    addLanguage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-3">
      <AnimatePresence initial={false}>
        {languages.map((lang, i) => (
          <LanguageRow
            key={lang.id || `lang-${i}`}
            lang={lang}
            onChange={(patch) => updateLanguage(lang.id, patch)}
            onRemove={() => removeLanguage(lang.id)}
            t={t}
          />
        ))}
      </AnimatePresence>

      <Button className="w-full" size="compact" onClick={() => addLanguage()}>
        {t("builder.skillsMore.languages.addLanguage")}
      </Button>
    </div>
  );
}

function LanguageRow({
  lang,
  onChange,
  onRemove,
  t,
}: {
  lang: LanguageItem;
  onChange: (patch: Partial<LanguageItem>) => void;
  onRemove: () => void;
  t: (key: string) => string;
}) {
  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
      transition={{ type: "tween", duration: 0.28, ease: "easeOut" }}
      className="rounded-xl border border-line p-4 flex flex-wrap items-end gap-4"
    >
      <div className="flex-1 min-w-40">
        <Input
          label={t("builder.skillsMore.languages.language")}
          placeholder={t("builder.skillsMore.languages.languagePlaceholder")}
          value={lang.name}
          onChange={(e) => onChange({ name: e.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <p className="text-sm font-medium text-text">
          {t("builder.skillsMore.languages.languageLevel")}
        </p>
        <DotRating
          value={lang.level}
          onChange={(level) => onChange({ level })}
          label={t("builder.skillsMore.languages.languageLevel")}
        />
      </div>
      <button
        onClick={onRemove}
        className="size-9 shrink-0 rounded-md text-destructive inline-flex items-center justify-center"
        aria-label={t("builder.skillsMore.languages.deleteEntry")}
      >
        <Trash2 size={16} />
      </button>
    </motion.div>
  );
}

/* === references === */

function ReferencesPanel({ t }: { t: (key: string) => string }) {
  const references = useResumeStore((s) => s.resume.references);
  const includeReferences = useResumeStore((s) => s.resume.includeReferences);
  const addReference = useResumeStore((s) => s.addReference);
  const updateReference = useResumeStore((s) => s.updateReference);
  const removeReference = useResumeStore((s) => s.removeReference);
  const setIncludeReferences = useResumeStore((s) => s.setIncludeReferences);

  const [expandedId, setExpandedId] = useState<string | null>(
    references.length > 0 ? references[references.length - 1].id : null,
  );

  const autoAddedRef = useRef(false);
  useEffect(() => {
    if (autoAddedRef.current) return;
    if (useResumeStore.getState().resume.references.length > 0) return;
    autoAddedRef.current = true;
    addReference();
    const list = useResumeStore.getState().resume.references;
    setExpandedId(list[list.length - 1].id);
  }, []);

  const addReferenceExpanded = () => {
    addReference();
    const list = useResumeStore.getState().resume.references;
    setExpandedId(list[list.length - 1].id);
  };

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-line bg-surface-2 p-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-text">
            {t("builder.skillsMore.references.includeToggle")}
          </p>
          <p className="text-xs text-text-secondary mt-0.5">
            {t("builder.skillsMore.references.includeHint")}
          </p>
        </div>
        <Switch
          checked={includeReferences}
          onCheckedChange={setIncludeReferences}
          ariaLabel={t("builder.skillsMore.references.includeToggle")}
        />
      </div>

      <AnimatePresence initial={false}>
        {references.map((ref, i) => (
          <ReferenceCard
            key={ref.id || `ref-${i}`}
            index={i}
            reference={ref}
            expanded={expandedId === ref.id}
            onToggle={() =>
              setExpandedId((cur) => (cur === ref.id ? null : ref.id))
            }
            onRemove={() => {
              removeReference(ref.id);
              if (expandedId === ref.id) setExpandedId(null);
            }}
            onChange={(patch) => updateReference(ref.id, patch)}
            t={t}
          />
        ))}
      </AnimatePresence>

      <Button className="w-full" size="compact" onClick={addReferenceExpanded}>
        {t("builder.skillsMore.references.addReference")}
      </Button>
    </div>
  );
}

function ReferenceCard({
  index,
  reference,
  expanded,
  onToggle,
  onRemove,
  onChange,
  t,
}: {
  index: number;
  reference: ReferenceItem;
  expanded: boolean;
  onToggle: () => void;
  onRemove: () => void;
  onChange: (patch: Partial<ReferenceItem>) => void;
  t: (key: string) => string;
}) {
  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
      transition={{ type: "tween", duration: 0.28, ease: "easeOut" }}
      className="rounded-xl border border-line"
    >
      <div
        className={cn(
          "flex items-center gap-1 px-2 sm:px-3 py-2 bg-surface-2 rounded-t-xl",
          !expanded && "rounded-b-xl",
        )}
      >
        <span className="size-7 shrink-0 rounded-full bg-brand text-white inline-flex items-center justify-center text-sm font-semibold">
          {index + 1}
        </span>
        <button onClick={onToggle} className="flex-1 min-w-0 text-left px-2">
          <p className="font-medium truncate">
            {reference.name || t("builder.skillsMore.references.untitled")}
          </p>
        </button>

        <button
          onClick={onRemove}
          className="size-9 shrink-0 rounded-md text-destructive inline-flex items-center justify-center"
          aria-label={t("builder.skillsMore.references.deleteEntry")}
        >
          <Trash2 size={16} />
        </button>
        <button
          onClick={onToggle}
          className="size-9 shrink-0 rounded-md text-brand inline-flex items-center justify-center"
          aria-label={
            expanded
              ? t("builder.skillsMore.references.collapse")
              : t("builder.skillsMore.references.expand")
          }
        >
          {expanded ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>

      <motion.div
        initial={false}
        animate={{ height: expanded ? "auto" : 0, opacity: expanded ? 1 : 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="overflow-hidden rounded-b-xl"
      >
        <div className="p-4 md:p-5 space-y-4 bg-bg" inert={!expanded}>
          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              label={t("builder.skillsMore.references.fullName")}
              placeholder={t(
                "builder.skillsMore.references.fullNamePlaceholder",
              )}
              value={reference.name}
              onChange={(e) => onChange({ name: e.target.value })}
            />
            <Input
              label={t("builder.skillsMore.references.position")}
              placeholder={t(
                "builder.skillsMore.references.positionPlaceholder",
              )}
              value={reference.jobTitle}
              onChange={(e) => onChange({ jobTitle: e.target.value })}
            />
          </div>

          <Input
            label={t("builder.skillsMore.references.company")}
            placeholder={t("builder.skillsMore.references.companyPlaceholder")}
            value={reference.company}
            onChange={(e) => onChange({ company: e.target.value })}
          />

          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              label={t("builder.skillsMore.references.email")}
              placeholder={t("builder.skillsMore.references.emailPlaceholder")}
              type="email"
              value={reference.email}
              onChange={(e) => onChange({ email: e.target.value })}
              error={
                reference.email.trim() !== "" && !isValidEmail(reference.email)
                  ? t("builder.personal.invalidEmail")
                  : undefined
              }
            />
            <Input
              label={t("builder.skillsMore.references.phone")}
              placeholder={t("builder.skillsMore.references.phonePlaceholder")}
              value={reference.phone}
              onChange={(e) => onChange({ phone: e.target.value })}
            />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
