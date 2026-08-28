import { useEffect, useState, type CSSProperties } from "react";
import { Outlet, Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Menu, X, ChevronLeft, ChevronRight, Sun, Moon } from "lucide-react";
import Sidebar from "./Sidebar";
import logo from "../../assets/logo/logo.png";
import { cn } from "../../lib/utils";
import { useTheme } from "../../hooks/UseTheme";

export default function DashboardShell() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    if (!drawerOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [drawerOpen]);

  return (
    <div
      className="min-h-screen bg-bg text-text lg:flex"
      style={
        {
          "--dashboard-sidebar-width": collapsed ? "4rem" : "13rem",
        } as CSSProperties
      }
    >
      {/* ---------- desktop fixed sidebar ---------- */}
      <div
        className={cn(
          "hidden lg:block shrink-0 border-r border-line transition-[width] duration-200",
          collapsed ? "w-16" : "w-52",
        )}
      >
        <div className="sticky top-0 h-screen relative">
          <Sidebar collapsed={collapsed} />
          <button
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="absolute top-6 -right-3 size-6 rounded-full border border-line bg-bg shadow-sm text-text-secondary hover:text-text inline-flex items-center justify-center"
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>
      </div>

      {/* ---------- mobile top bar ---------- */}
      <div className="lg:hidden sticky top-0 z-30 flex items-center justify-between h-16 px-4 border-b border-line bg-bg">
        <Link to="/">
          <img src={logo} alt="ResuMate" className="h-8 w-auto" />
        </Link>
        <div className="flex items-center gap-1">
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="size-9 rounded-lg text-text-secondary hover:bg-surface-2 hover:text-text transition-colors inline-flex items-center justify-center"
          >
            {theme === "dark" ? (
              <Sun size={17} strokeWidth={2} />
            ) : (
              <Moon size={17} strokeWidth={2} />
            )}
          </button>
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            className="size-9 rounded-lg text-text-secondary hover:bg-surface-2 hover:text-text transition-colors inline-flex items-center justify-center"
          >
            <Menu size={20} />
          </button>
        </div>
      </div>

      {/* ---------- mobile slide-over drawer ---------- */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              className="lg:hidden fixed inset-0 z-40 bg-black/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
            />
            <motion.div
              className="lg:hidden fixed inset-y-0 left-0 z-50 flex h-dvh w-[min(17.5rem,86vw)] min-w-0 flex-col bg-bg shadow-xl"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              <button
                onClick={() => setDrawerOpen(false)}
                aria-label="Close menu"
                className="absolute top-3 right-3 z-10 size-9 rounded-lg text-text-secondary hover:bg-surface-2 hover:text-text transition-colors inline-flex items-center justify-center"
              >
                <X size={18} />
              </button>
              <Sidebar compact onNavigate={() => setDrawerOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ---------- page content ---------- */}
      <div className="flex-1 min-w-0">
        <Outlet />
      </div>
    </div>
  );
}
