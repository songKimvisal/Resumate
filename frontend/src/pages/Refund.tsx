import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.5, ease: "easeOut" as const },
};

const stagger = {
  initial: "hidden",
  whileInView: "show",
  viewport: { once: true, margin: "-80px" },
  variants: {
    hidden: {},
    show: { transition: { staggerChildren: 0.1 } },
  },
};

const staggerItem = {
  variants: {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.45, ease: "easeOut" as const },
    },
  },
};

export default function Refund() {
  const { t } = useTranslation();

  const sections = t("refund.sections", { returnObjects: true }) as {
    title: string;
    body?: string;
    list?: string[];
  }[];

  return (
    <div className="min-h-screen bg-bg text-text">
      <Navbar />

      <section className="max-w-3xl mx-auto px-4 py-20">
        <motion.p
          {...fadeUp}
          className="text-sm font-bold tracking-wide uppercase text-brand"
        >
          {t("refund.label")}
        </motion.p>
        <motion.h1
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.08 }}
          className="mt-2 text-4xl md:text-5xl font-bold"
        >
          {t("refund.title")}
        </motion.h1>
        <motion.p
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.16 }}
          className="mt-3 text-sm font-semibold text-brand"
        >
          {t("refund.lastUpdated")}
        </motion.p>

        <motion.div {...stagger} className="mt-12 space-y-10">
          {sections.map((section, i) => (
            <motion.div key={i} {...staggerItem}>
              <h2 className="text-lg font-bold">{section.title}</h2>
              {section.body && (
                <p className="mt-2 text-sm text-text-secondary leading-relaxed">
                  {section.body}
                </p>
              )}
              {section.list && (
                <ul className="mt-2 space-y-1.5 list-disc pl-5">
                  {section.list.map((item, j) => (
                    <li
                      key={j}
                      className="text-sm text-text-secondary leading-relaxed"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
          ))}
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}
