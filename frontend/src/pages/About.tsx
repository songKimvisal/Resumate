import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  motion,
  useInView,
  useMotionValue,
  useTransform,
  animate,
} from "motion/react";
import { DollarSign, Globe, Sparkles } from "lucide-react";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { Button } from "../components/ui/button";
import { cn } from "../lib/utils";
import { useAuth } from "../hooks/UseAuth";
import mascot from "../assets/logo/mascot.png";

/* ---------- shared animation presets ---------- */

const fadeUp = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-40px" },
  transition: { duration: 0.55, ease: "easeOut" as const },
};

const stagger = {
  initial: "hidden",
  whileInView: "show",
  viewport: { once: true, margin: "-40px" },
  variants: {
    hidden: {},
    show: { transition: { staggerChildren: 0.12 } },
  },
};

const staggerItem = {
  variants: {
    hidden: { opacity: 0, y: 24 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" as const },
    },
  },
};
/* ---------- animated number for the stats strip ---------- */

function CountUp({
  to,
  prefix = "",
  suffix = "",
}: {
  to: number;
  prefix?: string;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const value = useMotionValue(0);
  const rounded = useTransform(
    value,
    (v) => `${prefix}${Math.round(v)}${suffix}`,
  );

  useEffect(() => {
    if (inView) {
      const controls = animate(value, to, { duration: 1.2, ease: "easeOut" });
      return controls.stop;
    }
  }, [inView, to, value]);

  return <motion.span ref={ref}>{rounded}</motion.span>;
}

/* ---------- icons for the mission cards ---------- */

const missionIcons = [
  <DollarSign key="d" size={24} strokeWidth={1.8} />,
  <Globe key="g" size={24} strokeWidth={1.8} />,
  <Sparkles key="s" size={24} strokeWidth={1.8} />,
];

const sectionLabelClass =
  "break-words text-[11px] font-semibold uppercase tracking-[0.12em] text-brand sm:text-sm sm:tracking-widest";
const sectionHeadingClass =
  "mt-2.5 text-balance text-xl font-bold leading-tight min-[375px]:text-2xl sm:mt-3 md:text-3xl";
const bodyClass =
  "text-pretty text-[13px] leading-relaxed text-text-secondary min-[375px]:text-sm";
const pagePad = "px-4 min-[375px]:px-5";

export default function About() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const missionCards = t("about.mission.cards", { returnObjects: true }) as {
    title: string;
    desc: string;
  }[];
  const principles = t("about.principles.items", { returnObjects: true }) as {
    title: string;
    desc: string;
  }[];
  const stats = [
    { to: 0, prefix: "$", label: t("about.stats.free") },
    { to: 11, label: t("about.stats.features") },
    { to: 10, label: t("about.stats.templates") },
    { text: "EN/KH", label: t("about.stats.bilingual") },
  ];

  return (
    <div className="min-h-screen overflow-x-clip bg-bg text-text">
      <Navbar />

      {/* ================= HERO ================= */}
      <section
        className={cn(
          "mx-auto max-w-3xl text-center",
          pagePad,
          "pt-12 pb-10 sm:pt-20 sm:pb-16",
        )}
      >
        <motion.h1
          {...fadeUp}
          className="text-balance text-[1.75rem] font-bold leading-[1.2] min-[375px]:text-3xl sm:text-4xl md:text-5xl md:leading-tight"
        >
          {t("about.hero.title")}
          <br />
          <span className="text-brand italic">
            {t("about.hero.titleAccent")}
          </span>
        </motion.h1>
        <motion.p
          {...fadeUp}
          transition={{ duration: 0.55, delay: 0.12 }}
          className={cn("mx-auto mt-4 max-w-xl sm:mt-6", bodyClass)}
        >
          {t("about.hero.subtitle")}
        </motion.p>
      </section>

      {/* ================= STORY ================= */}
      <section className="border-t border-line">
        <div className={cn("mx-auto max-w-2xl py-12 sm:py-20", pagePad)}>
          <motion.p {...fadeUp} className={sectionLabelClass}>
            {t("about.story.label")}
          </motion.p>
          <motion.h2 {...fadeUp} className={sectionHeadingClass}>
            {t("about.story.title")}{" "}
            <span className="text-brand italic">
              {t("about.story.titleAccent")}
            </span>
          </motion.h2>

          <motion.div {...stagger} className="mt-5 space-y-4 sm:mt-6 sm:space-y-5">
            <motion.p {...staggerItem} className={bodyClass}>
              {t("about.story.p1")}
            </motion.p>
            <motion.p {...staggerItem} className={bodyClass}>
              {t("about.story.p2")}
            </motion.p>

            <motion.blockquote
              variants={{
                hidden: { opacity: 0, x: -16 },
                show: {
                  opacity: 1,
                  x: 0,
                  transition: { duration: 0.6, ease: "easeOut" },
                },
              }}
              className="border-l-[3px] border-brand py-1 pl-3.5 text-pretty text-[13px] font-semibold italic leading-relaxed min-[375px]:pl-5 min-[375px]:text-sm sm:border-l-4"
            >
              {t("about.story.quote")}
            </motion.blockquote>

            <motion.p {...staggerItem} className={bodyClass}>
              {t("about.story.p3")}
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* ================= STATS ================= */}
      <section className="bg-surface-2 py-10 sm:py-14">
        <div
          className={cn(
            "mx-auto grid max-w-4xl grid-cols-2 gap-x-3 gap-y-7 text-center md:grid-cols-4 md:gap-10",
            pagePad,
          )}
        >
          {stats.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{
                duration: 0.5,
                delay: i * 0.1,
                ease: "easeOut" as const,
              }}
              className="min-w-0 px-0.5"
            >
              <p className="text-2xl font-bold tracking-tight text-brand min-[375px]:text-3xl md:text-4xl">
                {"text" in s && s.text ? (
                  s.text
                ) : (
                  <CountUp to={s.to as number} prefix={s.prefix ?? ""} />
                )}
              </p>
              <p className="mt-1.5 text-pretty text-[11px] leading-snug text-text-secondary min-[375px]:text-xs sm:mt-2 sm:text-sm">
                {s.label}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ================= MISSION ================= */}
      <section className={cn("mx-auto max-w-4xl py-14 sm:py-24", pagePad)}>
        <motion.p {...fadeUp} className={sectionLabelClass}>
          {t("about.mission.label")}
        </motion.p>
        <motion.h2 {...fadeUp} className={cn(sectionHeadingClass, "max-w-2xl")}>
          {t("about.mission.title")}{" "}
          <span className="text-brand italic">
            {t("about.mission.titleAccent")}
          </span>
        </motion.h2>
        <motion.p {...fadeUp} className={cn("mt-3 max-w-xl sm:mt-4", bodyClass)}>
          {t("about.mission.subtitle")}
        </motion.p>

        <motion.div
          {...stagger}
          className="mt-8 grid gap-3.5 sm:mt-12 sm:gap-6 md:grid-cols-3"
        >
          {missionCards.map((card, i) => (
            <motion.div
              key={i}
              {...staggerItem}
              whileHover={{ y: -6 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="space-y-3 rounded-xl border border-brand/60 bg-bg p-4 min-[375px]:p-5 sm:space-y-4 sm:p-6"
            >
              <span className="text-brand">{missionIcons[i]}</span>
              <h3 className="border-b border-line pb-2.5 text-[15px] font-semibold leading-snug sm:pb-3 sm:text-base mt-2.5">
                {card.title}
              </h3>
              <p className={bodyClass}>{card.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ================= PRINCIPLES ================= */}
      <section className="bg-surface-2 py-14 sm:py-24">
        <div className={cn("mx-auto max-w-3xl", pagePad)}>
          <motion.p {...fadeUp} className={sectionLabelClass}>
            {t("about.principles.label")}
          </motion.p>
          <motion.h2 {...fadeUp} className={sectionHeadingClass}>
            {t("about.principles.title")}{" "}
            <span className="text-brand italic">
              {t("about.principles.titleAccent")}
            </span>
          </motion.h2>

          <motion.div
            {...stagger}
            className="mt-7 space-y-7 rounded-xl border border-line bg-bg p-4 min-[375px]:p-5 sm:mt-10 sm:space-y-9 sm:rounded-2xl sm:p-8 md:p-10"
          >
            {principles.map((p, i) => (
              <motion.div
                key={i}
                {...staggerItem}
                className="flex gap-3.5 sm:gap-6"
              >
                <span className="shrink-0 text-2xl font-bold leading-none text-brand/30 sm:text-3xl md:text-4xl">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <h3 className="text-[15px] font-semibold leading-snug sm:text-base">
                    {p.title}
                  </h3>
                  <p className={cn("mt-1.5", bodyClass)}>{p.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ================= FOUNDER ================= */}
      <section className={cn("mx-auto max-w-3xl py-14 sm:py-24", pagePad)}>
        <motion.p {...fadeUp} className={sectionLabelClass}>
          {t("about.founder.label")}
        </motion.p>
        <motion.h2 {...fadeUp} className={sectionHeadingClass}>
          {t("about.founder.title")}{" "}
          <span className="text-brand italic">
            {t("about.founder.titleAccent")}
          </span>
        </motion.h2>

        <motion.div
          {...fadeUp}
          className="mt-7 flex flex-col items-center gap-5 rounded-xl border border-line p-4 min-[375px]:p-5 sm:mt-10 sm:gap-8 sm:rounded-2xl sm:p-8 md:flex-row md:p-10"
        >
          <motion.img
            src={mascot}
            alt="ResuMate mascot"
            className="w-24 shrink-0 min-[375px]:w-28 sm:w-36 md:w-44"
            initial={{ opacity: 0, scale: 0.8, rotate: -6 }}
            whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
            viewport={{ once: true }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 16,
              delay: 0.15,
            }}
          />
          <div className="min-w-0 space-y-2.5 text-center sm:space-y-3 md:text-left">
            <div>
              <h3 className="text-lg font-bold sm:text-xl">
                {t("about.founder.name")}
              </h3>
              <p className="text-sm font-semibold text-brand">
                {t("about.founder.role")}
              </p>
            </div>
            <p className={bodyClass}>{t("about.founder.bio")}</p>
          </div>
        </motion.div>
      </section>

      {/* ================= CTA ================= */}
      <section
        className={cn(
          "mx-auto max-w-2xl pb-16 text-center sm:pb-24",
          pagePad,
        )}
      >
        <motion.h2
          {...fadeUp}
          className="text-balance text-2xl font-bold leading-tight sm:text-3xl md:text-4xl"
        >
          {t("about.cta.title")}
          <br />
          <span className="text-brand italic">
            {t("about.cta.titleAccent")}
          </span>
        </motion.h2>
        <motion.p
          {...fadeUp}
          className={cn("mx-auto mt-3 max-w-md sm:mt-4", bodyClass)}
        >
          {t("about.cta.subtitle")}
        </motion.p>
        <motion.div
          {...fadeUp}
          className="mx-auto mt-7 flex w-full max-w-sm flex-row justify-center gap-2 sm:mt-8 sm:max-w-none sm:gap-3"
        >
          {user ? (
            <Link to="/dashboard" className="w-full sm:w-auto">
              <Button size="default" className="w-full sm:w-auto">
                {t("home.hero.ctaDashboard")}
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/login" className="min-w-0 flex-1 sm:flex-none sm:w-auto">
                <Button
                  size="default"
                  className="w-full px-3 text-sm sm:w-auto sm:px-4 sm:text-base"
                >
                  {t("about.cta.primary")}
                </Button>
              </Link>
              <Link
                to="/"
                state={{ scrollTo: "templates" }}
                className="min-w-0 flex-1 sm:flex-none sm:w-auto"
              >
                <Button
                  size="default"
                  variant="outline"
                  className="w-full px-3 text-sm sm:w-auto sm:px-4 sm:text-base"
                >
                  {t("about.cta.secondary")}
                </Button>
              </Link>
            </>
          )}
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}
