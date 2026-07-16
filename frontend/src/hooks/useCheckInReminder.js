import { useCallback, useEffect, useState } from 'react';
import apiClient from '../api/client';
import { getActiveCheckIn, getCheckInPhase, saveActiveCheckIn, clearActiveCheckIn } from '../lib/checkInReminder';

const POLL_MS = 30000;

export default function useCheckInReminder() {
  const [record, setRecord] = useState(() => getActiveCheckIn());

  useEffect(() => {
    const interval = setInterval(() => setRecord(getActiveCheckIn()), POLL_MS);
    return () => clearInterval(interval);
  }, []);

  const confirmStillHere = useCallback(async () => {
    if (!record) return;
    try {
      await apiClient.post(`/occupancy/${record.placeId}`, { level: record.level });
    } catch {
      // Backend 15 dk cooldown uygulasa da yerel hatırlatma penceresi yine de yenilenir.
    }
    setRecord(saveActiveCheckIn(record));
  }, [record]);

  const dismiss = useCallback(() => {
    clearActiveCheckIn();
    setRecord(null);
  }, []);

  return { phase: getCheckInPhase(record), record, confirmStillHere, dismiss };
}
