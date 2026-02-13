const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export type TrackAction = 'signup' | 'first_chat' | 'itinerary_created' | 'trip_confirmed' | 'share_used';

export function trackEvent(action: TrackAction, userId?: number) {
  fetch(`${API_BASE}/api/track-event`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, userId }),
  }).catch(() => {});
}
