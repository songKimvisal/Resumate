import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "motion/react";
import {
  Briefcase,
  Check,
  Contact,
  Flag,
  GitBranch,
  Globe,
  GripVertical,
  IdCard,
  ImagePlus,
  Link as LinkIcon,
  MessageCircle,
  Send,
  SquareCode,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { useResumeStore, uid } from "../../store/resumeStore";
import type { LinkItem, PersonalInfo } from "../../types/resume";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/button";
import { RichTextEditor } from "../../components/ui/RichTextEditor";
import { cn } from "../../lib/utils";
import { photoImgStyle } from "../../lib/photoFit";
import { AiRewriteButton } from "./AiRewriteButton";
import { SmartRewriteSuggestions } from "./SmartRewriteSuggestions";
import { useSmartRewrite } from "./useSmartRewrite";

const PHOTO_FIT_MODES = ["fill", "fit", "crop"] as const;
const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

/** Fields that let a user list more than one entry (e.g. two portfolio links) */
const LINK_FIELD_KEYS = new Set<keyof PersonalInfo>([
  "portfolio",
  "website",
  "github",
  "stackoverflow",
  "gitlab",
  "linkedin",
  "telegram",
]);

const isValidLink = (value: string) =>
  /^(https?:\/\/)?([\w-]+\.)+[a-z]{2,}([/?#].*)?$/i.test(value.trim());

const isValidEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

/** Optional fields revealed via "Add details" chips */
const DETAIL_FIELDS: {
  key: keyof PersonalInfo;
  labelKey: string;
  placeholder: string;
  icon: LucideIcon;
}[] = [
  {
    key: "nationality",
    labelKey: "nationality",
    placeholder: "Khmer",
    icon: Flag,
  },
  {
    key: "passportId",
    labelKey: "passportId",
    placeholder: "N01234567",
    icon: IdCard,
  },
  {
    key: "portfolio",
    labelKey: "portfolio",
    placeholder: "behance.net/sokdara",
    icon: Briefcase,
  },
  {
    key: "website",
    labelKey: "website",
    placeholder: "sokdara.com",
    icon: Globe,
  },
  {
    key: "linkedin",
    labelKey: "linkedin",
    placeholder: "linkedin.com/in/sokdara",
    icon: Contact,
  },
  {
    key: "github",
    labelKey: "github",
    placeholder: "github.com/sokdara",
    icon: SquareCode,
  },
  {
    key: "gitlab",
    labelKey: "gitlab",
    placeholder: "gitlab.com/sokdara",
    icon: GitBranch,
  },
  {
    key: "stackoverflow",
    labelKey: "stackoverflow",
    placeholder: "stackoverflow.com/users/...",
    icon: MessageCircle,
  },
  {
    key: "telegram",
    labelKey: "telegram",
    placeholder: "@sokdara",
    icon: Send,
  },
];

export default function Step1Personal() {
  const { t } = useTranslation();
  const personal = useResumeStore((s) => s.resume.personal);
  const updatePersonal = useResumeStore((s) => s.updatePersonal);
  const showPhoto = useResumeStore((s) => s.resume.customization.showPhoto);
  const fileRef = useRef<HTMLInputElement>(null);
  const photoBoxRef = useRef<HTMLDivElement>(null);
  // in-progress drag-to-reposition of the photo in "crop" mode
  const photoDragRef = useRef<{
    x: number;
    y: number;
    posX: number;
    posY: number;
  } | null>(null);
  const photoDraggedRef = useRef(false);

  // chips clicked this session (fields with values are always visible)
  const [opened, setOpened] = useState<Set<string>>(new Set());
  // which link entry's URL popover is currently open
  const [urlPopover, setUrlPopover] = useState<{
    key: keyof PersonalInfo;
    id: string;
  } | null>(null);
  // in-progress drag for reordering a link field's entries
  const [dragId, setDragId] = useState<string | null>(null);
  const summaryRewrite = useSmartRewrite("summary");

  const hasValue = (key: keyof PersonalInfo) => {
    const v = personal[key];
    return Array.isArray(v) ? v.length > 0 : !!v;
  };

  const visibleDetails = DETAIL_FIELDS.filter(
    (f) => opened.has(f.key) || hasValue(f.key),
  );
  const textDetails = visibleDetails.filter((f) => !LINK_FIELD_KEYS.has(f.key));
  const linkDetails = visibleDetails.filter((f) => LINK_FIELD_KEYS.has(f.key));
  const availableChips = DETAIL_FIELDS.filter(
    (f) => !opened.has(f.key) && !hasValue(f.key),
  );

  const openField = (key: keyof PersonalInfo, labelKey: string) => {
    setOpened((prev) => new Set(prev).add(key));
    if (LINK_FIELD_KEYS.has(key)) {
      const entry: LinkItem = {
        id: uid(),
        title: t(`builder.personal.details.${labelKey}`),
        url: "",
      };
      updatePersonal({ [key]: [entry] } as Partial<PersonalInfo>);
    }
  };
  const closeField = (key: keyof PersonalInfo) => {
    setOpened((prev) => {
      const nextSet = new Set(prev);
      nextSet.delete(key);
      return nextSet;
    });
    updatePersonal({
      [key]: LINK_FIELD_KEYS.has(key) ? [] : "",
    } as Partial<PersonalInfo>);
    setUrlPopover((prev) => (prev?.key === key ? null : prev));
  };

  const addLinkEntry = (key: keyof PersonalInfo, labelKey: string) => {
    const entry: LinkItem = {
      id: uid(),
      title: t(`builder.personal.details.${labelKey}`),
      url: "",
    };
    updatePersonal({
      [key]: [...(personal[key] as LinkItem[]), entry],
    } as Partial<PersonalInfo>);
  };
  const updateLinkEntry = (
    key: keyof PersonalInfo,
    id: string,
    patch: Partial<LinkItem>,
  ) => {
    const entries = (personal[key] as LinkItem[]).map((entry) =>
      entry.id === id ? { ...entry, ...patch } : entry,
    );
    updatePersonal({ [key]: entries } as Partial<PersonalInfo>);
  };
  const removeLinkEntry = (key: keyof PersonalInfo, id: string) => {
    const entries = (personal[key] as LinkItem[]).filter(
      (entry) => entry.id !== id,
    );
    if (entries.length === 0) {
      closeField(key);
    } else {
      updatePersonal({ [key]: entries } as Partial<PersonalInfo>);
    }
  };
  const reorderLinkEntry = (
    key: keyof PersonalInfo,
    fromId: string,
    toId: string,
  ) => {
    if (fromId === toId) return;
    const entries = [...(personal[key] as LinkItem[])];
    const fromIndex = entries.findIndex((e) => e.id === fromId);
    const toIndex = entries.findIndex((e) => e.id === toId);
    if (fromIndex === -1 || toIndex === -1) return;
    const [moved] = entries.splice(fromIndex, 1);
    entries.splice(toIndex, 0, moved);
    updatePersonal({ [key]: entries } as Partial<PersonalInfo>);
  };

  const onPhotoPick = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () =>
      updatePersonal({
        photoUrl: reader.result as string,
        photoFit: "fill",
        photoZoom: 1,
        photoPosition: { x: 0, y: 0 },
      });
    reader.readAsDataURL(file);
  };

  const onPhotoPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (personal.photoFit !== "crop" || !personal.photoUrl) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    photoDraggedRef.current = false;
    photoDragRef.current = {
      x: e.clientX,
      y: e.clientY,
      posX: personal.photoPosition.x,
      posY: personal.photoPosition.y,
    };
  };
  const onPhotoPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const drag = photoDragRef.current;
    if (!drag || !photoBoxRef.current) return;
    const rect = photoBoxRef.current.getBoundingClientRect();
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) photoDraggedRef.current = true;
    updatePersonal({
      photoPosition: {
        x: clamp(drag.posX + (dx / rect.width) * 100, -50, 50),
        y: clamp(drag.posY + (dy / rect.height) * 100, -50, 50),
      },
    });
  };
  const onPhotoPointerUp = () => {
    photoDragRef.current = null;
  };
  const onPhotoClick = () => {
    if (photoDraggedRef.current) {
      photoDraggedRef.current = false;
      return;
    }
    if (personal.photoFit === "crop" && personal.photoUrl) return;
    fileRef.current?.click();
  };

  return (
    <div className="space-y-6 lg:px-6 lg:pr-10">
      <div>
        <h2 className="text-2xl font-bold">{t("builder.personal.title")}</h2>
        <p className="text-sm text-text-secondary mt-1">
          {t("builder.personal.subtitle")}
        </p>
      </div>

      <div
        className={cn(
          "grid grid-cols-1 gap-6",
          showPhoto && "sm:grid-cols-[1fr_auto]",
        )}
      >
        <div className="order-2 sm:order-1 space-y-4">
          <Input
            label={t("builder.personal.fullName")}
            placeholder="Sok Dara"
            value={personal.fullName}
            onChange={(e) => updatePersonal({ fullName: e.target.value })}
          />
          <Input
            label={t("builder.personal.jobTitle")}
            placeholder="Junior Accountant"
            value={personal.jobTitle}
            onChange={(e) => updatePersonal({ jobTitle: e.target.value })}
          />
          <Input
            label={t("builder.personal.phone")}
            placeholder="+855 12 345 678"
            value={personal.phone}
            onChange={(e) => updatePersonal({ phone: e.target.value })}
          />
        </div>

        {/* photo upload — hidden when the selected template has no photo slot */}
        {showPhoto && (
        <div className="order-1 sm:order-2 space-y-2 text-center">
          <p className="text-sm font-medium text-text">
            {t("builder.personal.image")}
          </p>
          <div ref={photoBoxRef} className="size-36 mx-auto">
            <button
              onClick={onPhotoClick}
              onPointerDown={onPhotoPointerDown}
              onPointerMove={onPhotoPointerMove}
              onPointerUp={onPhotoPointerUp}
              onPointerLeave={onPhotoPointerUp}
              className={cn(
                "size-36 rounded-full bg-surface-2 border border-line overflow-hidden inline-flex items-center justify-center text-text-secondary hover:border-brand hover:text-brand transition-colors touch-none",
                personal.photoUrl &&
                  personal.photoFit === "crop" &&
                  "cursor-grab active:cursor-grabbing",
              )}
              aria-label={t("builder.personal.uploadPhoto")}
            >
              {personal.photoUrl ? (
                <img
                  src={personal.photoUrl}
                  alt=""
                  draggable={false}
                  style={photoImgStyle(personal)}
                />
              ) : (
                <ImagePlus size={34} strokeWidth={1.6} />
              )}
            </button>
          </div>

          {personal.photoUrl && (
            <>
              <div className="flex items-center justify-center gap-1">
                {PHOTO_FIT_MODES.map((mode) => (
                  <button
                    key={mode}
                    onClick={() => updatePersonal({ photoFit: mode })}
                    className={cn(
                      "px-2.5 py-1 rounded-md text-xs font-medium border transition-colors",
                      personal.photoFit === mode
                        ? "border-brand text-brand"
                        : "border-line text-text-secondary hover:bg-surface-2",
                    )}
                  >
                    {t(`builder.personal.photoFit.${mode}`)}
                  </button>
                ))}
              </div>

              {personal.photoFit === "crop" && (
                <div className="space-y-1">
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.05}
                    value={personal.photoZoom}
                    onChange={(e) =>
                      updatePersonal({ photoZoom: Number(e.target.value) })
                    }
                    className="w-32 accent-brand"
                  />
                  <p className="text-[11px] text-text-placeholder">
                    {t("builder.personal.dragToReposition")}
                  </p>
                </div>
              )}

              <button
                onClick={() =>
                  updatePersonal({
                    photoUrl: "",
                    photoFit: "fill",
                    photoZoom: 1,
                    photoPosition: { x: 0, y: 0 },
                  })
                }
                className="block mx-auto text-xs text-brand hover:underline"
              >
                {t("builder.personal.removePhoto")}
              </button>
            </>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onPhotoPick(e.target.files?.[0])}
          />
        </div>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Input
          label={t("builder.personal.email")}
          type="email"
          required
          placeholder="sokdara@gmail.com"
          value={personal.email}
          onChange={(e) => updatePersonal({ email: e.target.value })}
          error={
            personal.email.trim() !== "" && !isValidEmail(personal.email)
              ? t("builder.personal.invalidEmail")
              : undefined
          }
        />
        <Input
          label={t("builder.personal.location")}
          placeholder="Phnom Penh, Cambodia"
          value={personal.location}
          onChange={(e) => updatePersonal({ location: e.target.value })}
        />
      </div>

      {/* summary with AI rewrite, vertically centered on the same row as the label */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label
            htmlFor="personal-summary"
            className="text-sm font-medium text-text"
          >
            {t("builder.personal.summary")}
          </label>
          <AiRewriteButton
            loading={summaryRewrite.loading}
            disabled={!personal.summary.replace(/<[^>]*>/g, "").trim()}
            onClick={() => summaryRewrite.generate(personal.summary)}
            size="xs"
          />
        </div>
        <RichTextEditor
          value={personal.summary}
          onChange={(summary) => updatePersonal({ summary })}
          placeholder={t("builder.personal.summaryPlaceholder")}
        />
        <p className="mt-1.5 text-xs text-text-placeholder">
          {t("builder.personal.summaryHint")}
        </p>
        {summaryRewrite.variations && (
          <SmartRewriteSuggestions
            variations={summaryRewrite.variations}
            onSelect={(chosen) => {
              updatePersonal({ summary: chosen });
              summaryRewrite.dismiss();
            }}
            onDismiss={summaryRewrite.dismiss}
          />
        )}
      </div>

      {/* optional detail fields currently visible: short text fields pair up
          two-per-row, repeatable link fields stack full-width below them */}
      {textDetails.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-4">
          {textDetails.map((f) => (
            <div key={f.key} className="space-y-1.5">
              <label className="text-sm font-medium text-text">
                {t(`builder.personal.details.${f.labelKey}`)}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder={f.placeholder}
                  value={personal[f.key] as string}
                  onChange={(e) => updatePersonal({ [f.key]: e.target.value })}
                  className="flex-1 h-10 px-3 rounded-lg border border-line bg-bg text-sm text-text placeholder:text-text-placeholder focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring transition-colors"
                />
                <button
                  onClick={() => closeField(f.key)}
                  className="size-10 shrink-0 rounded-md text-destructive hover:bg-surface-2 inline-flex items-center justify-center"
                  aria-label={t("builder.personal.removeField")}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {linkDetails.length > 0 && (
        <div className="space-y-4">
          {linkDetails.map((f) => {
            const entries = personal[f.key] as LinkItem[];
            return (
              <div key={f.key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-text">
                    {t(`builder.personal.details.${f.labelKey}`)}
                  </p>
                  <button
                    onClick={() => closeField(f.key)}
                    className="text-xs text-text-placeholder hover:text-brand"
                  >
                    {t("builder.personal.removeField")}
                  </button>
                </div>
                <div className="space-y-2">
                  <AnimatePresence initial={false}>
                    {entries.map((entry) => {
                      const popoverOpen =
                        urlPopover?.key === f.key && urlPopover.id === entry.id;
                      const invalid =
                        entry.url.trim() !== "" && !isValidLink(entry.url);
                      return (
                        <motion.div
                          key={entry.id}
                          layout
                          initial={{ opacity: 0, y: -8, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{
                            opacity: 0,
                            scale: 0.98,
                            transition: { duration: 0.15 },
                          }}
                          transition={{
                            type: "spring",
                            stiffness: 500,
                            damping: 35,
                          }}
                          draggable={entries.length > 1}
                          onDragStart={() => setDragId(entry.id)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => {
                            if (dragId)
                              reorderLinkEntry(f.key, dragId, entry.id);
                            setDragId(null);
                          }}
                          onDragEnd={() => setDragId(null)}
                          className="flex items-center gap-2"
                        >
                          {entries.length > 1 && (
                            <span className="h-10 shrink-0 inline-flex items-center text-text-placeholder cursor-grab active:cursor-grabbing">
                              <GripVertical size={16} />
                            </span>
                          )}
                          <div className="relative flex-1">
                            <input
                              type="text"
                              placeholder={t(
                                `builder.personal.details.${f.labelKey}`,
                              )}
                              value={entry.title}
                              onChange={(e) =>
                                updateLinkEntry(f.key, entry.id, {
                                  title: e.target.value,
                                })
                              }
                              className="w-full h-10 pl-3 pr-9 rounded-lg border border-line bg-bg text-sm text-text placeholder:text-text-placeholder focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring transition-colors"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setUrlPopover((prev) =>
                                  prev?.key === f.key && prev.id === entry.id
                                    ? null
                                    : { key: f.key, id: entry.id },
                                )
                              }
                              className={cn(
                                "absolute right-2 top-1/2 -translate-y-1/2 size-6 rounded-md inline-flex items-center justify-center hover:bg-surface-2",
                                entry.url
                                  ? "text-brand"
                                  : "text-text-placeholder",
                              )}
                              aria-label={t("builder.personal.linkUrl")}
                            >
                              <LinkIcon size={15} />
                            </button>

                            {popoverOpen && (
                              <div className="absolute z-10 left-0 bottom-[calc(100%+0.5rem)] w-full min-w-[16rem] bg-bg border border-line rounded-xl shadow-lg p-3 space-y-1.5">
                                <p className="text-xs font-medium text-text-secondary">
                                  {t("builder.personal.linkUrl")}
                                </p>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="url"
                                    autoFocus
                                    value={entry.url}
                                    placeholder="https://..."
                                    onChange={(e) =>
                                      updateLinkEntry(f.key, entry.id, {
                                        url: e.target.value,
                                      })
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        e.preventDefault();
                                        setUrlPopover(null);
                                      }
                                    }}
                                    className={cn(
                                      "flex-1 h-9 px-3 rounded-lg border bg-bg text-sm text-text placeholder:text-text-placeholder focus:outline-none focus:ring-2 focus:ring-ring/50 transition-colors",
                                      invalid
                                        ? "border-destructive"
                                        : "border-line focus:border-ring",
                                    )}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setUrlPopover(null)}
                                    className="size-9 shrink-0 rounded-lg bg-emerald-600 text-white inline-flex items-center justify-center hover:bg-emerald-700 transition-colors"
                                    aria-label={t("builder.confirm")}
                                  >
                                    <Check size={16} />
                                  </button>
                                </div>
                                {invalid && (
                                  <p className="text-xs text-destructive">
                                    {t("builder.personal.invalidLink")}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => removeLinkEntry(f.key, entry.id)}
                            className="size-10 shrink-0 rounded-md text-destructive hover:bg-surface-2 inline-flex items-center justify-center"
                            aria-label={t("builder.personal.removeField")}
                          >
                            <Trash2 size={16} />
                          </button>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
                <button
                  onClick={() => addLinkEntry(f.key, f.labelKey)}
                  className="text-xs font-medium text-brand hover:underline"
                >
                  + {t("builder.personal.addAnotherLink")}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* add details chips */}
      {availableChips.length > 0 && (
        <div className="space-y-2.5">
          <p className="text-sm font-medium text-text">
            {t("builder.personal.addDetails")}
          </p>
          <div className="flex flex-wrap gap-2">
            {availableChips.map((f) => (
              <button
                key={f.key}
                onClick={() => openField(f.key, f.labelKey)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line text-sm text-text hover:border-brand hover:text-brand transition-colors"
              >
                <f.icon size={15} strokeWidth={1.8} />
                {t(`builder.personal.details.${f.labelKey}`)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
