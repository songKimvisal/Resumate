import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import { CircleCheck, Leaf, Crown, Zap } from "lucide-react";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { Button } from "../components/ui/button";
import { useAuth } from "../hooks/UseAuth";
import tpl1 from "../assets/templates/template-1.png";
import tpl2 from "../assets/templates/template-2.png";
import tpl3 from "../assets/templates/template-3.png";
import tpl4 from "../assets/templates/template-4.png";
import tpl5 from "../assets/templates/template-5.png";
import { useEffect } from "react";
const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.5 },
};

export default function Home() {
  const location = useLocation();

  useEffect(() => {
    const id = (location.state as { scrollTo?: string } | null)?.scrollTo;
    if (id) {
      // wait one frame so the sections are rendered, then scroll
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
        // clear the state so refresh/back doesn't re-scroll
        window.history.replaceState({}, "");
      }, 100);
    }
  }, [location.state]);
  const { t } = useTranslation();
  const { user } = useAuth();
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
  const plans = t("home.pricing.plans", { returnObjects: true }) as {
    name: string;
    price: string;
    tagline: string;
    includesLabel: string;
    features: string[];
    cta: string;
    popular?: boolean;
  }[];

  const templates = [tpl1, tpl2, tpl3, tpl4, tpl5];

  return (
    <div className="min-h-screen bg-bg text-text overflow-x-clip">
      <Navbar />

      {/* ================= HERO ================= */}
      <section className="max-w-6xl mx-auto px-4 pt-20 pb-10 text-center">
        <motion.h1
          {...fadeUp}
          className="text-4xl md:text-6xl font-bold leading-tight max-w-3xl mx-auto"
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
          className="mt-6 text-text-secondary max-w-xl mx-auto"
        >
          {t("home.hero.subtitle")}
        </motion.p>

        <motion.div className="mt-8 flex flex-wrap justify-center gap-3">
          {user ? (
            // ---------- logged IN: one button ----------
            <Link to="/dashboard">
              <Button size="lg">{t("home.hero.ctaDashboard")}</Button>
            </Link>
          ) : (
            // ---------- logged OUT: the original two ----------
            <>
              <Link to="/login">
                <Button size="lg">{t("home.hero.ctaPrimary")}</Button>
              </Link>
              <a href="#templates">
                <Button size="lg" variant="outline">
                  {t("home.hero.ctaSecondary")}
                </Button>
              </a>
            </>
          )}
        </motion.div>

        {/* template fan */}
        <motion.div
          id="templates"
          {...fadeUp}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-14 flex justify-center items-end -space-x-10 sm:-space-x-16 lg:-space-x-20"
        >
          {templates.map((src, i) => {
            const middle = Math.floor(templates.length / 2);
            const offset = i - middle; // -2..2
            return (
              <img
                key={i}
                src={src}
                alt={`Resume template ${i + 1}`}
                loading="lazy"
                style={{
                  transform: `rotate(${offset * 2}deg) translateY(${Math.abs(offset) * 14}px)`,
                  zIndex: 10 - Math.abs(offset),
                }}
                className={`w-24 sm:w-40 lg:w-64 rounded-lg border border-line shadow-xl bg-white ${
                  offset === 0 ? "relative" : ""
                }`}
              />
            );
          })}
        </motion.div>
      </section>

      {/* ================= INDUSTRIES ================= */}
      <section className="border-y border-line py-10">
        <div className="max-w-6xl mx-auto px-4 text-center space-y-6">
          <p className="text-sm font-semibold tracking-widest uppercase text-text-secondary">
            {t("home.industriesTitle")}
          </p>
          <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-3">
            {industries.map((name, i) => (
              <span
                key={name}
                className="flex items-center gap-8 text-sm font-medium text-text"
              >
                {i > 0 && (
                  <span className="size-1.5 rounded-full bg-brand/40" />
                )}
                {name}
              </span>
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

      {/* ================= PRICING ================= */}
      <section id="pricing" className="max-w-6xl mx-auto px-4 py-24">
        <motion.h2
          {...fadeUp}
          className="text-3xl md:text-4xl font-bold text-center"
        >
          {t("home.pricing.title")}{" "}
          <span className="text-brand italic">
            {t("home.pricing.titleAccent")}
          </span>
        </motion.h2>
        <motion.p {...fadeUp} className="mt-4 text-text-secondary text-center">
          {t("home.pricing.subtitle")}
        </motion.p>

        <div className="mt-14 grid md:grid-cols-3 gap-6 items-start">
          {plans.map((plan) => (
            <motion.div
              key={plan.name}
              {...fadeUp}
              className={`rounded-2xl p-8 space-y-6 ${
                plan.popular
                  ? "border-2 border-brand shadow-lg"
                  : "border border-line bg-surface"
              }`}
            >
              <div className="space-y-2">
                <div className="h-7 flex items-center">
                  {plan.popular ? (
                    <span className="inline-flex items-center gap-1.5 bg-brand text-white text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap">
                      {t("home.pricing.mostPopular")}
                      <Zap size={14} fill="white" />
                    </span>
                  ) : (
                    <>
                      {plan.name === "Free" && <Leaf size={22} />}
                      {plan.name === "Pro" && <Crown size={22} />}
                    </>
                  )}
                </div>
                <p className="text-sm font-bold tracking-wide uppercase">
                  {plan.name}
                </p>
                <p>
                  <span className="text-4xl font-bold">${plan.price}</span>
                  <span className="text-text-secondary text-sm">
                    /{t("home.pricing.month")}
                  </span>
                </p>
                <p className="text-sm text-text-secondary">{plan.tagline}</p>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-semibold tracking-widest uppercase text-text-secondary">
                  {plan.includesLabel}
                </p>
                <ul className="space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex gap-2.5 text-sm">
                      <CircleCheck
                        className="text-brand shrink-0 mt-0.5"
                        size={16}
                        strokeWidth={2.5}
                      />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              <Link to="/login" className="block">
                <Button
                  className="w-full"
                  variant={plan.popular ? "default" : "outline"}
                >
                  {plan.cta}
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

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
          className="mt-8 flex flex-wrap justify-center gap-3"
        >
          <Link to="/login">
            <Button size="lg">{t("home.cta.primary")}</Button>
          </Link>
          <a href="#features">
            <Button size="lg" variant="outline">
              {t("home.cta.secondary")}
            </Button>
          </a>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}
