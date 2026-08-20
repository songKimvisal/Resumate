import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronRight } from "lucide-react";
import { useAuth } from "../../hooks/UseAuth";
import { cn } from "../../lib/utils";

export default function UserMenu({
  collapsed = false,
  compact = false,
  onNavigate,
}: {
  collapsed?: boolean;
  compact?: boolean;
  onNavigate?: () => void;
}) {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;
  const fullName =
    (user?.user_metadata?.full_name as string | undefined) ??
    user?.email ??
    "";

  return (
    <div className="relative" ref={ref}>
      {open && (
        <div
          className={cn(
            "absolute bottom-0 rounded-xl border border-line bg-bg shadow-lg overflow-hidden",
            collapsed
              ? "left-full ml-2 w-44"
              : "left-0 right-0 bottom-full mb-2",
          )}
        >
          <Link
            to="/settings"
            onClick={() => {
              setOpen(false);
              onNavigate?.();
            }}
            className="block px-4 py-2 text-sm text-text hover:bg-surface-2 transition-colors"
          >
            {t("nav.settings")}
          </Link>
          <button
            onClick={async () => {
              setOpen(false);
              onNavigate?.();
              await signOut();
              navigate("/");
            }}
            className="w-full text-left px-4 py-2 text-sm text-brand hover:bg-surface-2 transition-colors"
          >
            {t("nav.logout")}
          </button>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center rounded-xl hover:bg-surface-2 transition-colors",
          compact ? "gap-2 py-1.5" : "gap-3 py-2",
          collapsed ? "justify-center px-0" : "w-full px-2",
        )}
        aria-expanded={open}
        aria-label={t("nav.settings")}
        title={collapsed ? fullName : undefined}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={fullName}
            referrerPolicy="no-referrer"
            className={cn(
              "rounded-full object-cover shrink-0",
              compact ? "size-8" : "size-9",
            )}
          />
        ) : (
          <span
            className={cn(
              "rounded-full bg-brand text-white inline-flex items-center justify-center text-sm font-semibold shrink-0",
              compact ? "size-8" : "size-9",
            )}
          >
            {fullName.charAt(0).toUpperCase()}
          </span>
        )}
        {!collapsed && (
          <>
            <span className="min-w-0 flex-1 text-left">
              <span className="block text-xs text-text-secondary">
                {t("nav.welcomeBack")}
              </span>
              <span className="block text-sm font-medium text-text truncate">
                {fullName}
              </span>
            </span>
            <ChevronRight size={16} className="text-text-secondary shrink-0" />
          </>
        )}
      </button>
    </div>
  );
}
