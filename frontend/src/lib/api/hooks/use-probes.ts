import { useQuery } from '@tanstack/react-query';

/**
 * Live reachability probes for the endpoints this dashboard depends on.
 *
 * Every number this produces is measured in the browser at the moment you look
 * at it. There is no uptime history, no rolling average and no synthetic
 * timeline, because none of that exists to read — the backend keeps no such
 * record and inventing one would make this page a decoration instead of an
 * instrument.
 *
 * What is measured: HTTP status, round-trip wall time, and the shape of the
 * response. That is enough to answer the only question a System page is for —
 * *is the thing that feeds this screen actually answering right now?*
 */

export interface ProbeTarget {
  id: string;
  method: 'GET';
  /** The route as the backend defines it. This is what gets shown. */
  path: string;
  /**
   * How *this browser* reaches it, when that differs from `path`.
   *
   * `/health`, `/live` and `/ready` are served by FastAPI at the domain root,
   * outside the `/api` namespace that the dashboard proxies. They are reached
   * through an explicit `/_backend/` passthrough instead — see the rewrite in
   * `next.config.ts` for why the bare paths are not used.
   */
  request?: string;
  /** Human name for the endpoint. */
  label: string;
  /** Which screens read it. */
  feeds: string;
  /** Plainly: what the user sees when this is the thing that failed. */
  ifDown: string;
  /**
   * Show the response body verbatim rather than a shape summary. Only set for
   * the liveness probes, whose bodies are two fields long.
   */
  verbatim?: boolean;
}

/**
 * The probe set.
 *
 * `POST /api/v1/cases/explain` is deliberately absent. Probing it would mean
 * scoring a real transaction — a 3,574-column alignment plus a SHAP pass — every
 * thirty seconds to colour in a dot. The Analyzer exercises it properly, so this
 * page links there instead of faking a cheap version of it.
 */
export const PROBE_TARGETS: ProbeTarget[] = [
  {
    id: 'health',
    method: 'GET',
    path: '/health',
    request: '/_backend/health',
    label: 'Service liveness',
    feeds: 'Nothing directly — it is the bluntest possible "is the process up".',
    ifDown: 'The backend is unreachable and every screen below falls back to its error state.',
    verbatim: true,
  },
  {
    id: 'ready',
    method: 'GET',
    path: '/ready',
    request: '/_backend/ready',
    label: 'Orchestrator readiness',
    feeds: 'Scoring. Returns 503 until SentinelOrchestrator has loaded the model, SHAP explainer and knowledge base.',
    ifDown: 'The process is answering but cannot score anything. The Analyzer would return 500s.',
    verbatim: true,
  },
  {
    id: 'cases',
    method: 'GET',
    path: '/api/v1/cases',
    label: 'Case index',
    feeds: 'Overview and Queue.',
    ifDown: 'The queue renders empty with an error, and the Overview loses its tier counts.',
  },
  {
    id: 'mlops',
    method: 'GET',
    path: '/api/v1/mlops/metrics',
    label: 'Model metrics',
    feeds: 'Model — training results, drift status, experiment history.',
    ifDown: 'The Model page cannot report on the champion or on drift.',
  },
  {
    id: 'graph',
    method: 'GET',
    path: '/api/v1/graph/statistics',
    label: 'Graph statistics',
    feeds: 'The entity network on a case dossier.',
    ifDown: 'A dossier still opens and still explains itself; only the network panel is lost.',
  },
];

export interface ProbeResult {
  id: string;
  ok: boolean;
  httpStatus: number | null;
  /** Round-trip wall time in ms, measured here. */
  ms: number;
  /** Verbatim body for liveness probes, or a shape summary for data endpoints. */
  detail: string;
  /** Set when the request never completed — DNS, CORS, offline, timeout. */
  transportError?: string;
}

/** Describe a parsed body without pretending to interpret it. */
function summarize(value: unknown): string {
  if (Array.isArray(value)) {
    return `${value.length} item${value.length === 1 ? '' : 's'}`;
  }
  if (value && typeof value === 'object') {
    const n = Object.keys(value).length;
    return `${n} field${n === 1 ? '' : 's'}`;
  }
  return String(value);
}

const PROBE_TIMEOUT_MS = 20_000;

async function probe(target: ProbeTarget): Promise<ProbeResult> {
  const base = process.env.NEXT_PUBLIC_API_URL || '';
  const started = performance.now();
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);

  try {
    const response = await fetch(`${base}${target.request ?? target.path}`, {
      method: target.method,
      cache: 'no-store',
      signal: controller.signal,
    });
    const ms = performance.now() - started;

    let detail = '';
    try {
      const text = await response.text();
      if (target.verbatim) {
        detail = text.trim().slice(0, 120);
      } else {
        detail = summarize(JSON.parse(text));
      }
    } catch {
      detail = 'body could not be read as JSON';
    }

    return { id: target.id, ok: response.ok, httpStatus: response.status, ms, detail };
  } catch (e) {
    const ms = performance.now() - started;
    const aborted = e instanceof Error && e.name === 'AbortError';
    return {
      id: target.id,
      ok: false,
      httpStatus: null,
      ms,
      detail: aborted ? 'no response' : 'request failed',
      transportError: aborted
        ? `No response within ${PROBE_TIMEOUT_MS / 1000}s.`
        : e instanceof Error
          ? e.message
          : 'Unknown transport error.',
    };
  } finally {
    window.clearTimeout(timer);
  }
}

export function useProbes() {
  return useQuery({
    queryKey: ['probes'],
    queryFn: async () => {
      const results = await Promise.all(PROBE_TARGETS.map(probe));
      return Object.fromEntries(results.map((r) => [r.id, r])) as Record<string, ProbeResult>;
    },
    // Slow enough not to hammer a sleeping Space, quick enough that the page is
    // telling you about now rather than about a minute ago.
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    // A failed probe is the answer, not an error to retry away.
    retry: false,
  });
}
