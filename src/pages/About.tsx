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
import { useAuth } from "../hooks/UseAuth";
import mascot from "../assets/logo/mascot.png"; 

/* ---------- shared animation presets ---------- */

const fadeUp = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.55, ease: "easeOut" as const },
};

const stagger = {
  initial: "hidden",
  whileInView: "show",
  viewport: { once: true, margin: "-80px" },
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
  const inView = useInView(ref, { once: true, margin: "-60px" });
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
  <DollarSign key="d" size={26} strokeWidth={1.8} />,
  <Globe key="g" size={26} strokeWidth={1.8} />,
  <Sparkles key="s" size={26} strokeWidth={1.8} />,
];

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
    <div className="min-h-screen bg-bg text-text">
      <Navbar />

      {/* ================= HERO ================= */}
      <section className="max-w-3xl mx-auto px-4 pt-20 pb-16 text-center">
        <motion.h1
          {...fadeUp}
          className="text-4xl md:text-5xl font-bold leading-tight"
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
          className="mt-6 text-text-secondary max-w-xl mx-auto"
        >
          {t("about.hero.subtitle")}
        </motion.p>
      </section>

      {/* ================= STORY ================= */}
      <section className="border-t border-line">
        <div className="max-w-2xl mx-auto px-4 py-20">
          <motion.p
            {...fadeUp}
            className="text-sm font-semibold tracking-widest uppercase text-brand"
          >
            {t("about.story.label")}
          </motion.p>
          <motion.h2
            {...fadeUp}
            className="mt-3 text-2xl md:text-3xl font-bold"
          >
            {t("about.story.title")}{" "}
            <span className="text-brand italic">
              {t("about.story.titleAccent")}
            </span>
          </motion.h2>

          <motion.div {...stagger} className="mt-6 space-y-5">
            <motion.p
              {...staggerItem}
              className="text-text-secondary text-sm leading-relaxed"
            >
              {t("about.story.p1")}
            </motion.p>
            <motion.p
              {...staggerItem}
              className="text-text-secondary text-sm leading-relaxed"
            >
              {t("about.story.p2")}
            </motion.p>

            {/* quote slides in from the left */}
            <motion.blockquote
              variants={{
                hidden: { opacity: 0, x: -32 },
                show: {
                  opacity: 1,
                  x: 0,
                  transition: { duration: 0.6, ease: "easeOut" },
                },
              }}
              className="border-l-4 border-brand pl-5 py-1 text-sm font-semibold italic"
            >
              {t("about.story.quote")}
            </motion.blockquote>

            <motion.p
              {...staggerItem}
              className="text-text-secondary text-sm leading-relaxed"
            >
              {t("about.story.p3")}
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* ================= STATS ================= */}
      <section className="bg-surface-2 py-14">
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-10 text-center">
          {stats.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{
                duration: 0.5,
                delay: i * 0.1,
                ease: "easeOut" as const,
              }}
            >
              <p className="text-3xl md:text-4xl font-bold text-brand">
                {"text" in s && s.text ? (
                  s.text
                ) : (
                  <CountUp to={s.to as number} prefix={s.prefix ?? ""} />
                )}
              </p>
              <p className="mt-2 text-sm text-text-secondary">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ================= MISSION ================= */}
      <section className="max-w-4xl mx-auto px-4 py-24">
        <motion.p
          {...fadeUp}
          className="text-sm font-semibold tracking-widest uppercase text-brand"
        >
          {t("about.mission.label")}
        </motion.p>
        <motion.h2
          {...fadeUp}
          className="mt-3 text-2xl md:text-3xl font-bold max-w-2xl"
        >
          {t("about.mission.title")}{" "}
          <span className="text-brand italic">
            {t("about.mission.titleAccent")}
          </span>
        </motion.h2>
        <motion.p
          {...fadeUp}
          className="mt-4 text-text-secondary text-sm max-w-xl"
        >
          {t("about.mission.subtitle")}
        </motion.p>

        <motion.div {...stagger} className="mt-12 grid md:grid-cols-3 gap-6">
          {missionCards.map((card, i) => (
            <motion.div
              key={i}
              {...staggerItem}
              whileHover={{ y: -6 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="rounded-xl border border-brand/60 p-6 space-y-4 bg-bg"
            >
              <span className="text-brand">{missionIcons[i]}</span>
              <h3 className="font-semibold border-b border-line pb-3">
                {card.title}
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                {card.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ================= PRINCIPLES ================= */}
      <section className="bg-surface-2 py-24">
        <div className="max-w-3xl mx-auto px-4">
          <motion.p
            {...fadeUp}
            className="text-sm font-semibold tracking-widest uppercase text-brand"
          >
            {t("about.principles.label")}
          </motion.p>
          <motion.h2
            {...fadeUp}
            className="mt-3 text-2xl md:text-3xl font-bold"
          >
            {t("about.principles.title")}{" "}
            <span className="text-brand italic">
              {t("about.principles.titleAccent")}
            </span>
          </motion.h2>

          <motion.div
            {...stagger}
            className="mt-10 rounded-2xl border border-line bg-bg p-8 md:p-10 space-y-9"
          >
            {principles.map((p, i) => (
              <motion.div key={i} {...staggerItem} className="flex gap-6">
                <span className="text-3xl md:text-4xl font-bold text-brand/30 leading-none">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="font-semibold">{p.title}</h3>
                  <p className="mt-1.5 text-sm text-text-secondary leading-relaxed">
                    {p.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ================= FOUNDER ================= */}
      <section className="max-w-3xl mx-auto px-4 py-24">
        <motion.p
          {...fadeUp}
          className="text-sm font-semibold tracking-widest uppercase text-brand"
        >
          {t("about.founder.label")}
        </motion.p>
        <motion.h2 {...fadeUp} className="mt-3 text-2xl md:text-3xl font-bold">
          {t("about.founder.title")}{" "}
          <span className="text-brand italic">
            {t("about.founder.titleAccent")}
          </span>
        </motion.h2>

        <motion.div
          {...fadeUp}
          className="mt-10 rounded-2xl border border-line p-8 md:p-10 flex flex-col md:flex-row gap-8 items-center"
        >
          <motion.img
            src={mascot}
            alt="ResuMate mascot"
            className="w-36 md:w-44"
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
          <div className="space-y-3 text-center md:text-left">
            <div>
              <h3 className="text-xl font-bold">{t("about.founder.name")}</h3>
              <p className="text-brand text-sm font-semibold">
                {t("about.founder.role")}
              </p>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">
              {t("about.founder.bio")}
            </p>
          </div>
        </motion.div>
      </section>

      {/* ================= CTA ================= */}
      <section className="max-w-2xl mx-auto px-4 pb-24 text-center">
        <motion.h2 {...fadeUp} className="text-3xl md:text-4xl font-bold">
          {t("about.cta.title")}
          <br />
          <span className="text-brand italic">
            {t("about.cta.titleAccent")}
          </span>
        </motion.h2>
        <motion.p
          {...fadeUp}
          className="mt-4 text-text-secondary text-sm max-w-md mx-auto"
        >
          {t("about.cta.subtitle")}
        </motion.p>
        <motion.div
          {...fadeUp}
          className="mt-8 flex flex-wrap justify-center gap-3"
        >
          {user ? (
            <Link to="/dashboard">
              <Button size="lg">{t("home.hero.ctaDashboard")}</Button>
            </Link>
          ) : (
            <>
              <Link to="/login">
                <Button size="lg">{t("about.cta.primary")}</Button>
              </Link>
              <Link to="/" state={{ scrollTo: "templates" }}>
                <Button size="lg" variant="outline">
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
