'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useLayoutStore } from '@/store/layout-store';

const SHORTCUTS = [
  ['Ctrl + K', 'Open command palette'],
  ['J', 'Next case'],
  ['K', 'Previous case'],
  ['Enter', 'Open selected case'],
  ['Esc', 'Close active panel'],
  ['/', 'Focus search'],
  ['G', 'Focus graph'],
  ['C', 'Focus Copilot'],
  ['E', 'Focus evidence'],
  ['T', 'Focus timeline'],
  ['?', 'Display shortcut reference'],
] as const;

export function ShortcutReference() {
  const open = useLayoutStore((state) => state.shortcutReferenceOpen);
  const setOpen = useLayoutStore((state) => state.setShortcutReferenceOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg rounded-lg" aria-describedby="shortcut-reference-description">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription id="shortcut-reference-description">
            Enterprise navigation is available from anywhere in the investigator workspace.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-1">
          {SHORTCUTS.map(([key, description]) => (
            <div
              key={key}
              className="grid grid-cols-[96px_1fr] items-center gap-3 rounded-md px-2 py-1.5 text-sm"
            >
              <kbd className="rounded border bg-muted px-2 py-1 text-center font-mono text-[11px] text-foreground">
                {key}
              </kbd>
              <span className="text-muted-foreground">{description}</span>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
