/**
 * Focusing a target that may not exist yet.
 *
 * Every keyboard shortcut and command-palette entry that moved focus across a
 * route change shared one bug. `router.push()` returns immediately, the dossier
 * renders a skeleton while its case is still fetching, and a single
 * `setTimeout(…, 40)` fired long before the real element mounted. The selector
 * matched nothing, `?.focus()` did nothing, and the shortcut failed in complete
 * silence — which a reader can only interpret as "this key is broken".
 *
 * Two details that are easy to get wrong and were both wrong here:
 *
 *   • `document.querySelector('a, b')` returns the first match in *document
 *     order*, not in the order the selectors were written. The old `/` handler
 *     passed `'[…="cases"], […="primary"]'` expecting the page filter to win,
 *     but the topbar sits above the page content, so the fallback would always
 *     have been chosen over the target. Selectors have to be tried one at a
 *     time to express a real preference.
 *
 *   • `focus()` scrolls the element into view with the browser's own behaviour,
 *     which ignores `prefers-reduced-motion`. Suppressing that and scrolling
 *     deliberately gives one controlled movement that honours the setting.
 */

/** True when the reader has asked the platform for less animation. */
function prefersReducedMotion(): boolean {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

/** Focus `el` with a single scroll that respects reduced-motion. */
export function focusElement(el: HTMLElement): void {
  el.focus({ preventScroll: true });
  el.scrollIntoView({
    block: 'nearest',
    behavior: prefersReducedMotion() ? 'auto' : 'smooth',
  });
}

/**
 * Focus the first of `selectors` that exists, polling until it mounts.
 *
 * @param selectors One selector, or several in descending order of preference.
 * @returns a cancel function, for callers that can be superseded.
 */
export function focusWhenReady(
  selectors: string | string[],
  { timeoutMs = 2500, intervalMs = 60 }: { timeoutMs?: number; intervalMs?: number } = {},
): () => void {
  if (typeof document === 'undefined') return () => {};

  const list = Array.isArray(selectors) ? selectors : [selectors];
  const deadline = Date.now() + timeoutMs;
  let timer = 0;
  let cancelled = false;

  const attempt = () => {
    if (cancelled) return;

    for (const selector of list) {
      const el = document.querySelector<HTMLElement>(selector);
      if (el) {
        focusElement(el);
        return;
      }
    }

    // Nothing yet. The element is probably still behind a loading state, so
    // keep looking — but give up rather than polling for the session's life.
    if (Date.now() < deadline) timer = window.setTimeout(attempt, intervalMs);
  };

  timer = window.setTimeout(attempt, 0);

  return () => {
    cancelled = true;
    window.clearTimeout(timer);
  };
}
