'use client';

/**
 * SETTINGS.
 *
 * The sidebar has linked here since the navigation was rewritten and the route
 * did not exist, so every visit was a 404.
 *
 * The temptation with a page like this is to fill it — notification digests,
 * default sort orders, a density slider, an "enable beta features" switch — and
 * wire none of it up. A switch that flips and changes nothing is a lie you have
 * to click to discover. So this page contains exactly three controls, because
 * three preferences are all this dashboard actually persists, and each one is
 * visibly the thing it claims to be: flip the rail and the rail moves.
 *
 * Everything else here is stated rather than offered. Reduced motion is owned by
 * the operating system and is reported, not overridden. The backend target is a
 * build-time fact. The storage ledger is read live out of `localStorage`, so it
 * cannot drift from the truth — and its one destructive button says the exact
 * words for what it does before it does it.
 */

import * as React from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import {
  ArrowUpRight,
  Check,
  Keyboard,
  Monitor,
  MoonStar,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
  Trash2,
} from 'lucide-react';

import { useLayoutStore } from '@/store/layout-store';
import { Button } from '@/components/ui/button';
import { Stamp } from '@/components/ui/risk';
import { cn } from '@/lib/utils';

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function SettingsPage() {
  /*
   * next-themes cannot know the stored theme during the server render, and the
   * layout store rehydrates from localStorage on the client. Both would make
   * the first paint disagree with the server, so the controls render in their
   * server state for one frame and then tell the truth.
   */
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const { theme, setTheme, resolvedTheme } = useTheme();

  const sidebarCollapsed = useLayoutStore((s) => s.sidebarCollapsed);
  const setSidebarCollapsed = useLayoutStore((s) => s.setSidebarCollapsed);
  const activePanel = useLayoutStore((s) => s.activePanel);
  const setActivePanel = useLayoutStore((s) => s.setActivePanel);
  const setShortcutReferenceOpen = useLayoutStore((s) => s.setShortcutReferenceOpen);

  const reducedMotion = usePrefersReducedMotion();

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 pb-20 sm:px-6">
      <header className="max-w-[62ch] pt-8 pb-8">
        <Stamp>Settings</Stamp>
        <h1 className="font-display text-foreground mt-3 text-3xl leading-[1.1] font-semibold tracking-tight sm:text-4xl">
          Three controls, and they all work.
        </h1>
        <p className="text-muted-foreground mt-4 text-sm leading-relaxed sm:text-base">
          There is no account, no server-side profile and no sync. These three preferences are the
          only ones this dashboard remembers, they are stored in this browser, and each one takes
          effect the moment you press it. Below them is what cannot be changed here — and where it
          is decided instead.
        </p>
      </header>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:gap-14">
        {/* ================= CONTROLS ==================================== */}
        <div className="space-y-8">
          <Field
            label="Colour scheme"
            help="Applied immediately and remembered for next time."
          >
            <Choices
              ariaLabel="Colour scheme"
              value={mounted ? (theme ?? 'system') : 'dark'}
              onChange={setTheme}
              options={[
                {
                  id: 'dark',
                  icon: MoonStar,
                  title: 'Dark',
                  body: 'The default. Risk colour carries almost all of the signal on a dark field, which is what this interface was drawn for.',
                },
                {
                  id: 'light',
                  icon: Sun,
                  title: 'Light',
                  body: 'The same palette inverted. Legible, and the right choice for a projector or a printed screenshot.',
                },
                {
                  id: 'system',
                  icon: Monitor,
                  title: 'Match the system',
                  body: mounted
                    ? `Follows your operating system, which is currently asking for ${resolvedTheme ?? 'dark'}.`
                    : 'Follows your operating system and changes when it does.',
                },
              ]}
            />
          </Field>

          <Field
            label="Navigation rail"
            help="The rail on the left. Ctrl-B toggles it from anywhere."
          >
            <Choices
              ariaLabel="Navigation rail"
              value={mounted && sidebarCollapsed ? 'collapsed' : 'expanded'}
              onChange={(v) => setSidebarCollapsed(v === 'collapsed')}
              options={[
                {
                  id: 'expanded',
                  icon: PanelLeftOpen,
                  title: 'Expanded',
                  body: 'Every destination shows its name and one line saying what the page is for.',
                },
                {
                  id: 'collapsed',
                  icon: PanelLeftClose,
                  title: 'Icons only',
                  body: 'Gives roughly 200px back to the work. Names appear on hover.',
                },
              ]}
            />
          </Field>

          <Field
            label="Side panel on arrival"
            help="Which panel is already open when a case dossier loads."
          >
            <Choices
              ariaLabel="Side panel on arrival"
              value={mounted ? (activePanel ?? 'none') : 'none'}
              onChange={(v) =>
                setActivePanel(v === 'none' ? null : (v as 'copilot' | 'details'))
              }
              options={[
                {
                  id: 'none',
                  title: 'Closed',
                  body: 'The dossier gets the full width. Open a panel when you want one.',
                },
                {
                  id: 'copilot',
                  title: 'Copilot',
                  body: 'Start with the assistant open, ready to be asked about the case on screen.',
                },
                {
                  id: 'details',
                  title: 'Case details',
                  body: 'Start with the raw record open — identifiers, amounts, timestamps.',
                },
              ]}
            />
          </Field>

          <div className="border-border border-t pt-6">
            <Button variant="outline" size="sm" onClick={() => setShortcutReferenceOpen(true)}>
              <Keyboard className="size-3.5" aria-hidden />
              Show every keyboard shortcut
            </Button>
            <p className="text-muted-foreground mt-2.5 max-w-[54ch] text-xs leading-relaxed">
              Opens the same reference as <Kbd>?</Kbd>. Nothing here is remapped — the list is the
              whole set, and it is short on purpose.
            </p>
          </div>
        </div>

        {/* ================= NOT SETTABLE HERE =========================== */}
        <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          <h2 className="stamp text-muted-foreground">Decided elsewhere</h2>

          <Aside title="Motion">
            <p>
              {reducedMotion === null
                ? 'Your motion preference is being read from the operating system.'
                : reducedMotion
                  ? 'Your system asks for reduced motion, so every transition and staged reveal in this dashboard is switched off — including the Analyzer’s replay, which jumps straight to the finished trail.'
                  : 'Your system permits animation, so transitions and the Analyzer’s staged replay run at full length.'}
            </p>
            <p>
              This is not overridden here. The operating system owns it, the interface obeys it, and
              a duplicate switch in this app would only let the two disagree.
            </p>
          </Aside>

          <Aside title="Where requests go">
            <p>
              Every call this dashboard makes is same-origin. The dashboard proxies them onward to
              the backend, which is why nothing here needs a CORS exception or an API host field.
            </p>
            <p>
              Whether the backend is actually answering right now is a live question, and there is a
              page that measures it.
            </p>
            <Link
              href="/system"
              className="text-foreground focus-visible:ring-ring/50 mt-1 inline-flex items-center gap-1.5 rounded text-sm font-medium underline decoration-dotted underline-offset-4 focus-visible:ring-3 focus-visible:outline-none"
            >
              Open System
              <ArrowUpRight className="size-3.5" aria-hidden />
            </Link>
          </Aside>

          <StorageLedger />
        </aside>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* The storage ledger                                                         */
/* -------------------------------------------------------------------------- */

interface StoredKey {
  key: string;
  bytes: number;
  /** What this key is for, when it is one of ours. */
  role?: string;
}

/** Everything this origin has written, described. */
const KNOWN_KEYS: Record<string, string> = {
  'sentinel-layout': 'Rail state and which side panel opens first.',
  'sentinel-notifications': 'Notifications you have already been shown, and which you read.',
  'sentinel-investigation-workspace': 'Notes, pinned evidence and timeline events you added.',
  'sentinel_token': 'A bearer token, if one was ever set. The API does not require it.',
  theme: 'Your colour scheme choice.',
};

/**
 * Read live rather than described from memory.
 *
 * A hardcoded list of "data we store" goes stale the first time someone adds a
 * persisted store and forgets this file. Enumerating the origin's storage cannot
 * go stale, and if something unexpected is in there, saying so is the point.
 */
function StorageLedger() {
  const [keys, setKeys] = React.useState<StoredKey[] | null>(null);
  const [armed, setArmed] = React.useState(false);

  const read = React.useCallback(() => {
    const found: StoredKey[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key === null) continue;
      const value = localStorage.getItem(key) ?? '';
      found.push({ key, bytes: new Blob([key, value]).size, role: KNOWN_KEYS[key] });
    }
    found.sort((a, b) => b.bytes - a.bytes);
    setKeys(found);
  }, []);

  React.useEffect(read, [read]);

  /* An armed delete disarms itself, so walking away cannot leave a live trigger. */
  React.useEffect(() => {
    if (!armed) return;
    const id = window.setTimeout(() => setArmed(false), 6000);
    return () => window.clearTimeout(id);
  }, [armed]);

  const total = keys?.reduce((sum, k) => sum + k.bytes, 0) ?? 0;

  return (
    <Aside title="What this browser is holding">
      {keys === null ? (
        <p>Reading storage…</p>
      ) : keys.length === 0 ? (
        <>
          <p>
            Nothing. No preferences, no notes, no read notifications — this browser is in the state a
            first-time visitor sees.
          </p>
          <p>Change any control on the left and a line will appear here.</p>
        </>
      ) : (
        <>
          <p>
            {keys.length} {keys.length === 1 ? 'entry' : 'entries'}, {formatBytes(total)} in total.
            None of it leaves this browser.
          </p>
          <ul className="border-border mt-1 space-y-2.5 border-t pt-3">
            {keys.map((k) => (
              <li key={k.key} className="space-y-0.5">
                <div className="flex items-baseline justify-between gap-3">
                  <code className="text-foreground/90 min-w-0 font-mono text-[11px] break-all">
                    {k.key}
                  </code>
                  <span className="numeral text-muted-foreground shrink-0 text-[11px]">
                    {formatBytes(k.bytes)}
                  </span>
                </div>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  {k.role ?? 'Not written by this dashboard.'}
                </p>
              </li>
            ))}
          </ul>

          <div className="border-border mt-1 border-t pt-3">
            <Button
              variant={armed ? 'destructive' : 'outline'}
              size="sm"
              onClick={() => {
                if (!armed) {
                  setArmed(true);
                  return;
                }
                localStorage.clear();
                window.location.reload();
              }}
            >
              <Trash2 className="size-3.5" aria-hidden />
              {armed
                ? `Erase ${keys.length} ${keys.length === 1 ? 'entry' : 'entries'} and reload`
                : 'Erase all of it'}
            </Button>
            <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
              {armed
                ? 'Press again to erase every entry above and reload the page. Your notes and pinned evidence go with it, and cannot be recovered.'
                : 'Resets this dashboard to how a first-time visitor sees it. Asks once more before doing anything.'}
            </p>
          </div>
        </>
      )}
    </Aside>
  );
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(n < 10240 ? 1 : 0)} kB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

/* -------------------------------------------------------------------------- */
/* Pieces                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * `null` until the media query has been read on the client, so the copy can say
 * "being read" instead of guessing wrong for a frame.
 */
function usePrefersReducedMotion(): boolean | null {
  const [reduced, setReduced] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(query.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  return reduced;
}

function Field({
  label,
  help,
  children,
}: {
  label: string;
  help: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="space-y-1">
        <h2 className="font-display text-foreground text-lg font-semibold tracking-tight">
          {label}
        </h2>
        <p className="text-muted-foreground text-sm leading-relaxed">{help}</p>
      </div>
      {children}
    </section>
  );
}

interface ChoiceOption {
  id: string;
  title: string;
  body: string;
  icon?: React.ElementType;
}

/**
 * A radio group built from buttons, matching the Analyzer's payload picker so a
 * choice looks and behaves the same wherever it appears in this product.
 */
function Choices({
  ariaLabel,
  value,
  onChange,
  options,
}: {
  ariaLabel: string;
  value: string;
  onChange: (id: string) => void;
  options: ChoiceOption[];
}) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className="grid gap-2 sm:grid-cols-2">
      {options.map((option) => {
        const checked = option.id === value;
        const Icon = option.icon;
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={checked}
            onClick={() => onChange(option.id)}
            className={cn(
              'focus-visible:ring-ring/50 rounded-lg border px-3.5 py-3 text-left transition-colors focus-visible:ring-3 focus-visible:outline-none',
              checked
                ? 'border-foreground/35 bg-inset'
                : 'border-border hover:border-foreground/20',
            )}
          >
            <span className="flex items-start justify-between gap-2">
              <span className="text-foreground flex items-center gap-2 text-sm font-medium">
                {Icon && <Icon className="size-3.5 shrink-0" aria-hidden />}
                {option.title}
              </span>
              {checked && (
                <Check className="text-foreground mt-0.5 size-3.5 shrink-0" aria-hidden />
              )}
            </span>
            <span className="text-muted-foreground mt-1.5 block text-xs leading-relaxed">
              {option.body}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function Aside({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-border bg-card rounded-xl border p-5">
      <h3 className="font-display text-foreground text-base font-semibold tracking-tight">
        {title}
      </h3>
      <div className="text-muted-foreground mt-2 space-y-2.5 text-sm leading-relaxed">
        {children}
      </div>
    </section>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="border-border bg-inset text-foreground/90 rounded border px-1.5 py-0.5 font-mono text-[10px]">
      {children}
    </kbd>
  );
}
