import { Link, useLocation, useNavigate } from "react-router-dom";
import { Fragment, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import Testimonials from "../components/home/Testimonials";
import Pricing from "../components/home/Pricing";
import { Button } from "../components/ui/button";
import { useAuth } from "../hooks/UseAuth";
import {
  consumeStayOnHome,
  hasAppEntered,
  markAppEntered,
} from "../lib/session";
import ScaledResumePreview from "../components/resume/ScaledResumePreview";
import { DEMO_RESUME } from "../data/demoResume";
import { TEMPLATE_PRESETS, type TemplatePreset } from "../data/templates";
const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.5 },
};

const HERO_TEMPLATE_IDS = [
  "banking-classic",
  "tech-sidebar",
  "designer-sidebar",
  "hospitality-classic",
];
const HERO_TEMPLATES = HERO_TEMPLATE_IDS.map((id) =>
  TEMPLATE_PRESETS.find((p) => p.id === id),
).filter((p): p is TemplatePreset => !!p);
const HERO_CARDS = HERO_TEMPLATES.map((preset) => ({
  preset,
  resume: { ...DEMO_RESUME, customization: preset.customization },
}));

export default function Home() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (hasAppEntered()) return;

    const stayOnHome = consumeStayOnHome();
    markAppEntered();
    if (user && !stayOnHome) {
      navigate("/dashboard", { replace: true });
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    const id = (location.state as { scrollTo?: string } | null)?.scrollTo;
    if (id) {
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
        window.history.replaceState({}, "");
      }, 100);
    }
  }, [location.state]);
  const { t } = useTranslation();
  const industries = t("home.industries", { returnObjects: true }) as string[];
  const features = t("home.features.items", { returnObjects: true }) as {
    title: string;
    desc: string;
  }[];
  const phase1 = t("home.steps.phase1.items", { returnObjects: true }) as {
    title: string;
    desc: string;
  }[];
  const phase2 = t("home.steps.phase2.items", { returnObjects: true }) as {
    title: string;
    desc: string;
  }[];
  return (
    <div className="min-h-screen bg-bg text-text overflow-x-clip">
      <Navbar />

      {/* ================= HERO ================= */}
      <section className="mx-auto max-w-6xl px-4 pt-14 pb-8 text-center sm:pt-20 sm:pb-10">
        <motion.h1
          {...fadeUp}
          className="mx-auto max-w-3xl text-balance text-4xl font-bold leading-tight md:text-5xl"
        >
          {t("home.hero.title")}{" "}
          <span className="text-brand italic">
            {t("home.hero.titleAccent")}
          </span>
          {t("home.hero.titleEnd")}
        </motion.h1>

        <motion.p
          {...fadeUp}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mx-auto mt-6 max-w-xl text-pretty text-text-secondary"
        >
          {t("home.hero.subtitle")}
        </motion.p>

        <motion.div className="mt-8 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          {user ? (
            <>
              <Link to="/dashboard">
                <Button>{t("home.hero.ctaDashboard")}</Button>
              </Link>
              <Link to="/marketplace">
                <Button variant="outline">{t("home.hero.ctaSecondary")}</Button>
              </Link>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button>{t("home.hero.ctaPrimary")}</Button>
              </Link>
              <Link to="/marketplace">
                <Button variant="outline">{t("home.hero.ctaSecondary")}</Button>
              </Link>
            </>
          )}
        </motion.div>

        <div
          id="templates"
          className="mt-14 flex items-end justify-center -space-x-10 pb-6 sm:mt-16 sm:-space-x-16 lg:-space-x-20"
        >
          {HERO_CARDS.map(({ preset, resume }, i) => {
            const middle = (HERO_CARDS.length - 1) / 2;
            const offset = i - middle;
            return (
              <div
                key={preset.id}
                style={{
                  transform: `rotate(${offset * 4}deg) translateY(${Math.abs(offset) * 16}px)`,
                  zIndex: 10 - Math.abs(offset),
                }}
                className="w-[6.75rem] shrink-0 sm:w-44 lg:w-56"
              >
                <ScaledResumePreview
                  resume={resume}
                  className="shadow-lg ring-1 ring-black/5"
                />
              </div>
            );
          })}
        </div>
      </section>

      {/* ================= INDUSTRIES ================= */}
      <section className="border-y border-line py-8 sm:py-10">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <p className="text-xs font-semibold tracking-[0.18em] text-text-secondary uppercase sm:text-sm sm:tracking-widest">
            {t("home.industriesTitle")}
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 sm:gap-x-4">
            {industries.map((name, i) => (
              <Fragment key={name || `industry-${i}`}>
                {i > 0 && (
                  <span className="size-1 rounded-full bg-brand/50" />
                )}
                <span className="text-sm font-medium text-text">{name}</span>
              </Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* ================= FEATURES ================= */}
      <section id="features" className="max-w-6xl mx-auto px-4 py-24">
        <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <motion.h2
            {...fadeUp}
            className="max-w-md text-3xl md:text-4xl font-bold text-balance"
          >
            {t("home.features.title")}{" "}
            <span className="text-brand italic">
              {t("home.features.titleAccent")}
            </span>
          </motion.h2>
          <motion.p
            {...fadeUp}
            className="max-w-xs text-text-secondary md:text-right"
          >
            {t("home.features.subtitle")}
          </motion.p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 border-t border-l border-line">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              {...fadeUp}
              transition={{ duration: 0.4, delay: (i % 4) * 0.05 }}
              className={`border-b border-r border-line p-6 space-y-3 hover:bg-surface transition-colors ${
                i === features.length - 1 ? "sm:col-span-2" : ""
              }`}
            >
              <p className="text-sm font-semibold text-brand">
                {String(i + 1).padStart(2, "0")}
              </p>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="text-sm text-text-secondary">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ================= STEPS ================= */}
      <section className="bg-surface-2 py-24">
        <div className="max-w-6xl mx-auto px-4">
          <motion.h2 {...fadeUp} className="text-3xl md:text-4xl font-bold">
            {t("home.steps.title")}
            <br />
            <span className="text-brand italic">
              {t("home.steps.titleAccent")}
            </span>
          </motion.h2>
          <motion.p {...fadeUp} className="mt-4 text-text-secondary max-w-md">
            {t("home.steps.subtitle")}
          </motion.p>

          <div className="mt-14 grid md:grid-cols-2 gap-16 ">
            {[
              {
                badge: t("home.steps.phase1.badge"),
                label: t("home.steps.phase1.label"),
                items: phase1,
                start: 1,
              },
              {
                badge: t("home.steps.phase2.badge"),
                label: t("home.steps.phase2.label"),
                items: phase2,
                start: 1 + phase1.length,
              },
            ].map((phase) => (
              <div key={phase.badge}>
                <div className="flex items-center gap-3 mb-8">
                  <span className="bg-brand text-white text-xs font-semibold px-3 py-1 rounded-md">
                    {phase.badge}
                  </span>
                  <span className="font-medium">{phase.label}</span>
                </div>

                <div className="space-y-0">
                  {phase.items.map((step, i) => (
                    <motion.div
                      key={step.title}
                      {...fadeUp}
                      className="flex gap-5"
                    >
                      {/* number + connector line */}
                      <div className="flex flex-col items-center">
                        <span className="size-9 shrink-0 rounded-full border-2 border-brand text-brand font-semibold inline-flex items-center justify-center text-sm">
                          {phase.start + i}
                        </span>
                        {i < phase.items.length - 1 && (
                          <span className="w-0.5 flex-1 bg-brand/60 my-1" />
                        )}
                      </div>
                      <div className="pb-10">
                        <h3 className="font-semibold">{step.title}</h3>
                        <p className="text-sm text-text-secondary mt-1 max-w-xs">
                          {step.desc}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Pricing />

      {/* ================= TESTIMONIALS ================= */}
      <Testimonials />

      {/* ================= FINAL CTA ================= */}
      <section className="border-t border-line py-24 text-center px-4">
        <motion.h2 {...fadeUp} className="text-3xl md:text-4xl font-bold">
          {t("home.cta.title")}
          <br />
          <span className="text-brand italic">{t("home.cta.titleAccent")}</span>
        </motion.h2>
        <motion.p
          {...fadeUp}
          className="mt-4 text-text-secondary max-w-md mx-auto"
        >
          {t("home.cta.subtitle")}
        </motion.p>
        <motion.div
          {...fadeUp}
          className="mt-8 flex flex-wrap items-center justify-center gap-2 sm:gap-3"
        >
          <Link to="/marketplace">
            <Button>{t("home.cta.primary")}</Button>
          </Link>
          <a href="#features">
            <Button variant="outline">{t("home.cta.secondary")}</Button>
          </a>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}
