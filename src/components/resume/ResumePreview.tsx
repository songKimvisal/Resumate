import {
  Phone,
  Mail,
  MapPin,
  Flag,
  Briefcase,
  Globe,
  Contact,
  SquareCode,
  GitBranch,
  MessageCircle,
  Send,
  IdCard,
  type LucideIcon,
} from "lucide-react";
import { useResumeStore } from "../../store/resumeStore";
import type { LinkItem } from "../../types/resume";
import { photoImgStyle } from "../../lib/photoFit";

/** Formats "2023-06" → "Jun 2023" */
function fmtDate(value: string) {
  if (!value) return "";
  const [y, m] = value.split("-").map(Number);
  if (!y || !m) return value;
  return new Date(y, m - 1).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

const fontSizes = { small: "13px", medium: "14.5px", large: "16px" } as const;

/** Tiptap's "empty" output is still a non-empty string like "<p></p>" */
function hasText(html: string) {
  return html.replace(/<[^>]*>/g, "").trim().length > 0;
}

/** A4-proportioned live preview ("classic" template).
 *  Resume content is always English — this component is intentionally
 *  not translated. */
export default function ResumePreview() {
  const resume = useResumeStore((s) => s.resume);
  const { personal, experience, education, skills, languages, customization } =
    resume;
  const accent = customization.accentColor;

  return (
    <div
      className="bg-white text-neutral-800 shadow-xl rounded-sm w-full aspect-[210/297] overflow-hidden"
      style={{ fontSize: fontSizes[customization.fontSize] }}
    >
      <div className="h-full p-[7%] flex flex-col gap-5 overflow-hidden">
        {/* ---------- header (centered, icon rows) ---------- */}
        <header className="text-center space-y-2">
          {personal.photoUrl && (
            <div className="size-20 rounded-full overflow-hidden mx-auto">
              <img src={personal.photoUrl} alt="" style={photoImgStyle(personal)} />
            </div>
          )}
          <h1 className="text-[1.9em] font-bold leading-tight">
            {personal.fullName || "Your Name"}
          </h1>
          <p className="text-[1.15em] font-medium" style={{ color: accent }}>
            {personal.jobTitle || "Job Title"}
          </p>
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-[0.8em] text-neutral-600 pt-1">
            {personal.phone && (
              <IconText icon="phone">{personal.phone}</IconText>
            )}
            {personal.email && (
              <IconText icon="mail">{personal.email}</IconText>
            )}
            {personal.location && (
              <IconText icon="pin">{personal.location}</IconText>
            )}
            {personal.nationality && (
              <IconText icon="flag">{personal.nationality}</IconText>
            )}
            {personal.portfolio.map((entry) => (
              <LinkText key={entry.id} icon="briefcase" entry={entry} />
            ))}
            {personal.website.map((entry) => (
              <LinkText key={entry.id} icon="globe" entry={entry} />
            ))}
            {personal.linkedin.map((entry) => (
              <LinkText key={entry.id} icon="linkedin" entry={entry} />
            ))}
            {personal.github.map((entry) => (
              <LinkText key={entry.id} icon="github" entry={entry} />
            ))}
            {personal.gitlab.map((entry) => (
              <LinkText key={entry.id} icon="gitlab" entry={entry} />
            ))}
            {personal.stackoverflow.map((entry) => (
              <LinkText key={entry.id} icon="stackoverflow" entry={entry} />
            ))}
            {personal.telegram.map((entry) => (
              <LinkText key={entry.id} icon="send" entry={entry} />
            ))}
            {personal.passportId && (
              <IconText icon="id">{personal.passportId}</IconText>
            )}
          </div>
        </header>

        {/* ---------- summary ---------- */}
        {hasText(personal.summary) && (
          <Section title="Summary" accent={accent}>
            <div
              className="rte-content text-[0.9em] leading-relaxed"
              dangerouslySetInnerHTML={{ __html: personal.summary }}
            />
          </Section>
        )}

        {/* ---------- experience ---------- */}
        {experience.length > 0 && (
          <Section title="Experience" accent={accent}>
            <div className="space-y-3">
              {experience.map((exp) => (
                <div key={exp.id}>
                  <div className="flex justify-between gap-3 items-baseline">
                    <p className="font-semibold text-[0.95em]">
                      {exp.jobTitle || "Job title"}
                      {exp.company && (
                        <span className="font-normal text-neutral-600">
                          {" "}
                          — {exp.company}
                        </span>
                      )}
                    </p>
                    <p className="text-[0.78em] text-neutral-500 whitespace-nowrap">
                      {fmtDate(exp.startDate)}
                      {(exp.startDate || exp.endDate || exp.current) && " – "}
                      {exp.current ? "Present" : fmtDate(exp.endDate)}
                    </p>
                  </div>
                  {exp.description && (
                    <ul className="mt-1 space-y-0.5">
                      {exp.description
                        .split("\n")
                        .filter(Boolean)
                        .map((line, i) => (
                          <li
                            key={i}
                            className="text-[0.85em] leading-relaxed pl-4 relative before:content-['•'] before:absolute before:left-1"
                            style={
                              { "--tw-content": "•" } as React.CSSProperties
                            }
                          >
                            {line.replace(/^[-•]\s*/, "")}
                          </li>
                        ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* ---------- education ---------- */}
        {education.length > 0 && (
          <Section title="Education" accent={accent}>
            <div className="space-y-2.5">
              {education.map((edu) => (
                <div key={edu.id} className="flex justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[0.95em]">
                      {[edu.degree, edu.field].filter(Boolean).join(" in ") ||
                        "Degree"}
                    </p>
                    <p className="text-[0.85em] text-neutral-600">
                      {edu.school}
                    </p>
                  </div>
                  <p className="text-[0.78em] text-neutral-500 whitespace-nowrap">
                    {fmtDate(edu.startDate)}
                    {(edu.startDate || edu.endDate || edu.current) && " – "}
                    {edu.current ? "Present" : fmtDate(edu.endDate)}
                  </p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* ---------- skills + languages ---------- */}
        {(skills.length > 0 || languages.length > 0) && (
          <div className="grid grid-cols-2 gap-6">
            {skills.length > 0 && (
              <Section title="Skills" accent={accent}>
                <p className="text-[0.85em] leading-relaxed">
                  {skills
                    .map((s) => s.name)
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </Section>
            )}
            {languages.length > 0 && (
              <Section title="Languages" accent={accent}>
                <p className="text-[0.85em] leading-relaxed">
                  {languages
                    .map((l) => (l.name ? `${l.name} (${l.level})` : ""))
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </Section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Section({
  title,
  accent,
  children,
}: {
  title: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2
        className="text-[0.8em] font-bold tracking-[0.18em] uppercase pb-1 mb-2 border-b"
        style={{ color: accent, borderColor: accent }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

const icons: Record<string, LucideIcon> = {
  phone: Phone,
  mail: Mail,
  pin: MapPin,
  flag: Flag,
  briefcase: Briefcase,
  globe: Globe,
  linkedin: Contact,
  github: SquareCode,
  gitlab: GitBranch,
  stackoverflow: MessageCircle,
  send: Send,
  id: IdCard,
};

/** Renders a repeatable link entry — only the title is shown, the URL is
 *  used as the href (or omitted entirely if the entry has no title). */
function LinkText({
  icon,
  entry,
}: {
  icon: keyof typeof icons;
  entry: LinkItem;
}) {
  if (!entry.title.trim()) return null;
  return (
    <IconText icon={icon}>
      {entry.url ? (
        <a href={entry.url} target="_blank" rel="noreferrer" className="hover:underline">
          {entry.title}
        </a>
      ) : (
        entry.title
      )}
    </IconText>
  );
}

function IconText({
  icon,
  children,
}: {
  icon: keyof typeof icons;
  children: React.ReactNode;
}) {
  const Icon = icons[icon];
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon size="1em" strokeWidth={1.8} className="shrink-0" />
      {children}
    </span>
  );
}
