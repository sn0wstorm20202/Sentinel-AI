'use client';

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Send, Bot, User, Sparkles, Database, Network } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useInvestigationStore } from "@/store/investigation-store";

interface Message {
  id: number;
  role: 'assistant' | 'user' | 'system';
  content: string;
}

export function CopilotPanel() {
  const params = useParams();
  const caseId = params?.id as string | undefined;
  const selectedNodeId = useInvestigationStore(s => s.selectedNodeId);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');

  // Contextual reset based on case selection
  useEffect(() => {
    if (caseId) {
      setMessages([
        { id: Date.now(), role: 'assistant', content: `I am connected to the knowledge graph for ${caseId}. Select a node or ask me to explain the SHAP values.` }
      ]);
    } else {
      setMessages([
        { id: Date.now(), role: 'assistant', content: 'Select a case from the queue to begin.' }
      ]);
    }
  }, [caseId]);

  // Contextual injection based on node selection
  useEffect(() => {
    if (selectedNodeId) {
      setMessages(prev => [...prev, { 
        id: Date.now(), 
        role: 'system', 
        content: `Node selected: ${selectedNodeId}. Highlighting local neighborhood...` 
      }]);
    }
  }, [selectedNodeId]);

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { id: Date.now(), role: 'user', content: input }]);
    setInput('');
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        role: 'assistant', 
        content: `Analyzing ${selectedNodeId ? `node ${selectedNodeId}` : 'the global case graph'}. SHAP feature contributions suggest elevated risk from connected IPs.` 
      }]);
    }, 500);
  };

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="px-3 py-2 border-b bg-muted/30 font-semibold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2 shrink-0">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        <span>Investigation Copilot</span>
      </div>

      <div className="flex-1 p-0 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="flex flex-col gap-3 p-3">
            {messages.map(m => {
              if (m.role === 'system') {
                return (
                  <div key={m.id} className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-wide justify-center my-2">
                    <Network className="h-3 w-3" />
                    <span>{m.content}</span>
                  </div>
                );
              }
              
              return (
                <div key={m.id} className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`flex-shrink-0 h-6 w-6 rounded flex items-center justify-center ${m.role === 'user' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    {m.role === 'user' ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                  </div>
                  <div className={`rounded px-2.5 py-1.5 max-w-[85%] text-xs ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted/50 border border-border/50 text-foreground'}`}>
                    {m.content}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      <div className="p-2 border-t bg-card shrink-0">
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex w-full items-center gap-1.5 relative">
          <Input
            placeholder={caseId ? "Ask Copilot..." : "Select a case first..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={!caseId}
            className="flex-1 h-8 text-xs pr-8 bg-muted/20"
          />
          <Button type="submit" size="icon" className="h-6 w-6 absolute right-1 top-1 rounded-sm bg-transparent hover:bg-muted text-muted-foreground hover:text-foreground shadow-none" disabled={!input.trim() || !caseId}>
            <Send className="h-3 w-3" />
          </Button>
        </form>
        <div className="flex items-center gap-2 mt-2 px-1 text-[9px] text-muted-foreground">
          <Database className="h-2.5 w-2.5" />
          <span>Connected to FIE Engine</span>
        </div>
      </div>
    </div>
  );
}
