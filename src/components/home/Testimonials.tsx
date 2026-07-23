import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import { CheckCircle2, Loader2, Quote } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { Button } from "../ui/button";
import { Input, Textarea } from "../ui/Input";
import { useAuth } from "../../hooks/UseAuth";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.5, ease: "easeOut" as const },
};

interface Testimonial {
  id: string;
  name: string;
  message: string;
}

export default function Testimonials() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);

  useEffect(() => {
    supabase
      .from("testimonials")
      .select("id, name, message")
      .eq("approved", true)
      .order("created_at", { ascending: false })
      .limit(9)
      .then(({ data }) => setTestimonials(data ?? []));
  }, []);

  const [name, setName] = useState(
    (user?.user_metadata?.full_name as string | undefined) ?? "",
  );
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<{ name?: string; message?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const nextErrors: typeof errors = {};
    if (!name.trim()) nextErrors.name = t("home.testimonials.form.nameRequired");
    if (!message.trim())
      nextErrors.message = t("home.testimonials.form.messageRequired");

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    setSubmitted(false);
    setSubmitError(false);
    const { error } = await supabase
      .from("testimonials")
      .insert({ name: name.trim(), message: message.trim() });
    setSubmitting(false);
    if (error) {
      setSubmitError(true);
      return;
    }
    setSubmitted(true);
    setMessage("");
  };

  return (
    <section className="max-w-6xl mx-auto px-4 py-24">
      <motion.h2
        {...fadeUp}
        className="text-3xl md:text-4xl font-bold text-center"
      >
        {t("home.testimonials.title")}{" "}
        <span className="text-brand italic">
          {t("home.testimonials.titleAccent")}
        </span>
      </motion.h2>
      <motion.p {...fadeUp} className="mt-4 text-text-secondary text-center">
        {t("home.testimonials.subtitle")}
      </motion.p>

      {testimonials.length > 0 && (
        <div className="mt-14 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
          <div
            className="flex w-max gap-6 animate-marquee hover:[animation-play-state:paused]"
            style={{ animationDuration: `${Math.max(20, testimonials.length * 6)}s` }}
          >
            {[...testimonials, ...testimonials].map((item, i) => (
              <div
                key={`${item.id}-${i}`}
                className="w-80 shrink-0 rounded-2xl border border-line bg-surface-2 p-6 pb-14 relative overflow-hidden"
              >
                <p className="relative z-10 text-sm text-text leading-relaxed">
                  {item.message}
                </p>
                <p className="relative z-10 mt-4 text-sm font-semibold text-brand">
                  {item.name}
                </p>
                <Quote
                  className="absolute -bottom-2 -right-2 text-brand/10"
                  size={88}
                  fill="currentColor"
                  strokeWidth={0}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {user && (
        <motion.form
          {...fadeUp}
          onSubmit={handleSubmit}
          className="mt-14 max-w-lg mx-auto rounded-2xl border border-line p-6 space-y-4"
        >
          <h3 className="font-semibold text-center">
            {t("home.testimonials.form.title")}
          </h3>
          <Input
            label={t("home.testimonials.form.nameLabel")}
            placeholder={t("home.testimonials.form.namePlaceholder")}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setSubmitted(false);
            }}
            error={errors.name}
          />
          <Textarea
            label={t("home.testimonials.form.messageLabel")}
            placeholder={t("home.testimonials.form.messagePlaceholder")}
            rows={4}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              setSubmitted(false);
            }}
          />
          {errors.message && (
            <p className="text-xs text-destructive -mt-2">{errors.message}</p>
          )}
          <Button
            type="submit"
            size="default"
            disabled={submitting}
            className="w-full"
          >
            {submitting && <Loader2 size={15} className="animate-spin" />}
            {submitting
              ? t("home.testimonials.form.sending")
              : t("home.testimonials.form.submit")}
          </Button>
          {submitError && (
            <p className="text-sm text-destructive text-center">
              {t("home.testimonials.form.error")}
            </p>
          )}
          {submitted && (
            <p className="flex items-center justify-center gap-1.5 text-sm text-success">
              <CheckCircle2 size={15} strokeWidth={2} />
              {t("home.testimonials.form.success")}
            </p>
          )}
        </motion.form>
      )}
    </section>
  );
}
