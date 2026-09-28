const OFFLINE_QUEUE_KEY = 'STSP_OFFLINE_INCIDENTS_QUEUE';
const DRAFT_REPORT_KEY = 'STSP_DRAFT_INCIDENT_REPORT';

// Offline Incidents Queue
export const saveOfflineIncident = (incident) => {
  const current = getOfflineIncidents();
  current.push({ ...incident, savedAt: new Date().toISOString(), localId: 'draft-' + Date.now() });
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(current));
};

export const getOfflineIncidents = () => {
  try {
    const data = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    return [];
  }
};

export const clearOfflineIncidents = () => {
  localStorage.removeItem(OFFLINE_QUEUE_KEY);
};

export const removeOfflineIncident = (localId) => {
  const current = getOfflineIncidents().filter((i) => i.localId !== localId);
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(current));
};

// Form Draft Storage for when user is typing / recording
export const saveDraftReport = (draft) => {
  try {
    localStorage.setItem(DRAFT_REPORT_KEY, JSON.stringify(draft));
  } catch (e) {
    console.warn('Unable to save draft to localStorage', e);
  }
};

export const getDraftReport = () => {
  try {
    const data = localStorage.getItem(DRAFT_REPORT_KEY);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
};

export const clearDraftReport = () => {
  localStorage.removeItem(DRAFT_REPORT_KEY);
};

// Auto-sync all offline incidents when network is restored
export const syncOfflineIncidents = async () => {
  const queue = getOfflineIncidents();
  if (queue.length === 0) return { success: true, count: 0 };

  let syncedCount = 0;
  const remaining = [];

  for (const item of queue) {
    try {
      const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      const data = await res.json();
      if (data.success) {
        syncedCount++;
      } else {
        remaining.push(item);
      }
    } catch (err) {
      remaining.push(item);
    }
  }

  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remaining));
  return { success: true, count: syncedCount, remaining: remaining.length };
};
