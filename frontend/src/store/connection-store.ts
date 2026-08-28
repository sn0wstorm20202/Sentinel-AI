import { create } from 'zustand';

/**
 * Transport state for the live event stream.
 *
 * This exists because the dashboard makes a visible claim — a breathing dot,
 * toasts that arrive on their own — that it is connected to something. When
 * that connection drops, the honest thing is to say so rather than to keep
 * showing a dot that means nothing. The System page reads this; so does the
 * sidebar's status line.
 */
export type StreamStatus =
  /** The first connection attempt is in flight. */
  | 'connecting'
  /** Connected, and the backend has spoken at least once. */
  | 'open'
  /** Dropped, and a retry is scheduled. `attempts` says how many have failed. */
  | 'retrying'
  /** Enough consecutive failures that the backend should be assumed down. */
  | 'offline';

interface ConnectionState {
  stream: StreamStatus;
  /** Consecutive failed connection attempts. Reset to 0 on a successful open. */
  attempts: number;
  /** Epoch ms of the last message received, or `null` if none ever arrived. */
  lastEventAt: number | null;
  setStream: (status: StreamStatus, attempts?: number) => void;
  noteEvent: () => void;
}

export const useConnectionStore = create<ConnectionState>((set) => ({
  stream: 'connecting',
  attempts: 0,
  lastEventAt: null,
  setStream: (status, attempts) =>
    set((prev) => ({
      stream: status,
      attempts: attempts ?? (status === 'open' ? 0 : prev.attempts),
    })),
  noteEvent: () => set({ lastEventAt: Date.now() }),
}));
