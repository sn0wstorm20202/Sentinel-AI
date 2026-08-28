import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useInvestigationStore } from '@/store/investigation-store';
import { useNotificationStore } from '@/store/notification-store';
import { useConnectionStore } from '@/store/connection-store';
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

/**
 * Retry schedule, in ms, for a dropped stream. The last value repeats.
 *
 * `EventSource` only reconnects on its own after a *network-level* drop. When
 * the response is a fatal error — a 404, a 502 from the proxy, the wrong
 * content type, a Hugging Face Space that has gone to sleep — the browser marks
 * the source CLOSED and never tries again. The previous version of this file
 * called `.close()` in `onerror` and left a comment saying EventSource "usually
 * auto-reconnects", which guaranteed the opposite: one hiccup and the dashboard
 * went permanently deaf while still showing a live indicator.
 */
const BACKOFF_MS = [1_000, 2_000, 4_000, 8_000, 15_000];

/** Failures after which the stream is reported as offline rather than retrying. */
const OFFLINE_AFTER = 4;

export function useSSE() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((state) => state.addNotification);
  const addTimelineEvent = useInvestigationStore((state) => state.addTimelineEvent);

  /** Kept in a ref so reconnects don't re-run the effect and re-subscribe. */
  const attemptsRef = useRef(0);

  useEffect(() => {
    const { setStream, noteEvent } = useConnectionStore.getState();
    let source: EventSource | null = null;
    let retryTimer: number | undefined;
    let disposed = false;

    const handleMessage = (event: MessageEvent<string>) => {
      noteEvent();
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

    const connect = () => {
      if (disposed) return;
      setStream(attemptsRef.current === 0 ? 'connecting' : 'retrying', attemptsRef.current);

      source = new EventSource(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/v1/stream`);
      source.onmessage = handleMessage;

      source.onopen = () => {
        attemptsRef.current = 0;
        setStream('open', 0);
      };

      source.onerror = () => {
        // A CONNECTING readyState means the browser is handling the retry
        // itself; leave it alone and just report the state.
        if (source && source.readyState === EventSource.CONNECTING) {
          setStream('retrying', attemptsRef.current);
          return;
        }

        // CLOSED is fatal. Reconnect on our own schedule.
        source?.close();
        source = null;
        const attempt = attemptsRef.current;
        attemptsRef.current = attempt + 1;
        setStream(attempt + 1 >= OFFLINE_AFTER ? 'offline' : 'retrying', attempt + 1);

        const wait = BACKOFF_MS[Math.min(attempt, BACKOFF_MS.length - 1)];
        retryTimer = window.setTimeout(connect, wait);
      };
    };

    connect();

    return () => {
      disposed = true;
      if (retryTimer !== undefined) window.clearTimeout(retryTimer);
      source?.close();
    };
  }, [addNotification, addTimelineEvent, queryClient]);
}
