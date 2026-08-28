import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Check, ChevronDown, Copy, Loader2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import JourneyLayout from "../../components/dashboard/JourneyLayout";
import { useAuth } from "../../hooks/UseAuth";
import { useJourneyResume } from "../../hooks/useJourneyResume";
import { useJourneyStore, useJourneyDraft, practicedIdsOf } from "../../store/journeyStore";
import type { InterviewCategory, InterviewQuestion } from "../../store/journeyStore";
import { buildFallbackAnalysis, splitJobAd, withNormalizedQuestions } from "../../lib/jobAnalysis";
import { cn } from "../../lib/utils";
import mascot from "../../assets/logo/mascot.png";

type FilterId = "all" | InterviewCategory;

const FILTERS: { id: FilterId; labelKey: string }[] = [
  { id: "all", labelKey: "interviewPrep.filters.all" },
  { id: "behavioral", labelKey: "interviewPrep.filters.behavioral" },
  { id: "technical", labelKey: "interviewPrep.filters.technical" },
  { id: "situational", labelKey: "interviewPrep.filters.situational" },
];

const CATEGORY_LABEL: Record<InterviewCategory, string> = {
  behavioral: "interviewPrep.category.behavioral",
  technical: "interviewPrep.category.technical",
  situational: "interviewPrep.category.situational",
};

/** Interview prep as step 3 of the job-readiness journey (after job match). */
export default function ProcessInterviewPrep() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const from =
    (location.state as { from?: "hub" | "saved-jobs"; fromHub?: boolean } | null)
      ?.from ??
    ((location.state as { fromHub?: boolean } | null)?.fromHub
      ? "hub"
      : undefined);
  const { user } = useAuth();
  const { resume, loading } = useJourneyResume();
  const reachStep = useJourneyStore((s) => s.reachStep);
  const saveDraft = useJourneyStore((s) => s.saveDraft);
  const getDraft = useJourneyStore((s) => s.getDraft);
  const draft = useJourneyDraft(user?.id, resume.id);
  const practicedQuestionIds = practicedIdsOf(draft);
  const analysis = draft?.analysis;
  const pack = useMemo(() => {
    if (draft?.jobText && resume.id && (!analysis || analysis.source === "fallback")) {
      return buildFallbackAnalysis(draft.jobText, resume);
    }
    if (analysis) return withNormalizedQuestions(analysis, resume, draft?.jobText);
    if (draft?.jobText && resume.id) {
      return buildFallbackAnalysis(draft.jobText, resume);
    }
    return undefined;
  }, [analysis, draft?.jobText, resume]);

  const [filter, setFilter] = useState<FilterId>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (loading || !user || !resume.id) return;
    const current = getDraft(user.id, resume.id);
    if (!current.analysis && !current.jobText) {
      navigate("/interview-prep", { replace: true });
      return;
    }
    if (!current.analysis && current.jobText) {
      saveDraft(user.id, resume.id, {
        analysis: buildFallbackAnalysis(current.jobText, resume),
      });
    }
    reachStep(user.id, resume.id, 2);
  }, [loading, user?.id, resume.id, getDraft, saveDraft, reachStep, navigate]);

  const questions = pack?.questions ?? [];
  const visible = useMemo(
    () =>
      filter === "all"
        ? questions
        : questions.filter((q) => q.category === filter),
    [filter, questions],
  );

  useEffect(() => {
    if (!visible.length) {
      setOpenId(null);
      return;
    }
    setOpenId((current) =>
      current && visible.some((q) => q.id === current)
        ? current
        : visible[0].id,
    );
  }, [visible]);

  const practicedSet = useMemo(
    () => new Set(practicedQuestionIds),
    [practicedQuestionIds],
  );
  const practicedCount = questions.filter((q) => practicedSet.has(q.id)).length;
  const progress =
    questions.length > 0
      ? Math.round((practicedCount / questions.length) * 100)
      : 0;
  const roleTitle =
    pack?.roleTitle ||
    resume.personal.jobTitle ||
    t("interviewPrep.thisRole");
  const companyName = splitJobAd(draft?.jobText ?? "").company;

  const toggleReady = (id: string) => {
    if (!user || !resume.id) return;
    const next = practicedSet.has(id)
      ? practicedQuestionIds.filter((item) => item !== id)
      : [...practicedQuestionIds, id];
    saveDraft(user.id, resume.id, { practicedQuestionIds: next });
  };

  const copySample = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      window.setTimeout(() => {
        setCopiedId((current) => (current === id ? null : current));
      }, 1600);
    } catch {
      /* clipboard can be blocked on insecure contexts */
    }
  };

  if (loading || !resume.id || !pack) {
    return (
      <div className="flex items-center justify-center px-4 py-24 text-text-secondary">
        <Loader2 size={20} className="animate-spin" />
        <span className="ml-3 text-sm">{t("common.loading")}</span>
      </div>
    );
  }

  return (
    <JourneyLayout
      activeIndex={2}
      backLabel={
        from === "hub"
          ? t("interviewPrep.backToHub")
          : from === "saved-jobs"
            ? t("interviewPrep.backToSaved")
            : t("interviewPrep.back")
      }
      nextLabel={t("interviewPrep.next")}
      onBack={() =>
        navigate(
          from === "hub"
            ? "/interview-prep"
            : from === "saved-jobs"
              ? "/saved-jobs"
              : "/job-match",
        )
      }
      onNext={() =>
        navigate("/job-readiness", from ? { state: { from } } : undefined)
      }
    >
      <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(200px,240px)_minmax(0,1fr)] lg:items-start lg:gap-4">
        <aside className="flex items-center gap-3 rounded-2xl border border-line bg-bg p-3.5 shadow-sm min-[375px]:p-4 sm:gap-4 sm:p-5 lg:block">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-text-secondary">
              {t("interviewPrep.progressTitle")}
            </p>
            <p className="mt-2 text-xl font-extrabold tabular-nums tracking-tight text-text min-[375px]:text-2xl lg:mt-3">
              {t("interviewPrep.practiced", {
                done: practicedCount,
                total: questions.length,
              })}
            </p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2 lg:mt-3">
              <div
                className="h-full rounded-full bg-brand transition-[width] duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-2 hidden text-xs leading-5 text-text-secondary min-[375px]:block lg:mt-3">
              {t("interviewPrep.progressHint")}
            </p>
          </div>
          <img
            src={mascot}
            alt=""
            className="w-16 shrink-0 select-none min-[375px]:w-20 lg:mx-auto lg:mt-4 lg:w-32"
          />
        </aside>

        <section className="min-w-0 rounded-2xl border border-brand/15 bg-bg p-3.5 shadow-sm min-[375px]:p-4 sm:rounded-[20px] sm:p-5 lg:p-6">
          <span className="inline-flex max-w-full rounded-full bg-brand/10 px-2.5 py-1 text-[10px] font-semibold text-brand min-[375px]:px-3 min-[375px]:text-[11px]">
            <span className="truncate">
              {t("interviewPrep.badge", {
                role: companyName
                  ? t("jobMatch.roleAtCompany", {
                      role: roleTitle,
                      company: companyName,
                    })
                  : roleTitle,
              })}
            </span>
          </span>
          <h2 className="mt-2.5 break-words text-base font-extrabold tracking-tight text-text min-[375px]:text-lg sm:text-xl">
            {t("interviewPrep.title")}
          </h2>
          <p className="mt-1 max-w-lg text-sm leading-6 text-text-secondary">
            {companyName
              ? t("interviewPrep.descriptionAtCompany", {
                  role: roleTitle,
                  company: companyName,
                })
              : t("interviewPrep.description", { role: roleTitle })}
          </p>

          <div className="-mx-1 mt-4 flex gap-1.5 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {FILTERS.map((item) => {
              const active = filter === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFilter(item.id)}
                  className={cn(
                    "shrink-0 rounded-full px-2.5 py-1.5 text-[11px] font-semibold transition-colors min-[375px]:px-3 min-[375px]:text-xs",
                    active
                      ? "bg-brand text-white"
                      : "border border-line bg-bg text-text-secondary hover:border-brand/40 hover:text-text",
                  )}
                >
                  {t(item.labelKey)}
                </button>
              );
            })}
          </div>

          <ul className="mt-4 space-y-2.5">
            {visible.length === 0 ? (
              <li className="rounded-2xl border border-line px-4 py-6 text-center text-sm text-text-secondary">
                {t("interviewPrep.noQuestions")}
              </li>
            ) : (
              visible.map((question) => {
                const open = openId === question.id;
                const ready = practicedSet.has(question.id);
                const number =
                  questions.findIndex((item) => item.id === question.id) + 1;
                return (
                  <li
                    key={question.id}
                    className={cn(
                      "rounded-2xl border bg-bg",
                      open ? "border-brand/30" : "border-line",
                    )}
                  >
                    <button
                      type="button"
                      aria-expanded={open}
                      onClick={() =>
                        setOpenId(open ? null : question.id)
                      }
                      className="flex w-full items-start gap-2 px-3 py-3 text-left min-[375px]:gap-3 min-[375px]:px-3.5 min-[375px]:py-3.5 sm:px-4"
                    >
                      <span className="mt-0.5 shrink-0 text-[11px] font-bold tabular-nums text-text-placeholder">
                        Q{number}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand">
                          {t(CATEGORY_LABEL[question.category])}
                        </span>
                        <span className="mt-1 block text-sm font-semibold leading-6 text-text">
                          {question.question}
                        </span>
                      </span>
                      {ready && (
                        <>
                          <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-success-bg text-success sm:hidden">
                            <Check size={12} strokeWidth={2.6} />
                          </span>
                          <span className="mt-0.5 hidden shrink-0 rounded-full bg-success-bg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-success sm:inline">
                            {t("interviewPrep.markedReady")}
                          </span>
                        </>
                      )}
                      <ChevronDown
                        size={16}
                        className={cn(
                          "mt-1 shrink-0 text-text-secondary transition-transform",
                          open && "rotate-180",
                        )}
                      />
                    </button>
                    {open && (
                      <QuestionCoach
                        question={question}
                        ready={ready}
                        copied={copiedId === question.id}
                        onCopy={() =>
                          question.sampleAnswer
                            ? copySample(question.id, question.sampleAnswer)
                            : undefined
                        }
                        onToggleReady={() => toggleReady(question.id)}
                      />
                    )}
                  </li>
                );
              })
            )}
          </ul>
        </section>
      </div>
    </JourneyLayout>
  );
}

function QuestionCoach({
  question,
  ready,
  copied,
  onCopy,
  onToggleReady,
}: {
  question: InterviewQuestion;
  ready: boolean;
  copied: boolean;
  onCopy?: () => void;
  onToggleReady: () => void;
}) {
  const { t } = useTranslation();
  const points = question.talkingPoints?.filter(Boolean) ?? [];
  const sample =
    question.sampleAnswer?.trim() || question.angle?.trim() || "";

  return (
    <div className="space-y-3.5 border-t border-line px-3 pb-3.5 pt-3 min-[375px]:px-3.5 min-[375px]:pb-4 sm:px-4">
      {sample ? (
        <div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-text-secondary">
              {t("interviewPrep.sampleAnswer")}
            </p>
            {onCopy && question.sampleAnswer ? (
              <button
                type="button"
                onClick={onCopy}
                className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-text-secondary transition-colors hover:text-text"
              >
                {copied ? (
                  <Check size={12} strokeWidth={2.6} className="text-success" />
                ) : (
                  <Copy size={12} />
                )}
                {copied
                  ? t("interviewPrep.copied")
                  : t("interviewPrep.copySample")}
              </button>
            ) : null}
          </div>
          <p className="mt-1.5 text-sm leading-6 text-text">{sample}</p>
        </div>
      ) : null}

      {points.length > 0 ? (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-text-secondary">
            {t("interviewPrep.talkingPoints")}
          </p>
          <ul className="mt-1.5 space-y-1">
            {points.map((point, i) => (
              <li
                key={`${question.id}-pt-${i}`}
                className="text-sm leading-6 text-text-secondary"
              >
                {i + 1}. {point}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <Button
        variant={ready ? "outline" : "default"}
        size="xs"
        className={cn(
          "h-8 rounded-full px-3.5",
          ready ? "border-success text-success hover:bg-success-bg" : "",
        )}
        onClick={onToggleReady}
      >
        {ready ? <Check size={13} strokeWidth={2.6} /> : null}
        {ready ? t("interviewPrep.markedReady") : t("interviewPrep.markReady")}
      </Button>
    </div>
  );
}
