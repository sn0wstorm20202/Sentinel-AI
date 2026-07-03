import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useInvestigationStore } from '@/store/investigation-store';
import { useNotificationStore } from '@/store/notification-store';
import { TimelineEventType } from '@/types';

interface StreamEvent {
  type?: string;
  message?: string;
  caseId?: string;
  case_id?: string;
  severity?: 'info' | 'success' | 'warning' | 'critical';
  category?: string;
  title?: string;
  timelineType?: TimelineEventType;
  eventType?: TimelineEventType;
  timestamp?: string;
  actor?: string;
  details?: string;
}

export function useSSE() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((state) => state.addNotification);
  const addTimelineEvent = useInvestigationStore((state) => state.addTimelineEvent);

  useEffect(() => {
    const eventSource = new EventSource(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/v1/stream`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as StreamEvent;
        const caseId = data.caseId ?? data.case_id;

        if (data.type === 'ping') {
          console.log('SSE connected:', data.message);
        } else if (data.type === 'heartbeat') {
          // Silent heartbeat
        } else if (data.type === 'new_case') {
          toast.warning(`New High-Risk Case Detected: ${caseId}`);
          addNotification({
            id: `new-case-${caseId}-${data.timestamp ?? Date.now()}`,
            title: 'New Case',
            message: data.message ?? `New high-risk case detected: ${caseId}`,
            category: 'case',
            severity: data.severity ?? 'warning',
            caseId,
          });
          queryClient.invalidateQueries({ queryKey: ['cases'] });
        } else if (data.type === 'mlops_alert') {
          toast.error(`MLOps Alert: ${data.message}`);
          addNotification({
            id: `mlops-${data.timestamp ?? Date.now()}`,
            title: data.title ?? 'Model Drift',
            message: data.message ?? 'MLOps alert emitted by Sentinel backend.',
            category: 'mlops',
            severity: data.severity ?? 'critical',
          });
          queryClient.invalidateQueries({ queryKey: ['mlops-metrics'] });
        } else if (data.type === 'case_updated') {
          addNotification({
            id: `update-${caseId}-${data.timestamp ?? Date.now()}`,
            title: data.title ?? 'Case Updated',
            message: data.message ?? `Case ${caseId} has been updated.`,
            category: 'case',
            severity: data.severity ?? 'info',
            caseId,
          });
          queryClient.invalidateQueries({ queryKey: ['cases'] });
          if (caseId) queryClient.invalidateQueries({ queryKey: ['cases', caseId] });
        } else if (data.type === 'model_promotion') {
          toast.success(`Model Promotion: ${data.message ?? 'A model was promoted to production'}`);
          addNotification({
            id: `mlops-promo-${data.timestamp ?? Date.now()}`,
            title: data.title ?? 'Model Promoted',
            message: data.message ?? 'A new model version was promoted in the Sentinel backend.',
            category: 'mlops',
            severity: data.severity ?? 'success',
          });
          queryClient.invalidateQueries({ queryKey: ['mlops-metrics'] });
        } else if (data.type === 'recommendation_updated') {
          addNotification({
            id: `recommendation-${caseId}-${data.timestamp ?? Date.now()}`,
            title: data.title ?? 'Recommendation Updated',
            message: data.message ?? `Recommendation updated for ${caseId}.`,
            category: 'recommendation',
            severity: data.severity ?? 'info',
            caseId,
          });
          queryClient.invalidateQueries({ queryKey: ['cases', caseId, 'explain'] });
        } else if (data.type === 'investigation_assigned') {
          addNotification({
            id: `assignment-${caseId}-${data.timestamp ?? Date.now()}`,
            title: data.title ?? 'Investigation Assigned',
            message: data.message ?? `Investigation assigned for ${caseId}.`,
            category: 'assignment',
            severity: data.severity ?? 'info',
            caseId,
          });
        } else if (data.type === 'system_health_alert') {
          addNotification({
            id: `system-${data.timestamp ?? Date.now()}`,
            title: data.title ?? 'System Health Alert',
            message: data.message ?? 'Sentinel backend emitted a health alert.',
            category: 'system',
            severity: data.severity ?? 'warning',
          });
        }

        if (caseId && (data.timelineType || data.eventType)) {
          const timelineType = (data.timelineType ?? data.eventType) as TimelineEventType;
          addTimelineEvent({
            id: `sse-${caseId}-${timelineType}-${data.timestamp ?? Date.now()}`,
            caseId,
            type: timelineType,
            title: data.title ?? 'Backend Event',
            timestamp: data.timestamp ?? new Date().toISOString(),
            actor: {
              name: data.actor ?? 'Sentinel Backend',
              type: data.type === 'copilot_completed' ? 'copilot' : 'system',
            },
            details: data.details ?? data.message ?? 'Backend event received from Sentinel stream.',
          });
        }
      } catch (e) {
        console.error('Failed to parse SSE event', e);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE Error:', error);
      eventSource.close();
      // Reconnect logic could go here, but EventSource usually auto-reconnects
    };

    return () => {
      eventSource.close();
    };
  }, [addNotification, addTimelineEvent, queryClient]);
}
