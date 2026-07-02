'use client';

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";

import { useMotionVariants } from "@/lib/motion/use-motion-variants";

interface Message {
  id: number;
  role: 'assistant' | 'user';
  content: string;
}

export function CopilotPanel() {
  const { staggerContainerFast: containerV, fadeInItem: itemV } = useMotionVariants();

  const [messages, setMessages] = useState<Message[]>([
    { id: 1, role: 'assistant', content: 'Hello Investigator. I am analyzing the current case graph. How can I assist you today?' }
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { id: Date.now(), role: 'user', content: input }]);
    setInput('');
    setTimeout(() => {
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', content: 'I am processing your query across the knowledge graph and ML features...' }]);
    }, 600);
  };

  return (
    <Card className="h-full flex flex-col rounded-none border-0 shadow-none bg-transparent">
      <CardHeader className="border-b px-4 py-3 bg-muted/10">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold tracking-tight">
          <Sparkles className="h-4 w-4 text-primary" />
          Sentinel Copilot
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea className="h-full px-4 py-4">
          <motion.div
            className="flex flex-col gap-4"
            variants={containerV}
            initial="hidden"
            animate="visible"
          >
            <AnimatePresence initial={false}>
              {messages.map(m => (
                <motion.div
                  key={m.id}
                  variants={itemV}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0, transition: { duration: 0.1 } }}
                  layout
                  className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
                  style={{ willChange: 'opacity, transform' }}
                >
                  <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    {m.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>
                  <div className={`rounded-lg px-3 py-2 max-w-[85%] text-sm ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    {m.content}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </ScrollArea>
      </CardContent>

      <CardFooter className="p-3 border-t bg-background">
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex w-full items-center gap-2">
          <Input
            placeholder="Ask about this case..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 h-9"
          />
          <Button type="submit" size="icon" className="h-9 w-9" disabled={!input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
