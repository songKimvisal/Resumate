import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import { Quote } from "lucide-react";
import { supabase } from "../../lib/supabase";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-40px" },
  transition: { duration: 0.5, ease: "easeOut" as const },
};

interface Testimonial {
  id: string;
  name: string;
  message: string;
}

/** Repeat items so a row is wide enough for a smooth infinite scroll. */
function fillRow(items: Testimonial[], minCount = 6): Testimonial[] {
  if (items.length === 0) return items;
  const filled: Testimonial[] = [];
  while (filled.length < minCount) filled.push(...items);
  return filled;
}

function TestimonialQuote({ item }: { item: Testimonial }) {
  return (
    <blockquote className="relative w-64 shrink-0 overflow-hidden rounded-2xl border border-line bg-bg px-5 py-5 sm:w-72 sm:px-6 sm:py-6 md:w-80 dark:border-white/10 dark:bg-[#17171b]">
      <p className="relative z-10 line-clamp-5 text-xs leading-relaxed text-text-secondary sm:line-clamp-6 sm:text-sm dark:text-zinc-300">
        {item.message}
      </p>
      <footer className="relative z-10 mt-4 truncate text-xs font-semibold text-brand sm:mt-5 sm:text-sm">
        {item.name}
      </footer>
      <Quote
        aria-hidden
        className="pointer-events-none absolute -bottom-1 -right-1 text-brand/10 dark:text-white/10"
        size={72}
        fill="currentColor"
        strokeWidth={0}
      />
    </blockquote>
  );
}

function MarqueeRow({
  items,
  reverse = false,
  durationSec,
}: {
  items: Testimonial[];
  reverse?: boolean;
  durationSec: number;
}) {
  return (
    <div className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)] sm:[mask-image:linear-gradient(to_right,transparent,black_4%,black_96%,transparent)]">
      <div
        className={`flex w-max motion-reduce:animate-none ${reverse ? "animate-marquee-reverse" : "animate-marquee"} [@media(hover:hover)]:group-hover/marquee:[animation-play-state:paused]`}
        style={{ animationDuration: `${durationSec}s` }}
      >
        {[0, 1].map((copy) => (
          <div
            key={copy}
            className="flex shrink-0 gap-3 pr-3 sm:gap-4 sm:pr-4"
            aria-hidden={copy === 1}
          >
            {items.map((item, i) => (
              <TestimonialQuote key={`${copy}-${item.id}-${i}`} item={item} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Testimonials() {
  const { t } = useTranslation();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);

  useEffect(() => {
    supabase
      .from("testimonials")
      .select("id, name, message")
      .eq("approved", true)
      .order("created_at", { ascending: false })
      .limit(12)
      .then(({ data }) => setTestimonials(data ?? []));
  }, []);

  if (testimonials.length === 0) return null;

  const rowA = fillRow(testimonials, 6);
  const rowB = fillRow([...testimonials].reverse(), 6);
  const durationA = Math.max(30, rowA.length * 5);
  const durationB = durationA + 6;

  return (
    <section className="overflow-x-clip bg-surface-2 py-16 sm:py-20 md:py-24">
      <div className="mx-auto max-w-6xl px-4">
        <motion.h2
          {...fadeUp}
          className="text-center text-2xl font-bold leading-snug sm:text-3xl md:text-4xl"
        >
          {t("home.testimonials.title")}{" "}
          <span className="text-brand italic">
            {t("home.testimonials.titleAccent")}
          </span>
        </motion.h2>
        <motion.p
          {...fadeUp}
          className="mx-auto mt-3 max-w-xl text-center text-sm text-text-secondary sm:mt-4 sm:text-base"
        >
          {t("home.testimonials.subtitle")}
        </motion.p>

        <motion.div
          {...fadeUp}
          transition={{ duration: 0.5, delay: 0.08, ease: "easeOut" }}
          className="group/marquee mt-10 space-y-3 sm:mt-14 sm:space-y-4"
        >
          <MarqueeRow items={rowA} durationSec={durationA} />
          <MarqueeRow items={rowB} reverse durationSec={durationB} />
        </motion.div>
      </div>
    </section>
  );
}
