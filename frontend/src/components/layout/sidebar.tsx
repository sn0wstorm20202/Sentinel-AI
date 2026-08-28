'use client';

/**
 * PRIMARY NAVIGATION.
 *
 * What this replaces, and why:
 *
 *   • A hydration mismatch. Every label was a `motion.span` carrying
 *     `initial="hidden" animate="visible" exit="hidden"` while `variants` was
 *     `undefined` whenever reduced motion was on. Framer Motion cannot resolve a
 *     variant *label* with no variant *map*, so the server emitted `style={{}}`
 *     and the client emitted `style="opacity:1;transform:none"` — React's "a tree
 *     hydrated but some attributes… didn't match" error, once per nav item. The
 *     width transition is now plain CSS, which cannot desynchronise and is
 *     already covered by the `prefers-reduced-motion` block in globals.css.
 *
 *   • A comment describing a "KEY GPU-ACCELERATION FIX: we no longer animate
 *     `width`" sitting directly above `animate={{ width }}`.
 *
 *   • `bg-primary text-primary-foreground` on the active item — a solid
 *     near-white slab. Colour in this interface means risk and nothing else, so
 *     the active item is marked structurally instead: a filled left rule.
 *
 *   • `pathname.startsWith(item.href)`, which marks every route active once "/"
 *     is in the list.
 *
 *   • An icon-only toggle with no accessible name.
 *
 * The order is the order the work happens in: look at the day, work the queue,
 * score something new — then, below the rule, the engine's own instrumentation.
 */

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  BrainCircuit,
  FlaskConical,
  Inbox,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
} from 'lucide-react';

import { useLayoutStore } from '@/store/layout-store';
import { useCases } from '@/lib/api/hooks/use-cases';
import { normalizeTier } from '@/lib/risk';
import { cn } from '@/lib/utils';

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  /** One line, shown when the rail is expanded. Says what the page is for. */
  hint: string;
}

const WORK: NavItem[] = [
  { icon: LayoutDashboard, label: 'Overview', href: '/', hint: 'Today at a glance' },
  { icon: Inbox, label: 'Queue', href: '/cases', hint: 'Everything scored' },
  { icon: FlaskConical, label: 'Analyzer', href: '/analyze', hint: 'Score a transaction' },
];

const ENGINE: NavItem[] = [
  { icon: BrainCircuit, label: 'Model', href: '/mlops', hint: 'Training and drift' },
  { icon: Activity, label: 'System', href: '/system', hint: 'What the dashboard depends on' },
  { icon: Settings, label: 'Settings', href: '/settings', hint: 'Dashboard preferences' },
];

export function Sidebar({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname();
  const toggleSidebar = useLayoutStore((state) => state.toggleSidebar);

  /*
   * `collapsed` comes from a localStorage-persisted store, so the client can
   * know it is `true` on its very first render while the server always rendered
   * `false`. Holding the server value for one frame keeps hydration exact.
   */
  const [hydrated, setHydrated] = React.useState(false);
  React.useEffect(() => setHydrated(true), []);
  const isCollapsed = hydrated && collapsed;

  // The one live number worth carrying in the chrome: how much work is waiting.
  const { data: cases } = useCases();
  const needsReview = React.useMemo(() => {
    if (!cases) return null;
    return cases.filter((c) => {
      const t = normalizeTier(c.risk);
      return t === 'High' || t === 'Critical';
    }).length;
  }, [cases]);

  return (
    <aside
      data-tour="navigation"
      className={cn(
        'bg-sidebar border-border flex shrink-0 flex-col border-r',
        hydrated && 'transition-[width] duration-200 ease-out',
        isCollapsed ? 'w-16' : 'w-60',
      )}
    >
      {/* Wordmark. The monogram is the only thing that survives collapsing. */}
      <div className="flex h-14 items-center gap-2.5 px-4">
        <span
          aria-hidden
          className="border-foreground/25 text-foreground grid size-6 shrink-0 place-items-center rounded border font-mono text-[11px] font-semibold"
        >
          S
        </span>
        <span
          className={cn(
            'font-display text-foreground truncate text-sm font-semibold tracking-tight',
            isCollapsed && 'sr-only',
          )}
        >
          Sentinel
          <span className="text-muted-foreground font-normal"> AI</span>
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-2" aria-label="Sections">
        <Group items={WORK} pathname={pathname} collapsed={isCollapsed} badgeFor="/cases" badge={needsReview} />
        <p className={cn('stamp text-muted-foreground-subtle px-3 pt-5 pb-2', isCollapsed && 'sr-only')}>
          The engine
        </p>
        {isCollapsed && <div className="border-border mx-2 my-3 border-t" aria-hidden />}
        <Group items={ENGINE} pathname={pathname} collapsed={isCollapsed} />
      </nav>

      <div className="border-border border-t p-2">
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={isCollapsed ? 'Expand the navigation' : 'Collapse the navigation'}
          aria-expanded={!isCollapsed}
          className="text-muted-foreground hover:text-foreground hover:bg-inset focus-visible:ring-ring/50 flex h-8 w-full items-center gap-3 rounded-md px-2.5 text-sm transition-colors focus-visible:ring-3 focus-visible:outline-none"
        >
          {isCollapsed ? (
            <PanelLeftOpen className="size-4 shrink-0" aria-hidden />
          ) : (
            <PanelLeftClose className="size-4 shrink-0" aria-hidden />
          )}
          <span className={cn('truncate', isCollapsed && 'sr-only')}>Collapse</span>
        </button>
      </div>
    </aside>
  );
}

function Group({
  items,
  pathname,
  collapsed,
  badgeFor,
  badge,
}: {
  items: NavItem[];
  pathname: string;
  collapsed: boolean;
  badgeFor?: string;
  badge?: number | null;
}) {
  return (
    <ul className="space-y-0.5">
      {items.map((item) => {
        // "/" must match exactly; everything else owns its subtree.
        const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
        const count = badgeFor === item.href ? badge : null;

        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? 'page' : undefined}
              title={collapsed ? item.label : undefined}
              className={cn(
                'group focus-visible:ring-ring/50 relative flex items-center gap-3 rounded-md py-2 pr-2 pl-3 transition-colors focus-visible:ring-3 focus-visible:outline-none',
                active ? 'bg-inset text-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {/* Structural marker, not a colour: the active item is ruled. */}
              <span
                aria-hidden
                className={cn(
                  'absolute inset-y-1.5 left-0 w-[2px] rounded-full',
                  active ? 'bg-foreground' : 'bg-transparent',
                )}
              />
              <item.icon className="size-4 shrink-0" aria-hidden />
              <span className={cn('min-w-0 flex-1', collapsed && 'sr-only')}>
                <span className="block truncate text-sm leading-tight">{item.label}</span>
                {!active && (
                  <span className="text-muted-foreground-subtle block truncate text-[11px] leading-tight">
                    {item.hint}
                  </span>
                )}
              </span>
              {count !== null && count !== undefined && count > 0 && (
                <span
                  className={cn(
                    'numeral text-risk-critical shrink-0 text-xs font-semibold',
                    collapsed && 'absolute top-1 right-1 text-[10px]',
                  )}
                  aria-label={`${count} awaiting review`}
                >
                  {count}
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
