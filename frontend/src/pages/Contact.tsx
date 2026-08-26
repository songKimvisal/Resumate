import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import { CheckCircle2, Loader2 } from "lucide-react";
import emailjs from "@emailjs/browser";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { Button } from "../components/ui/button";
import { Input, Textarea } from "../components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { useAuth } from "../hooks/UseAuth";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.5, ease: "easeOut" as const },
};

const TOPICS = ["feedback", "general", "billing", "bugs", "feature"] as const;

export default function Contact() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [name, setName] = useState(
    (user?.user_metadata?.full_name as string | undefined) ?? "",
  );
  const [email, setEmail] = useState(user?.email ?? "");
  const [topic, setTopic] = useState<(typeof TOPICS)[number]>("feedback");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<{ name?: string; email?: string; message?: string }>({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendError, setSendError] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const nextErrors: typeof errors = {};
    if (!name.trim()) nextErrors.name = t("contact.form.nameRequired");
    if (!/^\S+@\S+\.\S+$/.test(email.trim()))
      nextErrors.email = t("contact.form.emailRequired");
    if (!message.trim()) nextErrors.message = t("contact.form.messageRequired");

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSending(true);
    setSent(false);
    setSendError(false);
    try {
      await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        {
          name: name.trim(),
          email: email.trim(),
          title: t(`contact.form.topics.${topic}`),
          message: message.trim(),
          time: new Date().toLocaleString(),
        },
        { publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY },
      );
      setSent(true);
      setMessage("");
    } catch {
      setSendError(true);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg text-text">
      <Navbar />

      <section className="max-w-2xl mx-auto px-4 py-20">
        <motion.p
          {...fadeUp}
          className="text-sm font-bold tracking-wide uppercase text-brand"
        >
          {t("contact.label")}
        </motion.p>
        <motion.h1
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.08 }}
          className="mt-2 text-4xl md:text-5xl font-bold"
        >
          {t("contact.title")}
        </motion.h1>
        <motion.p
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.16 }}
          className="mt-3 text-sm text-text-secondary"
        >
          {t("contact.subtitle")}
        </motion.p>

        <motion.form
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.24 }}
          onSubmit={handleSubmit}
          className="mt-10 space-y-5"
        >
          <div className="grid sm:grid-cols-2 gap-5">
            <Input
              id="contact-name"
              name="name"
              autoComplete="name"
              label={t("contact.form.nameLabel")}
              placeholder={t("contact.form.namePlaceholder")}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setSent(false);
              }}
              error={errors.name}
            />
            <Input
              id="contact-email"
              name="email"
              type="email"
              autoComplete="email"
              label={t("contact.form.emailLabel")}
              placeholder={t("contact.form.emailPlaceholder")}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setSent(false);
              }}
              error={errors.email}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="contact-topic" className="text-sm font-medium text-text">
              {t("contact.form.topicLabel")}
            </label>
            <Select
              value={topic}
              onValueChange={(value) => setTopic(value as typeof topic)}
            >
              <SelectTrigger
                id="contact-topic"
                className="w-full h-10! rounded-lg border-line bg-bg text-sm"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TOPICS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {t(`contact.form.topics.${option}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Textarea
            id="contact-message"
            name="message"
            label={t("contact.form.messageLabel")}
            placeholder={t("contact.form.messagePlaceholder")}
            rows={6}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              setSent(false);
            }}
          />
          {errors.message && (
            <p className="text-xs text-destructive -mt-3">{errors.message}</p>
          )}

          <Button type="submit" size="default" disabled={sending} className="w-full">
            {sending && <Loader2 size={15} className="animate-spin" />}
            {sending ? t("contact.form.sending") : t("contact.form.submit")}
          </Button>

          {sendError && (
            <p className="text-sm text-destructive">{t("contact.form.error")}</p>
          )}

          {sent && (
            <p className="flex items-center gap-1.5 text-sm text-success">
              <CheckCircle2 size={15} strokeWidth={2} />
              {t("contact.form.success")}
            </p>
          )}
        </motion.form>
      </section>

      <Footer />
    </div>
  );
}
