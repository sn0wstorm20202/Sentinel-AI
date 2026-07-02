'use client';

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { Send, Bot, User, Sparkles, Database, Network, Lightbulb, ShieldQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useInvestigationStore } from "@/store/investigation-store";
import { apiClient } from "@/lib/api/client";
import { GraphNetwork, InvestigationCase } from "@/types";

const QUICK_ACTIONS = [
  'Explain this transaction',
  'Explain this graph',
  'Explain this recommendation',
  'Show evidence',
  'Show AML policy',
  'Why was this flagged?',
  'Why is this community suspicious?',
  'Compare with similar fraud patterns',
  'Explain confidence score',
  'Suggest next investigation step',
];

function summarizeCase(caseData: InvestigationCase) {
  const summaryObj = caseData.intelligence.natural_language_summary;
  return typeof summaryObj === 'string'
    ? summaryObj
    : summaryObj?.hypothesis_explanation || 'Backend case summary was not returned.';
}

function formatRecommendations(caseData: InvestigationCase) {
  const recommendations = caseData.action_engine.recommendations ?? caseData.action_engine.recommended_actions ?? [];
  if (recommendations.length === 0) {
    return 'The backend did not return recommendations for this case.';
  }

  return recommendations
    .map((item) => `${item.priority}. ${item.action}: ${item.reason}`)
    .join('\n');
}

function formatEvidence(caseData: InvestigationCase) {
  const evidence = caseData.intelligence.evidence ?? [];
  if (evidence.length === 0) {
    const features = Array.from(
      new Set((caseData.intelligence.fraud_hypotheses || (caseData.intelligence as any).hypotheses || []).flatMap((hypothesis: any) => hypothesis.supporting_features))
    );
    return features.length > 0
      ? `Backend did not return SHAP evidence rows, but hypotheses cite these supporting features: ${features.join(', ')}.`
      : 'The backend did not return evidence rows for this case.';
  }

  return evidence
    .slice()
    .sort((a, b) => a.rank - b.rank)
    .map((item) => `${item.rank}. ${item.feature_id} (${item.direction}, weight ${item.importance_score.toFixed(3)}, confidence ${(item.confidence * 100).toFixed(0)}%)`)
    .join('\n');
}

async function buildCopilotAnswer(caseId: string, prompt: string, selectedNodeId: string | null) {
  const normalizedPrompt = prompt.toLowerCase();
  const response = await apiClient.get<InvestigationCase>(`/api/v1/cases/${caseId}/explain`);
  const caseData = response.data;

  if (normalizedPrompt.includes('graph')) {
    const graphResponse = await apiClient.get<GraphNetwork>(`/api/v1/graph/network/${caseId}`);
    const communities = new Set(graphResponse.data.nodes.map((node) => String(node.data.community ?? 'Unassigned')));
    return `Backend graph context for ${caseId}: ${graphResponse.data.nodes.length} entities, ${graphResponse.data.edges.length} relationships, ${communities.size} communities. Selected node: ${selectedNodeId ?? 'none'}. High-risk entities: ${graphResponse.data.nodes.filter((node) => (node.data.risk_score ?? 0) >= 80).length}.`;
  }

  if (normalizedPrompt.includes('recommendation') || normalizedPrompt.includes('next investigation step')) {
    return `Backend recommendations for ${caseId}:\n${formatRecommendations(caseData)}`;
  }

  if (normalizedPrompt.includes('evidence')) {
    return `Backend evidence for ${caseId}:\n${formatEvidence(caseData)}`;
  }

  if (normalizedPrompt.includes('aml policy') || normalizedPrompt.includes('policy')) {
    const recommendations = formatRecommendations(caseData);
    return recommendations.includes('did not return')
      ? 'The current backend case response did not include an AML policy artifact.'
      : `AML/policy-linked backend recommendation context:\n${recommendations}`;
  }

  if (normalizedPrompt.includes('community')) {
    if (!selectedNodeId) {
      return 'Select a graph entity first. The backend graph response is required to identify the active community.';
    }

    const graphResponse = await apiClient.get<GraphNetwork>(`/api/v1/graph/network/${caseId}`);
    const selectedNode = graphResponse.data.nodes.find((node) => node.id === selectedNodeId);
    if (!selectedNode?.data.community) {
      return `The backend graph response did not include community metadata for ${selectedNodeId}.`;
    }

    const communityResponse = await apiClient.get<Record<string, string | number | null>>(
      `/api/v1/graph/community/${selectedNode.data.community}`
    );
    return `Backend community profile for ${selectedNode.data.community}:\n${Object.entries(communityResponse.data)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n')}`;
  }

  if (normalizedPrompt.includes('similar fraud patterns') || normalizedPrompt.includes('confidence')) {
    const hypotheses = caseData.intelligence.fraud_hypotheses || (caseData.intelligence as any).hypotheses || [];
    if (hypotheses.length === 0) {
      return 'The backend did not return fraud hypotheses for comparison.';
    }
    return `Backend fraud hypotheses for ${caseId}:\n${hypotheses
      .map((item) => `${item.name}: ${(item.confidence * 100).toFixed(0)}% confidence, features ${item.supporting_features.join(', ')}`)
      .join('\n')}`;
  }

  if (normalizedPrompt.includes('flagged') || normalizedPrompt.includes('transaction')) {
    return `Backend explanation for ${caseId}: ${summarizeCase(caseData)}\nRisk score: ${caseData.risk_assessment.risk_score}/100 (${caseData.risk_assessment.risk_tier}), probability ${(caseData.risk_assessment.probability * 100).toFixed(1)}%.`;
  }

  return `Backend summary for ${caseId}: ${summarizeCase(caseData)}`;
}

export function CopilotPanel() {
  const params = useParams();
  const caseId = params?.id as string | undefined;
  
  const { 
    selectedNodeId, 
    messages, 
    addMessage, 
    replaceMessage,
    lastCaseContext, 
    setLastCaseContext,
    addTimelineEvent,
  } = useInvestigationStore();

  const [input, setInput] = useState('');
  const [pending, setPending] = useState(false);
  
  const lastNodeRef = useRef<string | null>(null);

  // Contextual injection based on case selection
  useEffect(() => {
    if (caseId && caseId !== lastCaseContext) {
      setLastCaseContext(caseId);
      addMessage({ 
        id: Date.now(), 
        role: 'system', 
        content: `Connected to knowledge graph for case: ${caseId}.` 
      });
    }
  }, [caseId, lastCaseContext, setLastCaseContext, addMessage]);

  // Contextual injection based on node selection
  useEffect(() => {
    if (selectedNodeId && selectedNodeId !== lastNodeRef.current) {
      lastNodeRef.current = selectedNodeId;
      addMessage({ 
        id: Date.now(), 
        role: 'system', 
        content: `Node selected: ${selectedNodeId}. Highlighting local neighborhood...` 
      });
    }
  }, [selectedNodeId, addMessage]);

  const handleSend = async (prompt = input) => {
    if (!prompt.trim() || pending) return;
    addMessage({ id: crypto.randomUUID(), role: 'user', content: prompt });
    setInput('');
    setPending(true);
    
    // Add loading message
    const loadingId = crypto.randomUUID();
    addMessage({ id: loadingId, role: 'assistant', content: 'Querying Sentinel backend...', pending: true });
    
    try {
      if (caseId) {
        const answer = await buildCopilotAnswer(caseId, prompt, selectedNodeId);
        replaceMessage(loadingId, { 
          id: loadingId, 
          role: 'assistant', 
          content: answer,
        });
        addTimelineEvent({
          id: `${caseId}-copilot-${crypto.randomUUID()}`,
          caseId,
          type: 'copilot_completed',
          title: 'Copilot Analysis Completed',
          timestamp: new Date().toISOString(),
          actor: { name: 'Investigation Copilot', type: 'copilot' },
          details: `Backend-backed Copilot prompt completed: ${prompt}`,
        });
      } else {
        replaceMessage(loadingId, { 
          id: loadingId, 
          role: 'assistant', 
          content: 'No active case context. Please select a case from the queue first.' 
        });
      }
    } catch {
      replaceMessage(loadingId, { 
        id: loadingId, 
        role: 'assistant', 
        content: 'Error communicating with Sentinel backend.' 
      });
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="px-3 py-2 border-b bg-muted/30 font-semibold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2 shrink-0">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        <span>Investigation Copilot</span>
      </div>

      <div className="border-b bg-card/60 p-2">
        <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          <ShieldQuestion className="h-3 w-3" />
          Analyst prompts
        </div>
        <div className="flex max-h-24 flex-wrap gap-1 overflow-y-auto">
          {QUICK_ACTIONS.map((action) => (
            <Button
              key={action}
              variant="outline"
              size="xs"
              disabled={!caseId || pending}
              onClick={() => handleSend(action)}
              className="h-6 text-[10px]"
            >
              <Lightbulb className="h-3 w-3" />
              {action}
            </Button>
          ))}
        </div>
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
                  <div className={`whitespace-pre-wrap rounded px-2.5 py-1.5 max-w-[85%] text-xs ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted/50 border border-border/50 text-foreground'} ${m.pending ? 'animate-pulse' : ''}`}>
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
            disabled={!caseId || pending}
            className="flex-1 h-8 text-xs pr-8 bg-muted/20"
            data-sentinel-copilot-input
            aria-label="Ask Investigation Copilot"
          />
          <Button type="submit" size="icon-xs" className="absolute right-1 top-1 bg-transparent hover:bg-muted text-muted-foreground hover:text-foreground shadow-none" disabled={!input.trim() || !caseId || pending}>
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
