// A "study day" starts at 04:00 local time, so studying at 0300 after a night call
// still counts toward the day it belongs to.
const ROLLOVER_HOUR = 4;

export function dayKey(date = new Date()) {
  const d = new Date(date.getTime() - ROLLOVER_HOUR * 3600_000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Day keys compare as dates; this converts back to a Date at the rollover hour.
export function dayStart(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d, ROLLOVER_HOUR);
}

export function addDays(key, n) {
  const d = dayStart(key);
  d.setDate(d.getDate() + n);
  return dayKey(d);
}

export function daysBetween(a, b) {
  return Math.round((dayStart(b) - dayStart(a)) / 86_400_000);
}

// End of the current study day: anything due before this counts as due today.
export function endOfDay(key = dayKey()) {
  return dayStart(addDays(key, 1));
}
