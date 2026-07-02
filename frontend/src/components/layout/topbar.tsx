'use client';

import { Search, Bell, Bot, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLayoutStore } from "@/store/layout-store";
import { ThemeToggle } from "./theme-toggle";
import { useNotificationStore } from "@/store/notification-store";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function Topbar() {
  const setCommandPaletteOpen = useLayoutStore((state) => state.setCommandPaletteOpen);
  const setShortcutReferenceOpen = useLayoutStore((state) => state.setShortcutReferenceOpen);
  const setNotificationCenterOpen = useLayoutStore((state) => state.setNotificationCenterOpen);
  const unreadCount = useNotificationStore((state) => state.notifications.filter((item) => !item.read).length);

  const toggleCopilot = () => {
    const { activePanel, setActivePanel } = useLayoutStore.getState();
    setActivePanel(activePanel === 'copilot' ? null : 'copilot');
  };

  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-4">
      <div className="flex items-center gap-2 flex-1">
        <Button
          variant="outline"
          className="h-9 w-full max-w-sm justify-start text-muted-foreground"
          onClick={() => setCommandPaletteOpen(true)}
          data-sentinel-search="primary"
          aria-label="Open command palette"
        >
          <Search className="mr-2 h-4 w-4" />
          <span>Search everything...</span>
          <kbd className="ml-auto rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">Ctrl K</kbd>
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={() => setShortcutReferenceOpen(true)}
                aria-label="Open keyboard shortcuts"
              />
            }
          >
            <HelpCircle className="h-4 w-4" />
          </TooltipTrigger>
          <TooltipContent>Keyboard shortcuts</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={() => setNotificationCenterOpen(true)}
                aria-label={`Open notification center${unreadCount ? `, ${unreadCount} unread` : ''}`}
              />
            }
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-semibold leading-none text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </TooltipTrigger>
          <TooltipContent>Notifications</TooltipContent>
        </Tooltip>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2"
          onClick={toggleCopilot}
          aria-label="Toggle AI Copilot"
        >
          <Bot className="h-4 w-4 text-primary" />
          <span>AI Copilot</span>
        </Button>
      </div>
    </header>
  );
}
