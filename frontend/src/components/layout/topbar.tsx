'use client';

import { Search, Bell, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLayoutStore } from "@/store/layout-store";
import { ThemeToggle } from "./theme-toggle";

export function Topbar() {
  const toggleCopilot = () => {
    const { activePanel, setActivePanel } = useLayoutStore.getState();
    setActivePanel(activePanel === 'copilot' ? null : 'copilot');
  };

  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-4">
      <div className="flex items-center gap-2 flex-1">
        <Button variant="outline" className="w-full max-w-sm justify-start text-muted-foreground h-9">
          <Search className="mr-2 h-4 w-4" />
          <span>Search everything... (Cmd+K)</span>
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-destructive" />
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2"
          onClick={toggleCopilot}
        >
          <Bot className="h-4 w-4 text-primary" />
          <span>AI Copilot</span>
        </Button>
      </div>
    </header>
  );
}
