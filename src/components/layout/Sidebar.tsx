import { Link, NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  LayoutGrid,
  FileText,
  MessagesSquare,
  ReceiptText,
  PieChart,
  Settings as SettingsIcon,
  Sparkles,
} from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";
import logo from "../../assets/logo/logo.png";
import logoMark from "../../assets/logo/webpageIcon.png";
import UserMenu from "./UserMenu";

const NAV_ITEMS = [
  { to: "/dashboard", icon: LayoutGrid, key: "dashboard" },
  { to: "/my-resumes", icon: FileText, key: "myResumes" },
  { to: "/interview-prep", icon: MessagesSquare, key: "interviewPrep" },
  { to: "/billing", icon: ReceiptText, key: "billing" },
  { to: "/ai-usage", icon: PieChart, key: "aiUsage" },
  { to: "/settings", icon: SettingsIcon, key: "settings" },
] as const;

export default function Sidebar({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="h-full flex flex-col px-3 py-6">
      <Link
        to="/"
        onClick={onNavigate}
        className={cn("mb-8 inline-flex", collapsed ? "justify-center px-0" : "px-2")}
      >
        <img
          src={collapsed ? logoMark : logo}
          alt="ResuMate"
          className={collapsed ? "h-8 w-8 object-contain" : "h-9 w-auto"}
        />
      </Link>

      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map(({ to, icon: Icon, key }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            title={collapsed ? t(`nav.${key}`) : undefined}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 py-2.5 rounded-full text-sm font-medium transition-colors",
                collapsed ? "justify-center px-0" : "px-4",
                isActive
                  ? "bg-brand text-white"
                  : "text-text-secondary hover:bg-surface-2 hover:text-text",
              )
            }
          >
            <Icon size={18} strokeWidth={2} className="shrink-0" />
            {!collapsed && t(`nav.${key}`)}
          </NavLink>
        ))}
      </nav>

      <div className="space-y-3 pt-4 mt-4 border-t border-line">
        <Button
          size={collapsed ? "icon" : "default"}
          className={collapsed ? "mx-auto" : "w-full"}
          title={collapsed ? t("nav.upgrade") : undefined}
          onClick={() => {
            onNavigate?.();
            navigate("/billing");
          }}
        >
          {collapsed ? <Sparkles size={16} /> : t("nav.upgrade")}
        </Button>
        <UserMenu collapsed={collapsed} onNavigate={onNavigate} />
      </div>
    </div>
  );
}
