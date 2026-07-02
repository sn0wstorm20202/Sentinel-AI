'use client';

/**
 * MetricsChart — lazy-loaded ECharts entry point.
 *
 * Uses React.lazy() + Suspense rather than next/dynamic because Turbopack
 * (Next.js 16's default bundler) resolves dynamic import() split points in the
 * React component tree more reliably than the next/dynamic HOC for CJS packages.
 *
 * The lazy() boundary causes Turbopack to emit metrics-chart-inner.tsx and its
 * entire dependency tree (echarts + echarts-for-react ≈700 KB) as a separate
 * async chunk that is only fetched when a browser first renders this component.
 *
 * INVARIANT: This file must contain NO static imports of echarts or
 * metrics-chart-inner. Any static import defeats the split boundary.
 */
import { lazy, Suspense } from 'react';

const LazyMetricsChart = lazy(() => import('./metrics-chart-inner'));

function ChartLoadingSkeleton() {
  return (
    <div
      className="h-[350px] w-full rounded-md bg-muted animate-pulse"
      role="status"
      aria-label="Loading chart..."
    />
  );
}

export function MetricsChart() {
  return (
    <Suspense fallback={<ChartLoadingSkeleton />}>
      <LazyMetricsChart />
    </Suspense>
  );
}
