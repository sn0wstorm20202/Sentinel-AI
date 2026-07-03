'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Bookmark, Pin, Star, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCases } from '@/lib/api/hooks/use-cases';
import { useInvestigationStore } from '@/store/investigation-store';
import { cn } from '@/lib/utils';

export function WorkspaceTabs() {
  const router = useRouter();
  const params = useParams();
  const activeCaseId = params?.id as string | undefined;
  const { data: cases = [] } = useCases();
  const openTabs = useInvestigationStore((state) => state.openTabs);
  const recentCases = useInvestigationStore((state) => state.recentCases);
  const pinnedInvestigations = useInvestigationStore((state) => state.pinnedInvestigations);
  const bookmarks = useInvestigationStore((state) => state.bookmarks);
  const closeInvestigationTab = useInvestigationStore((state) => state.closeInvestigationTab);
  const togglePinnedInvestigation = useInvestigationStore((state) => state.togglePinnedInvestigation);
  const toggleBookmark = useInvestigationStore((state) => state.toggleBookmark);

  const tabs = openTabs.filter((caseId) => cases.some((item) => item.id === caseId));

  if (tabs.length === 0 && recentCases.length === 0) {
    return null;
  }

  return (
    <div className="border-b bg-background">
      {tabs.length > 0 && (
        <div className="flex h-9 items-center gap-1 overflow-x-auto px-2">
          {tabs.map((caseId) => {
            const item = cases.find((caseItem) => caseItem.id === caseId);
            const active = activeCaseId === caseId;
            const pinned = pinnedInvestigations.includes(caseId);
            const bookmarked = bookmarks.includes(caseId);

            return (
              <div
                key={caseId}
                className={cn(
                  'flex h-7 shrink-0 items-center gap-1 rounded-md border px-1.5 text-xs',
                  active ? 'border-primary bg-primary/10' : 'border-border bg-muted/20'
                )}
              >
                <Link href={`/cases/${caseId}`} className="flex items-center gap-1.5">
                  <span className="font-mono">{caseId}</span>
                  {item && (
                    <Badge variant={item.risk === 'Critical' ? 'destructive' : 'outline'} size="sm">
                      {item.risk}
                    </Badge>
                  )}
                </Link>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => togglePinnedInvestigation(caseId)}
                  aria-label={pinned ? `Unpin ${caseId}` : `Pin ${caseId}`}
                  className={pinned ? 'text-primary' : 'text-muted-foreground'}
                >
                  <Pin className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => toggleBookmark(caseId)}
                  aria-label={bookmarked ? `Remove bookmark for ${caseId}` : `Bookmark ${caseId}`}
                  className={bookmarked ? 'text-primary' : 'text-muted-foreground'}
                >
                  <Bookmark className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => {
                    closeInvestigationTab(caseId);
                    if (active) router.push('/cases');
                  }}
                  aria-label={`Close ${caseId}`}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex min-h-8 items-center gap-2 overflow-x-auto border-t bg-muted/10 px-3 py-1 text-[10px] uppercase tracking-wide text-muted-foreground">
        <span className="flex items-center gap-1">
          <Pin className="h-3 w-3" />
          Pinned
        </span>
        {pinnedInvestigations.length > 0 ? (
          pinnedInvestigations.map((caseId) => (
            <Link key={caseId} href={`/cases/${caseId}`} className="rounded border px-1.5 py-0.5 font-mono hover:bg-muted">
              {caseId}
            </Link>
          ))
        ) : (
          <span>None</span>
        )}
        <span className="ml-2 flex items-center gap-1">
          <Bookmark className="h-3 w-3" />
          Bookmarks
        </span>
        {bookmarks.length > 0 ? (
          bookmarks.slice(0, 6).map((caseId) => (
            <Link key={caseId} href={`/cases/${caseId}`} className="rounded border px-1.5 py-0.5 font-mono hover:bg-muted">
              {caseId}
            </Link>
          ))
        ) : (
          <span>None</span>
        )}
        <span className="ml-2 flex items-center gap-1">
          <Star className="h-3 w-3" />
          Recent
        </span>
        {recentCases.length > 0 ? (
          recentCases.slice(0, 6).map((caseId) => (
            <Link key={caseId} href={`/cases/${caseId}`} className="rounded border px-1.5 py-0.5 font-mono hover:bg-muted">
              {caseId}
            </Link>
          ))
        ) : (
          <span>None</span>
        )}
      </div>
    </div>
  );
}
