import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/UseAuth";
import {
  continuePathForUser,
  isJourneyNavPath,
  useJourneyStore,
} from "../../store/journeyStore";
import {
  House,
  LayoutGrid,
  FileText,
  MessagesSquare,
  ReceiptText,
  PieChart,
  Settings as SettingsIcon,
  Sparkles,
  Sun,
  Moon,
} from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";
import logo from "../../assets/logo/logo.png";
import logoMark from "../../assets/logo/webpageIcon.png";
import UserMenu from "./UserMenu";
import { useTheme } from "../../hooks/UseTheme";
import { useAiCredits } from "../../hooks/useAiCredits";

const NAV_ITEMS = [
  { to: "/", icon: House, key: "home" },
  { to: "/dashboard", icon: LayoutGrid, key: "dashboard" },
  { to: "/my-resumes", icon: FileText, key: "myResumes" },
  { to: "/interview-prep", icon: MessagesSquare, key: "interviewPrep" },
  { to: "/billing", icon: ReceiptText, key: "billing" },
  { to: "/ai-usage", icon: PieChart, key: "aiUsage" },
  { to: "/settings", icon: SettingsIcon, key: "settings" },
] as const;

export default function Sidebar({
  collapsed = false,
  compact = false,
  onNavigate,
}: {
  collapsed?: boolean;
  compact?: boolean;
  onNavigate?: () => void;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { remaining: aiCreditsLeft } = useAiCredits();
  const dashboardTo = useJourneyStore((s) => continuePathForUser(s, user?.id));

  return (
    <div
      className={cn(
        "flex min-w-0 flex-col",
        compact ? "h-full px-3 py-4" : "h-full px-2 py-5",
      )}
    >
      <Link
        to="/"
        onClick={onNavigate}
        className={cn(
          "inline-flex",
          compact ? "mb-4 pr-8" : "mb-8",
          collapsed ? "justify-center px-0" : "px-2",
        )}
      >
        <img
          src={collapsed ? logoMark : logo}
          alt="ResuMate"
          className={
            collapsed
              ? "h-8 w-8 object-contain"
              : compact
                ? "h-7 w-auto"
                : "h-9 w-auto"
          }
        />
      </Link>

      <nav className={cn("flex-1 space-y-0.5 overflow-y-auto", !compact && "space-y-1")}>
        {NAV_ITEMS.map(({ to, icon: Icon, key }) => {
          const href = key === "dashboard" ? dashboardTo : to;
          const isActive =
            key === "home"
              ? location.pathname === "/"
              : key === "dashboard"
                ? isJourneyNavPath(location.pathname)
                : location.pathname === to ||
                  location.pathname.startsWith(`${to}/`);

          return (
          <NavLink
            key={to}
            to={href}
            onClick={onNavigate}
            title={
              collapsed
                ? key === "aiUsage"
                  ? t("nav.aiUsageCount", { count: aiCreditsLeft })
                  : t(`nav.${key}`)
                : undefined
            }
            className={cn(
                "flex items-center gap-2.5 py-2 rounded-full text-sm font-medium transition-colors",
                collapsed ? "justify-center px-0" : "px-3",
                isActive
                  ? "bg-brand text-white"
                  : "text-text-secondary hover:bg-surface-2 hover:text-text",
            )}
          >
            <Icon size={compact ? 16 : 18} strokeWidth={2} className="shrink-0" />
            {!collapsed && (
              <>
                <span className="min-w-0 truncate">{t(`nav.${key}`)}</span>
                {key === "aiUsage" && (
                  <span className="ml-auto tabular-nums text-xs font-semibold">
                    {aiCreditsLeft}
                  </span>
                )}
              </>
            )}
          </NavLink>
          );
        })}
      </nav>

      <div
        className={cn(
          "border-t border-line",
          compact ? "space-y-2 pt-3 mt-auto" : "space-y-3 pt-4 mt-4",
        )}
      >
        {!compact && (
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          title={collapsed ? t(theme === "dark" ? "nav.lightMode" : "nav.darkMode") : undefined}
          className={cn(
            "flex items-center gap-2.5 py-2 rounded-full text-sm font-medium text-text-secondary hover:bg-surface-2 hover:text-text transition-colors",
            collapsed ? "justify-center px-0 w-full" : "px-3 w-full",
          )}
        >
          {theme === "dark" ? (
            <Sun size={18} strokeWidth={2} className="shrink-0" />
          ) : (
            <Moon size={18} strokeWidth={2} className="shrink-0" />
          )}
          {!collapsed &&
            t(theme === "dark" ? "nav.lightMode" : "nav.darkMode")}
        </button>
        )}
        <Button
          size={collapsed ? "icon" : "compact"}
          className={cn(
            collapsed ? "mx-auto" : "w-full h-auto min-h-9 whitespace-normal px-3 leading-snug",
          )}
          title={collapsed ? t("nav.upgrade") : undefined}
          onClick={() => {
            onNavigate?.();
            navigate("/billing");
          }}
        >
          {collapsed ? <Sparkles size={16} /> : t("nav.upgrade")}
        </Button>
        <UserMenu
          collapsed={collapsed}
          compact={compact}
          onNavigate={onNavigate}
        />
      </div>
    </div>
  );
}
