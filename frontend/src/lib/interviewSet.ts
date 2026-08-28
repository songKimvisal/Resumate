import type { Resume } from "../types/resume";
import type {
  InterviewCategory,
  InterviewQuestion,
  JobAnalysisPack,
} from "../store/journeyStore";

/** One paid interview set. One credit. One job ad. */
export const INTERVIEW_SET_SIZE = 20;

type Story = { label: string; proof: string };

export type InterviewSetContext = {
  roleTitle: string;
  name: string;
  title: string;
  story: Story;
  proof: string;
  skillHint: string;
  matchedHint: string;
  skillLine: string;
  missing: boolean;
};

export function completeInterviewSet(
  questions: InterviewQuestion[],
  ctx: InterviewSetContext,
): InterviewQuestion[] {
  const seen = new Set<string>();
  const out: InterviewQuestion[] = [];
  for (const item of questions) {
    const key = item.question.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push({
      ...item,
      id: `q${out.length + 1}`,
    });
    if (out.length >= INTERVIEW_SET_SIZE) return out;
  }
  for (const extra of buildInterviewBank(ctx)) {
    const key = extra.question.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ ...extra, id: `q${out.length + 1}` });
    if (out.length >= INTERVIEW_SET_SIZE) break;
  }
  return out;
}

export function ensurePackInterviewSet(
  pack: JobAnalysisPack,
  ctx: InterviewSetContext,
): JobAnalysisPack {
  return {
    ...pack,
    questions: completeInterviewSet(pack.questions, ctx),
  };
}

export function buildInterviewBank(ctx: InterviewSetContext): InterviewQuestion[] {
  const r = ctx.roleTitle;
  const story = ctx.story.label;
  const proof = ctx.proof;
  const skill = ctx.skillHint;
  const matched = ctx.matchedHint;
  const who = ctx.name ? `${ctx.name}, a ${ctx.title}` : `a ${ctx.title}`;

  const bank: Omit<InterviewQuestion, "id">[] = [
    {
      category: "behavioral",
      question: `Tell me about yourself, and why you want this ${r} job.`,
      why: `They want a short story of who you are, and why this ${r} job fits you.`,
      angle: `Say who you are. Give one example from ${story}. End with why you want this ${r} job.`,
      talkingPoints: [
        `Say you are ${who}.`,
        `Give one example from ${story}.`,
        `End with why this ${r} job is next.`,
      ],
      sampleAnswer: `Hi, I'm ${who}. Recently I worked on ${story}.${proof} I want this ${r} job because it matches what I already practice, and I want to do it on your team.`,
    },
    {
      category: "behavioral",
      question: "Tell me about a time you had to learn something quickly.",
      why: "They want one real story of how you learn under time pressure.",
      angle: `Use ${story}. What was hard, what you learned, and what changed.`,
      talkingPoints: [
        "Say what was hard.",
        "Say what you learned, and how.",
        "End with a result.",
      ],
      sampleAnswer: `On ${story} I had to learn faster than I planned.${proof} I made a small first version, asked one clear question, and checked my work. I would do the same in a ${r} job.`,
    },
    {
      category: "behavioral",
      question: "Tell me about a time you made a mistake. What did you do next?",
      why: "They want to see if you can own a mistake and fix it.",
      angle: `Pick a small real miss from ${story}. Say what you changed after.`,
      talkingPoints: [
        "Name the mistake without drama.",
        "Say how you fixed it.",
        "Say what you do differently now.",
      ],
      sampleAnswer: `On ${story} I moved too fast and missed a check. I told my teammate, fixed the work, and added a simple checklist. In a ${r} job I would rather catch a miss early than hide it.`,
    },
    {
      category: "behavioral",
      question: "Describe a time you worked with someone who had a different style than you.",
      why: `This ${r} job needs calm teamwork, not being the loudest person.`,
      angle: `Use a real person from ${story}. What you changed in how you worked.`,
      talkingPoints: [
        "Say how they liked to work.",
        "Say what you changed.",
        "End with a better result.",
      ],
      sampleAnswer: `On ${story} a teammate wanted more detail before starting. I sent a short plan first, then we built. The work got clearer. I would do that on a ${r} team too.`,
    },
    {
      category: "behavioral",
      question: "Tell me about a time you had too much to do. How did you choose?",
      why: "They want to see how you pick what matters when time is short.",
      angle: `From ${story}, name two tasks. Say which one you did first and why.`,
      talkingPoints: [
        "Name the deadline.",
        "Say what you did first, and why.",
        "Say what you paused.",
      ],
      sampleAnswer: `On ${story} I had two tasks and one deadline. I asked which one blocked other people, did that first, and told my manager what would wait. That is how I would choose on a ${r} day.`,
    },
    {
      category: "behavioral",
      question: "Give an example of when you asked for help.",
      why: `New ${r} hires who ask early usually learn faster.`,
      angle: `Say who you asked, what you tried first, and what you learned.`,
      talkingPoints: [
        "Say what you tried first.",
        "Say who you asked.",
        "Say what you did with the answer.",
      ],
      sampleAnswer: `On ${story} I tried once on my own, then asked a clearer question. I used the answer the same day. In this ${r} job I would ask early, with a small example in hand.`,
    },
    {
      category: "behavioral",
      question: "Tell me about a project you are proud of.",
      why: "They want energy and proof, not a list of every class you took.",
      angle: `Use ${story}. What you did, what was hard, what you would do again.`,
      talkingPoints: [
        `Name ${story}.`,
        "Say your part in one sentence.",
        "Say the result.",
      ],
      sampleAnswer: `I'm proud of ${story}.${proof} I owned a clear piece of the work and checked it before sharing. That habit is what I would bring to this ${r} role.`,
    },
    {
      category: "behavioral",
      question: "How do you handle feedback that is hard to hear?",
      why: "They need people who can improve without getting defensive.",
      angle: "Repeat the feedback. Ask one question. Change one thing.",
      talkingPoints: [
        "Repeat what you heard.",
        "Ask what good looks like.",
        "Change one thing and follow up.",
      ],
      sampleAnswer: `I repeat the feedback so I am sure I heard it. Then I ask what good looks like, change one thing, and check back. That is how I already work on ${story}.`,
    },
    {
      category: "technical",
      question: `How have you used ${skill}, or a similar tool, in your recent work?`,
      why: `The job ad asks for ${skill}. They want a real example.`,
      angle: ctx.missing
        ? `If you have not used ${skill} yet, say so. Talk about ${matched}. Then say how you would learn ${skill}.`
        : `Give one example with ${skill}: problem, steps, result.`,
      talkingPoints: ctx.missing
        ? [
            `Say what you do use, like ${matched}.`,
            `Do not pretend you already know ${skill}.`,
            "Say how you would learn it in week one.",
          ]
        : [
            `Name ${skill} in a real task.`,
            "Explain the steps.",
            "Say how you checked the result.",
          ],
      sampleAnswer: ctx.missing
        ? `I have not used ${skill} in a paid job yet. What I have used is ${ctx.skillLine}. In the first weeks I would follow your files, try one small example in ${skill}, and ask for feedback.`
        : `I use ${skill} in my work. On ${story} I started with the question, made a first version, and checked it. As a ${r} I would do the same.`,
    },
    {
      category: "technical",
      question: `How would you turn a messy ${r} request into a clear plan?`,
      why: `A lot of ${r} work starts unclear. They want simple steps.`,
      angle: `Use ${story}. What you asked, how you ordered the work, how you knew it was done.`,
      talkingPoints: [
        "Repeat the goal in one sentence.",
        "Ask two or three questions before you start.",
        "Share a small first version.",
      ],
      sampleAnswer: `I repeat the goal in one sentence. Then I ask who it is for and when we check in. On ${story} I cut the work into a small first version.${proof}`,
    },
    {
      category: "technical",
      question: `Walk me through how you would check your work before you share it as a ${r}.`,
      why: "They want a habit, not a perfect old file.",
      angle: "Name 3 checks: goal, numbers or spelling, and who will read it.",
      talkingPoints: [
        "Check it against the goal.",
        "Check the details.",
        "Ask who will use it.",
      ],
      sampleAnswer: `I check three things: does it match the goal, are the details right, and can the next person use it. On ${story} that stopped me from sending a draft too early.`,
    },
    {
      category: "technical",
      question: `How would you explain a ${r} update to someone who is busy?`,
      why: "Managers want a short update they can trust.",
      angle: "Goal, what you did, what is next, what you need.",
      talkingPoints: [
        "Start with the goal.",
        "Say what is done.",
        "Say the next step and any ask.",
      ],
      sampleAnswer: `I would say the goal, what is done, what is next, and if I need a decision. On ${story} a short update worked better than a long story.`,
    },
    {
      category: "technical",
      question: `What would you do in the first two weeks to get good at the tools this ${r} job uses?`,
      why: "They know you may not know every tool yet. They want a plan.",
      angle: `Name ${skill} or ${matched}. Copy one real example. Ask for a review.`,
      talkingPoints: [
        "Learn from existing files.",
        `Try one small example in ${skill}.`,
        "Ask for feedback once, not every hour.",
      ],
      sampleAnswer: `I would start from your existing files, rebuild one small example with ${skill}, and ask for a review. That is faster than watching videos with no real task.`,
    },
    {
      category: "technical",
      question: "How do you keep notes so you do not lose what you learned?",
      why: "Fresh graduates who write things down ramp faster.",
      angle: "One page: what you did, the gotcha, the next step.",
      talkingPoints: [
        "Write the steps you used.",
        "Write the mistake you will not repeat.",
        "Keep it where the team can see it.",
      ],
      sampleAnswer: `I keep a short note: the steps, one mistake, and the next step. On ${story} that helped me do the same task faster the second time.`,
    },
    {
      category: "situational",
      question: `If you joined as ${r} tomorrow and the task was unclear, what would you do in the first week?`,
      why: "They want to see you ask questions and make a small plan.",
      angle: "Ask who owns the work. Write what you know. Share one small piece by Friday.",
      talkingPoints: [
        "Find who owns the work on day one.",
        "Write what you know and what you are guessing.",
        "Offer one small piece of work.",
      ],
      sampleAnswer: `On day one I would ask who owns the work. I would write what I know versus what I am guessing, then check with my manager. By Friday I would bring one small example using ${matched}.`,
    },
    {
      category: "situational",
      question: `A teammate disagrees with your idea on a ${r} task. What do you do?`,
      why: "They want a calm next step, not a fight.",
      angle: "Listen, repeat their point, compare both ideas to the goal, suggest a small test.",
      talkingPoints: [
        "Repeat their point.",
        "Compare both ideas to the goal.",
        "Agree a small test.",
      ],
      sampleAnswer: `I would repeat their point first. Then I would put both ideas next to the goal. If we still disagree, I would suggest a small test we can review together.`,
    },
    {
      category: "situational",
      question: `Your manager asks for a ${r} update in 30 minutes and you are not done. What do you say?`,
      why: "They want honesty plus a plan, not a fake finished file.",
      angle: "Say what is ready, what is not, and when the rest will be ready.",
      talkingPoints: [
        "Say what is ready now.",
        "Say what is still open.",
        "Give a real time for the rest.",
      ],
      sampleAnswer: `I would say what is ready now, what is not, and when I can share the rest. I would rather send a clear half than a rushed full draft.`,
    },
    {
      category: "situational",
      question: `You notice a small error in work that already went out. What do you do?`,
      why: "They care more about the fix than about looking perfect.",
      angle: "Tell the owner, name the error, offer the fix.",
      talkingPoints: [
        "Tell the person who needs to know.",
        "Name the error in one line.",
        "Offer the fix.",
      ],
      sampleAnswer: `I would tell the owner quickly, name the error, and send the fix. Waiting makes it worse. That is how I would handle it on a ${r} team.`,
    },
    {
      category: "situational",
      question: `Two people ask you for help at the same time. How do you choose?`,
      why: `This ${r} job will have competing asks.`,
      angle: "Ask which one blocks the team. Tell the other person when you can help.",
      talkingPoints: [
        "Ask which one is blocking others.",
        "Tell both people the plan.",
        "Keep the promise.",
      ],
      sampleAnswer: `I would ask which task blocks other people, do that first, and tell the other person when I can help. Silence is worse than a later time.`,
    },
    {
      category: "situational",
      question: `What would you do if you did not understand a ${r} term in a meeting?`,
      why: "They prefer one clear question over a wrong deliverable.",
      angle: "Write it down. Ask after, or in the chat, with the sentence you heard.",
      talkingPoints: [
        "Do not fake it.",
        "Ask with the sentence you heard.",
        "Write the meaning down.",
      ],
      sampleAnswer: `I would write the word down and ask right after, using the sentence I heard. That is faster than guessing and building the wrong thing.`,
    },
  ];

  return bank.map((item, i) => ({ ...item, id: `q${i + 1}` }));
}

export function interviewContextFromResume(
  resume: Resume,
  roleTitle: string,
  missing: string[],
  matched: string[],
): InterviewSetContext {
  const exp = resume.experience[0];
  const alt = resume.noExperience[0];
  const edu = resume.education[0];
  const strip = (html: string) =>
    html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
  const first = (text: string) => {
    const clean = strip(text);
    if (!clean) return "";
    const clause = clean.split(/[.!?]/)[0]?.trim() || clean;
    return clause.length > 140 ? `${clause.slice(0, 139).trim()}…` : clause;
  };

  let label = "my recent work";
  let proofRaw = "";
  if (exp) {
    label = [exp.jobTitle, exp.company].filter(Boolean).join(" at ") || label;
    proofRaw = first(exp.description);
  } else if (alt) {
    label = [alt.title, alt.subtitle].filter(Boolean).join(", ") || "a recent project";
    proofRaw = first(alt.description);
  } else if (edu) {
    label = [edu.degree, edu.field, edu.school].filter(Boolean).join(" · ") || "my studies";
    proofRaw = first(edu.description);
  }

  const proof = proofRaw
    ? ` ${proofRaw.charAt(0).toLowerCase()}${proofRaw.slice(1)}`
    : "";
  const title = resume.personal.jobTitle.trim() || roleTitle;
  const skillLine =
    resume.skills.map((s) => s.name.trim()).filter(Boolean).slice(0, 3).join(", ") ||
    matched[0] ||
    title;

  return {
    roleTitle,
    name: resume.personal.fullName.trim(),
    title,
    story: { label, proof: proofRaw },
    proof,
    skillHint: missing[0] || "the tools this posting lists",
    matchedHint: matched[0] || title,
    skillLine,
    missing: missing.length > 0,
  };
}
