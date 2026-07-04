import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../hooks/UseTheme";
import { useAuth } from "../../hooks/UseAuth";
import { Button } from "../ui/button";
import logo from "../../assets/logo/logo.png";

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close the dropdown when clicking outside of it
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const toggleLanguage = () =>
    i18n.changeLanguage(i18n.language === "en" ? "km" : "en");

  /** Scroll to a homepage section. Works from any page:
   *  on "/" it scrolls directly; elsewhere it navigates home first. */
  const scrollToSection = (id: string) => {
    if (location.pathname === "/") {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate("/", { state: { scrollTo: id } });
    }
  };

  const sectionLinks = [
    { id: "templates", label: t("nav.templates") },
    { id: "features", label: t("nav.features") },
    { id: "pricing", label: t("nav.pricing") },
  ];

  // Google account info (from Supabase user metadata)
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;
  const fullName =
    (user?.user_metadata?.full_name as string | undefined) ?? user?.email ?? "";

  return (
    <header className="sticky top-0 z-50 bg-bg/80 backdrop-blur border-b border-line">
      <nav className="max-w-6xl mx-auto flex items-center justify-between px-4 h-16">
        <Link to="/">
          <img src={logo} alt="ResuMate" className="h-9 w-auto" />
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {sectionLinks.map((l) => (
            <button
              key={l.id}
              onClick={() => scrollToSection(l.id)}
              className="text-sm text-text-secondary hover:text-text transition-colors"
            >
              {l.label}
            </button>
          ))}
          <Link
            to="/about"
            className="text-sm text-text-secondary hover:text-text transition-colors"
          >
            {t("nav.about")}
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {/* language toggle */}
          <button
            onClick={toggleLanguage}
            className="size-9 rounded-lg text-text-secondary hover:bg-surface-2 hover:text-text transition-colors text-sm font-medium"
            aria-label="Switch language"
          >
            {i18n.language === "en" ? "ខ្មែរ" : "EN"}
          </button>

          {/* theme toggle */}
          <button
            onClick={toggleTheme}
            className="size-9 rounded-lg text-text-secondary hover:bg-surface-2 hover:text-text transition-colors inline-flex items-center justify-center"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              /* sun */
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
              </svg>
            ) : (
              /* moon */
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
              </svg>
            )}
          </button>

          {user ? (
            /* ============ user avatar + dropdown ============ */
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center rounded-full ring-2 ring-transparent hover:ring-brand/40 transition-shadow"
                aria-label="Account menu"
                aria-expanded={menuOpen}
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={fullName}
                    referrerPolicy="no-referrer"
                    className="size-9 rounded-full object-cover"
                  />
                ) : (
                  <span className="size-9 rounded-full bg-brand text-white inline-flex items-center justify-center text-sm font-semibold">
                    {fullName.charAt(0).toUpperCase()}
                  </span>
                )}
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-60 rounded-xl border border-line bg-bg shadow-lg overflow-hidden">
                  {/* header */}
                  <div className="px-4 py-3 border-b border-line">
                    <p className="text-sm font-medium text-text truncate">
                      {fullName}
                    </p>
                    <p className="text-xs text-text-secondary truncate">
                      {user.email}
                    </p>
                  </div>

                  {/* links */}
                  <div className="py-1">
                    <Link
                      to="/dashboard"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-text hover:bg-surface-2 transition-colors"
                    >
                      {t("nav.dashboard")}
                    </Link>
                    <Link
                      to="/settings"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-text hover:bg-surface-2 transition-colors"
                    >
                      {t("nav.settings")}
                    </Link>
                  </div>

                  {/* logout */}
                  <div className="py-1 border-t border-line">
                    <button
                      onClick={async () => {
                        setMenuOpen(false);
                        await signOut();
                        navigate("/");
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-brand hover:bg-surface-2 transition-colors"
                    >
                      {t("nav.logout")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login">
              <Button variant="outline" size="sm">
                {t("nav.login")}
              </Button>
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
