'use client';

/**
 * The shortcut reference.
 *
 * Two things were wrong with this dialog. Its description said "Enterprise
 * navigation is available from anywhere in the investigator workspace", which
 * tells a reader nothing and sounds like a brochure. And its entries described
 * keys rather than consequences — "Focus graph" for a key that navigates to a
 * case, switches its workspace tab and *then* moves focus, so anyone reading the
 * list could not predict what pressing it would do.
 *
 * Now each line says what actually happens, and the list is grouped, because the
 * grouping is real: some keys move you between cases, some act inside the case
 * you are already looking at, and some are chrome. That is three different kinds
 * of consequence, and a flat list hid the difference.
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useLayoutStore } from '@/store/layout-store';

interface Shortcut {
  keys: string;
  does: string;
}

const GROUPS: { title: string; note?: string; items: Shortcut[] }[] = [
  {
    title: 'Moving around',
    items: [
      { keys: 'Ctrl + K', does: 'Open the command palette and search everything by name.' },
      { keys: 'J', does: 'Open the next case in the queue.' },
      { keys: 'K', does: 'Open the previous case in the queue.' },
      { keys: 'Enter', does: 'Open the case currently highlighted in the queue.' },
      { keys: '/', does: 'Jump to this page’s filter, or open the palette if it has none.' },
    ],
  },
  {
    title: 'Inside a case',
    note: 'Each of these opens the case you were last on, if you are not already in one.',
    items: [
      { keys: 'E', does: 'Jump to step 4 — the features the model actually used.' },
      { keys: 'G', does: 'Jump to the entity network around this transaction.' },
      { keys: 'T', does: 'Jump to the log of what happened to this case, in order.' },
      { keys: 'C', does: 'Open the Copilot with the cursor already in it.' },
    ],
  },
  {
    title: 'The window itself',
    items: [
      { keys: 'Ctrl + B', does: 'Collapse the navigation rail to icons, or expand it again.' },
      { keys: '?', does: 'Open this list.' },
      { keys: 'Esc', does: 'Close whatever is open — palette, panel, notifications.' },
    ],
  },
];

export function ShortcutReference() {
  const open = useLayoutStore((state) => state.shortcutReferenceOpen);
  const setOpen = useLayoutStore((state) => state.setShortcutReferenceOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="max-w-lg rounded-xl"
        aria-describedby="shortcut-reference-description"
      >
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription id="shortcut-reference-description">
            Single letters work anywhere except inside a text field, so you can type without
            triggering them.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {GROUPS.map((group) => (
            <section key={group.title}>
              <h3 className="stamp text-muted-foreground">{group.title}</h3>
              {group.note && (
                <p className="text-muted-foreground mt-1.5 text-xs leading-relaxed">
                  {group.note}
                </p>
              )}
              <dl className="mt-2 grid gap-1">
                {group.items.map((item) => (
                  <div
                    key={item.keys}
                    className="grid grid-cols-[5.5rem_1fr] items-baseline gap-3 py-1"
                  >
                    <dt>
                      <kbd className="border-border bg-inset text-foreground/90 inline-block rounded border px-2 py-1 text-center font-mono text-[11px]">
                        {item.keys}
                      </kbd>
                    </dt>
                    <dd className="text-muted-foreground text-sm leading-relaxed">{item.does}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
