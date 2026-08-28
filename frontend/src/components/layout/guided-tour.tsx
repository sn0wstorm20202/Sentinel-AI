'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check, FastForward, X } from 'lucide-react';

import { useLayoutStore } from '@/store/layout-store';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TourStep {
  id: string;
  title: string;
  body: string;
  selector: string;
  href?: string;
  optional?: boolean;
}

const COMMON_STEPS: TourStep[] = [
  {
    id: 'navigation',
    title: 'Start with the left rail',
    body: 'Sentinel is arranged in the same order the work moves: first understand today, then triage the queue, run a new analysis, and finally check whether the model is still healthy.',
    selector: '[data-tour="navigation"]',
  },
  {
    id: 'search',
    title: 'Search is global',
    body: 'Use this when you know what you want: a case id, transaction id, command, entity, or page. It is the escape hatch for a dense investigation workspace.',
    selector: '[data-tour="global-search"]',
  },
  {
    id: 'overview',
    title: 'The overview is the mental model',
    body: 'The project is not only a fraud score. A transaction is aligned to the trained schema, scored by the calibrated champion model, explained with SHAP when needed, matched against typologies, and turned into an analyst action.',
    selector: '[data-tour="overview"]',
    href: '/',
  },
  {
    id: 'queue',
    title: 'The queue is where humans enter',
    body: 'Every row is a transaction the engine already scored. Approve and Elevated usually close themselves. High and Critical stay here because the model says the cost of being wrong is high enough for a human to review.',
    selector: '[data-tour="queue"]',
    href: '/cases',
  },
  {
    id: 'analyzer',
    title: 'The analyzer runs a fresh test',
    body: 'This is where you press the button and send a prepared payload to POST /api/v1/cases/explain. The answer is not a fake demo row: the backend aligns the fields, scores them, and returns one finished case.',
    selector: '[data-tour="analyzer"]',
    href: '/analyze',
  },
  {
    id: 'mlops',
    title: 'MLOps answers “can I trust this?”',
    body: 'The model can get stale when data changes. This page checks the champion model, experiment history, feature-store status, and drift reports so the score is treated as an operating system signal, not magic.',
    selector: '[data-tour="mlops"]',
    href: '/mlops',
  },
  {
    id: 'copilot',
    title: 'The copilot is for investigation questions',
    body: 'Open this when you need help reading a case: ask why a feature mattered, what the recommendation means, or what an analyst should verify next.',
    selector: '[data-tour="copilot"]',
  },
];

const CASE_STEPS: TourStep[] = [
  {
    id: 'case-verdict',
    title: 'Read the verdict first',
    body: 'A case dossier starts with the final decision because the investigator needs the answer before the evidence. The score is 0-100, the tier tells urgency, and the directive says what to do next.',
    selector: '[data-tour="case-verdict"]',
  },
  {
    id: 'decision-trail',
    title: 'The trail explains what happened',
    body: 'This is the core of Sentinel. Stage 01 receives the transaction. Stage 02 aligns it to the model schema. Stage 03 scores it. If it is High or Critical, Stage 04 finds the SHAP drivers, Stage 05 maps those drivers to fraud patterns, and Stage 06 recommends action.',
    selector: '[data-tour="decision-trail"]',
  },
  {
    id: 'case-attribute',
    title: 'Stage 04 answers “why this row?”',
    body: 'The model may flag a transaction, but SHAP explains which feature values pushed the score. This is where raw ML output becomes evidence an investigator can cite.',
    selector: '#trail-tab-attribute',
    optional: true,
  },
  {
    id: 'case-hypothesis',
    title: 'Stage 05 turns evidence into a theory',
    body: 'The hypothesis engine compares the ranked evidence with known fraud typologies. If the evidence does not support a named pattern, it should stay quiet instead of inventing one.',
    selector: '#trail-tab-hypothesize',
    optional: true,
  },
  {
    id: 'graph-card',
    title: 'The graph shows relationships',
    body: 'The graph is not another score. It is a map of connected entities: customers, devices, IPs, merchants, and communities. Use it to see whether this case touches a risky cluster or a shared device, but remember the tabular score above was already decided.',
    selector: '[data-tour="graph-card"]',
  },
  {
    id: 'graph-expand',
    title: 'Expand the graph when it gets dense',
    body: 'Click the expand icon when the mini graph feels crowded. The same graph opens in a full-window workspace, with search, heatmap, propagation, communities, minimap, and inspector still contained inside the view.',
    selector: '[data-tour="graph-expand"]',
    optional: true,
  },
  {
    id: 'activity',
    title: 'The activity log is audit history',
    body: 'This is the record of what happened after the model produced the case: analyst opens, notes, and system events. It exists for review discipline and later audit, not for changing the score.',
    selector: '[data-tour="activity"]',
  },
];

const QUEUE_STEPS: TourStep[] = [
  {
    id: 'queue-workload',
    title: 'This bar is today’s workload',
    body: 'The queue groups all scored transactions by tier. The risk colours show how much work is routine and how much needs human attention, so you know where to start before opening any case.',
    selector: '[data-tour="queue"]',
  },
  {
    id: 'queue-open-case',
    title: 'Open a row to see the reasoning',
    body: 'The queue is only the triage surface. The real explanation lives inside each case: score, feature evidence, hypotheses, recommended action, graph context, and activity history.',
    selector: '[data-tour="queue-table"]',
    optional: true,
  },
];

const ANALYZER_STEPS: TourStep[] = [
  {
    id: 'analyzer-payload',
    title: 'A test run starts with a payload',
    body: 'The two presets contain thousands of model fields. When you choose one, you are choosing what feature vector to send, not choosing the answer. The model still has to decide.',
    selector: '[data-tour="analyzer"]',
  },
  {
    id: 'analyzer-post',
    title: 'The button calls the live API',
    body: 'When you score it, the UI sends request id, case id, transaction id, timestamp, and features to the backend. The browser measures the round trip, but the backend returns one completed decision.',
    selector: '[data-tour="analyzer-submit"]',
    optional: true,
  },
  {
    id: 'analyzer-result',
    title: 'The result replays the pipeline',
    body: 'After the response comes back, the UI shows the same six stages in execution order. If the tier is low, stages 04-06 are marked skipped because the engine deliberately avoids expensive reasoning for cases nobody reviews.',
    selector: '[data-tour="analyzer-result"]',
    optional: true,
  },
];

type Rect = Pick<DOMRect, 'top' | 'left' | 'width' | 'height' | 'right' | 'bottom'>;

export function GuidedTour() {
  const router = useRouter();
  const pathname = usePathname();
  const open = useLayoutStore((state) => state.guidedTourOpen);
  const setOpen = useLayoutStore((state) => state.setGuidedTourOpen);
  const completed = useLayoutStore((state) => state.guidedTourCompleted);
  const setCompleted = useLayoutStore((state) => state.setGuidedTourCompleted);
  const [index, setIndex] = React.useState(0);
  const [rect, setRect] = React.useState<Rect | null>(null);

  const steps = React.useMemo(() => {
    const isCase = /^\/cases\/[^/]+/.test(pathname);
    if (isCase) return [...CASE_STEPS, ...COMMON_STEPS];
    if (pathname === '/cases') return [...QUEUE_STEPS, ...COMMON_STEPS];
    if (pathname === '/analyze') return [...ANALYZER_STEPS, ...COMMON_STEPS];
    return COMMON_STEPS;
  }, [pathname]);

  const step = steps[Math.min(index, steps.length - 1)];

  React.useEffect(() => {
    if (!completed) {
      const id = window.setTimeout(() => setOpen(true), 700);
      return () => window.clearTimeout(id);
    }
  }, [completed, setOpen]);

  React.useEffect(() => {
    if (!open || !step) return;
    if (step.href && step.href !== pathname) {
      router.push(step.href);
    }
  }, [open, pathname, router, step]);

  React.useEffect(() => {
    if (!open || !step) return;

    let frame = 0;
    let attempts = 0;

    const measure = () => {
      const element = document.querySelector<HTMLElement>(step.selector);
      if (!element && step.optional) {
        setRect(null);
        return;
      }
      if (!element && attempts < 24) {
        attempts += 1;
        frame = window.requestAnimationFrame(measure);
        return;
      }
      if (!element) {
        setRect(null);
        return;
      }

      element.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' });
      const next = element.getBoundingClientRect();
      setRect({
        top: next.top,
        left: next.left,
        right: next.right,
        bottom: next.bottom,
        width: next.width,
        height: next.height,
      });
    };

    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [open, pathname, step]);

  const finish = React.useCallback(() => {
    setCompleted(true);
    setOpen(false);
    setIndex(0);
  }, [setCompleted, setOpen]);

  const skip = React.useCallback(() => {
    setCompleted(true);
    setOpen(false);
    setIndex(0);
  }, [setCompleted, setOpen]);

  const previous = React.useCallback(() => {
    setIndex((current) => Math.max(0, current - 1));
  }, []);

  const next = React.useCallback(() => {
    setIndex((current) => {
      if (current >= steps.length - 1) {
        setCompleted(true);
        setOpen(false);
        return 0;
      }
      return current + 1;
    });
  }, [setCompleted, setOpen, steps.length]);

  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') finish();
      if (event.key === 'ArrowRight') next();
      if (event.key === 'ArrowLeft') previous();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [finish, next, open, previous]);

  if (!open || !step) return null;

  const padded = rect
    ? {
        top: Math.max(8, rect.top - 8),
        left: Math.max(8, rect.left - 8),
        width: Math.min(window.innerWidth - 16, rect.width + 16),
        height: Math.min(window.innerHeight - 16, rect.height + 16),
      }
    : null;

  const cardStyle = padded ? getCardStyle(padded) : undefined;

  return (
    <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-labelledby="tour-title">
      <div className="absolute inset-0 bg-background/72 backdrop-blur-[1px]" />

      {padded && (
        <div
          aria-hidden
          className="pointer-events-none absolute rounded-lg border border-foreground bg-transparent shadow-[0_0_0_9999px_color-mix(in_oklch,var(--background)_74%,transparent)]"
          style={padded}
        />
      )}

      <section
        className={cn(
          'absolute w-[min(24rem,calc(100vw-2rem))] rounded-xl border bg-popover p-4 text-popover-foreground shadow-2xl',
          !padded && 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
        )}
        style={cardStyle}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="stamp text-muted-foreground">
              Step {index + 1} of {steps.length}
            </p>
            <h2 id="tour-title" className="font-display mt-2 text-lg font-semibold leading-tight">
              {step.title}
            </h2>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={finish} aria-label="Close guided tour">
            <X className="size-4" aria-hidden />
          </Button>
        </div>

        <p className="text-muted-foreground mt-3 text-sm leading-relaxed">{step.body}</p>

        <div className="bg-muted mt-4 h-1 overflow-hidden rounded-full">
          <div
            className="bg-foreground h-full rounded-full transition-[width]"
            style={{ width: `${((index + 1) / steps.length) * 100}%` }}
          />
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <Button variant="ghost" size="sm" onClick={skip}>
            <FastForward className="size-3.5" aria-hidden />
            Skip
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={previous} disabled={index === 0}>
              <ArrowLeft className="size-3.5" aria-hidden />
              Back
            </Button>
            <Button size="sm" onClick={next}>
              {index === steps.length - 1 ? (
                <>
                  Finish
                  <Check className="size-3.5" aria-hidden />
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="size-3.5" aria-hidden />
                </>
              )}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function getCardStyle(rect: { top: number; left: number; width: number; height: number }) {
  const width = Math.min(384, window.innerWidth - 32);
  const gap = 16;
  const rightSpace = window.innerWidth - (rect.left + rect.width);
  const leftSpace = rect.left;
  const belowSpace = window.innerHeight - (rect.top + rect.height);

  let left = rect.left;
  let top = rect.top + rect.height + gap;

  if (rightSpace >= width + gap) {
    left = rect.left + rect.width + gap;
    top = rect.top;
  } else if (leftSpace >= width + gap) {
    left = rect.left - width - gap;
    top = rect.top;
  } else {
    left = Math.min(Math.max(16, rect.left), window.innerWidth - width - 16);
    if (belowSpace < 180) top = Math.max(16, rect.top - 220);
  }

  return {
    left: Math.min(Math.max(16, left), window.innerWidth - width - 16),
    top: Math.min(Math.max(16, top), window.innerHeight - 260),
  };
}
