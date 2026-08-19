import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import logo from "../../assets/logo/logo.png";

export default function Footer() {
  const { t } = useTranslation();

  const columns = [
    {
      title: t("footer.product"),
      links: [
        { label: t("nav.templates"), href: "/", scrollTo: "templates" },
        { label: t("nav.features"), href: "/", scrollTo: "features" },
        { label: t("nav.pricing"), href: "/", scrollTo: "pricing" },
      ],
    },
    {
      title: t("footer.company"),
      links: [
        { label: t("footer.aboutUs"), href: "/about" },
        { label: t("footer.contact"), href: "/contact" },
      ],
    },
    {
      title: t("footer.legal"),
      links: [
        { label: t("footer.privacy"), href: "/privacy" },
        { label: t("footer.terms"), href: "/terms" },
        { label: t("footer.refund"), href: "/refund" },
      ],
    },
  ];

  return (
    <footer className="border-t border-line bg-bg">
      <div className="max-w-6xl mx-auto px-4 py-14 grid gap-10 md:grid-cols-[1.5fr_repeat(3,1fr)_auto]">
        {/* brand */}
        <div className="space-y-4">
          <img src={logo} alt="ResuMate" className="h-10 w-auto" />
          <p className="text-sm text-text-secondary max-w-[220px]">
            {t("footer.tagline")}
          </p>
          <p className="text-xs text-text-placeholder">
            © {new Date().getFullYear()} ResuMate
          </p>
        </div>

        {/* link columns */}
        {columns.map((col) => (
          <div key={col.title} className="space-y-3">
            <p className="text-sm font-semibold text-text">{col.title}</p>
            <ul className="space-y-2">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link
                    to={l.href}
                    state={
                      "scrollTo" in l ? { scrollTo: l.scrollTo } : undefined
                    }
                    className="text-sm text-text-secondary hover:text-text transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* socials */}
        <div className="space-y-3">
          <div className="flex gap-3">
            {/* YouTube */}
            <a
              href="https://youtube.com"
              aria-label="YouTube"
              className="size-9 rounded-lg bg-surface-2 inline-flex items-center justify-center text-text-secondary hover:text-brand transition-colors"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.2 31.2 0 0 0 0 12a31.2 31.2 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.2 31.2 0 0 0 24 12a31.2 31.2 0 0 0-.5-5.8ZM9.6 15.6V8.4L15.8 12l-6.2 3.6Z" />
              </svg>
            </a>
            {/* GitHub */}
            <a
              href="https://github.com"
              aria-label="GitHub"
              className="size-9 rounded-lg bg-surface-2 inline-flex items-center justify-center text-text-secondary hover:text-brand transition-colors"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 .5A11.5 11.5 0 0 0 .5 12a11.5 11.5 0 0 0 7.9 10.9c.6.1.8-.2.8-.5v-2c-3.2.7-3.9-1.4-3.9-1.4-.5-1.3-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.4 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.4-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.2 1.2a11 11 0 0 1 5.8 0C17.3 5 18.3 5.3 18.3 5.3c.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.2c0 .3.2.6.8.5A11.5 11.5 0 0 0 23.5 12 11.5 11.5 0 0 0 12 .5Z" />
              </svg>
            </a>
            {/* Instagram */}
            <a
              href="https://instagram.com"
              aria-label="Instagram"
              className="size-9 rounded-lg bg-surface-2 inline-flex items-center justify-center text-text-secondary hover:text-brand transition-colors"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="2.5" y="2.5" width="19" height="19" rx="5" />
                <circle cx="12" cy="12" r="4.5" />
                <circle
                  cx="17.8"
                  cy="6.2"
                  r="1.2"
                  fill="currentColor"
                  stroke="none"
                />
              </svg>
            </a>
          </div>
          <p className="text-xs text-text-placeholder max-w-[180px]">
            {t("footer.follow")}
          </p>
        </div>
      </div>
    </footer>
  );
}
