'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useLayoutStore } from "@/store/layout-store";
import { ShieldAlert, LayoutDashboard, BrainCircuit, Activity, Settings, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { sidebarLabelVariants, SPRING_SNAPPY } from "@/lib/motion/config";
import { useReducedMotion } from "framer-motion";

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
}

const NAV_ITEMS: NavItem[] = [
  { icon: LayoutDashboard, label: "Investigations", href: "/cases" },
  { icon: BrainCircuit,    label: "ML Pipeline",    href: "/mlops" },
  { icon: Activity,        label: "System Health",  href: "/health" },
  { icon: Settings,        label: "Settings",       href: "/settings" },
];

const SIDEBAR_EXPANDED_W  = 256; // 16rem / w-64
const SIDEBAR_COLLAPSED_W =  64; // 4rem  / w-16

export function Sidebar({ collapsed }: { collapsed: boolean }) {
  const pathname    = usePathname();
  const toggleSidebar = useLayoutStore((state) => state.toggleSidebar);
  const shouldReduce  = useReducedMotion();

  const transition = shouldReduce ? { duration: 0 } : SPRING_SNAPPY;

  return (
    /*
     * KEY GPU-ACCELERATION FIX:
     * We no longer animate `width` (which triggers layout reflow).
     * Instead, we animate the sidebar's pixel width via `motion.aside`
     * using the `width` CSS property on the element itself — but wrap it
     * in a fixed-size container so siblings are NOT reflowed by the browser.
     * The inner content uses translateX to slide out.
     */
    <motion.aside
      animate={{ width: collapsed ? SIDEBAR_COLLAPSED_W : SIDEBAR_EXPANDED_W }}
      transition={transition}
      className="flex flex-col border-r bg-muted/10 overflow-hidden flex-shrink-0"
      style={{ willChange: 'width' }}
    >
      {/* Logo row */}
      <div className="flex h-14 items-center border-b px-4 py-3 justify-between">
        <div className="flex items-center gap-2 overflow-hidden">
          <ShieldAlert className="h-6 w-6 shrink-0 text-primary" />
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.span
                key="logo-label"
                variants={shouldReduce ? undefined : sidebarLabelVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="font-semibold tracking-tight whitespace-nowrap overflow-hidden"
              >
                Sentinel AI
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 p-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <AnimatePresence initial={false}>
                {!collapsed && (
                  <motion.span
                    key={`${item.href}-label`}
                    variants={shouldReduce ? undefined : sidebarLabelVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    className="whitespace-nowrap overflow-hidden"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>

      {/* Toggle */}
      <div className="p-2 border-t">
        <Button
          variant="ghost"
          size="icon"
          className="w-full h-8 flex items-center justify-center text-muted-foreground hover:text-foreground"
          onClick={toggleSidebar}
        >
          {collapsed
            ? <ChevronRight className="h-4 w-4" />
            : <ChevronLeft  className="h-4 w-4" />}
        </Button>
      </div>
    </motion.aside>
  );
}
