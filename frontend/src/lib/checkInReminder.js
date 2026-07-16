const STORAGE_KEY = 'wfh_active_checkin';
export const REMIND_AFTER_MINUTES = 60;
export const EXPIRE_AFTER_MINUTES = 90;

export function saveActiveCheckIn({ placeId, placeName, level }) {
  const record = { placeId, placeName, level, checkedInAt: Date.now() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  return record;
}

export function clearActiveCheckIn() {
  localStorage.removeItem(STORAGE_KEY);
}

export function getActiveCheckIn() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const record = JSON.parse(raw);
    const minutesSince = (Date.now() - record.checkedInAt) / 60000;
    if (minutesSince >= EXPIRE_AFTER_MINUTES) {
      clearActiveCheckIn();
      return null;
    }
    return record;
  } catch {
    clearActiveCheckIn();
    return null;
  }
}

// 'active'  -> hâlâ normal check-in penceresinde, hatırlatma yok
// 'remind'  -> "hâlâ burada mısın?" sorulmalı
// null      -> aktif check-in yok
export function getCheckInPhase(record) {
  if (!record) return null;
  const minutesSince = (Date.now() - record.checkedInAt) / 60000;
  if (minutesSince >= EXPIRE_AFTER_MINUTES) return null;
  if (minutesSince >= REMIND_AFTER_MINUTES) return 'remind';
  return 'active';
}
