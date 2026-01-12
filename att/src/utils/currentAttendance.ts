import { userLocalStorage } from '@/utils/userStorage';

export interface CurrentAttendanceItem {
  subjectCode: string;
  attended: number;
  total: number;
  percentage?: number;
}

const STORAGE_KEY = 'currentAttendance';
const BASELINE_KEY = 'currentAttendanceBaseline';

export function getCurrentAttendance(): CurrentAttendanceItem[] {
  const raw = userLocalStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((x) => x && typeof x.subjectCode === 'string')
      .map((x) => ({
        subjectCode: String(x.subjectCode),
        attended: Number.isFinite(Number(x.attended)) ? Number(x.attended) : 0,
        total: Number.isFinite(Number(x.total)) ? Number(x.total) : 0,
        percentage: x.percentage != null ? Number(x.percentage) : undefined,
      }));
  } catch {
    return [];
  }
}

export function setCurrentAttendance(items: CurrentAttendanceItem[]): void {
  const normalized = items.map((x) => ({
    subjectCode: x.subjectCode,
    attended: Math.max(0, Math.floor(x.attended)),
    total: Math.max(0, Math.floor(x.total)),
    percentage: x.percentage,
  }));

  const raw = JSON.stringify(normalized);
  localStorage.setItem(STORAGE_KEY, raw);
  userLocalStorage.setItem(STORAGE_KEY, raw);
}

export function getCurrentAttendanceBaseline(): CurrentAttendanceItem[] {
  const raw = userLocalStorage.getItem(BASELINE_KEY) ?? localStorage.getItem(BASELINE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((x) => x && typeof x.subjectCode === 'string')
      .map((x) => ({
        subjectCode: String(x.subjectCode),
        attended: Number.isFinite(Number(x.attended)) ? Number(x.attended) : 0,
        total: Number.isFinite(Number(x.total)) ? Number(x.total) : 0,
        percentage: x.percentage != null ? Number(x.percentage) : undefined,
      }));
  } catch {
    return [];
  }
}

export function ensureCurrentAttendanceBaseline(initialItems?: CurrentAttendanceItem[]): void {
  const existing = getCurrentAttendanceBaseline();
  if (existing.length > 0) return;

  const seed = (initialItems && initialItems.length > 0) ? initialItems : getCurrentAttendance();
  const raw = JSON.stringify(
    seed.map((x) => ({
      subjectCode: x.subjectCode,
      attended: Math.max(0, Math.floor(x.attended)),
      total: Math.max(0, Math.floor(x.total)),
      percentage: x.percentage,
    }))
  );

  localStorage.setItem(BASELINE_KEY, raw);
  userLocalStorage.setItem(BASELINE_KEY, raw);
}

export function bumpCurrentAttendance(
  subjectCode: string,
  delta: { attended?: number; total?: number }
): CurrentAttendanceItem {
  const all = getCurrentAttendance();
  const index = all.findIndex((x) => x.subjectCode === subjectCode);
  const current = index >= 0 ? all[index] : { subjectCode, attended: 0, total: 0 };

  const next: CurrentAttendanceItem = {
    subjectCode,
    attended: Math.max(0, current.attended + Math.max(0, delta.attended ?? 0)),
    total: Math.max(0, current.total + Math.max(0, delta.total ?? 0)),
  };

  if (index >= 0) {
    all[index] = next;
  } else {
    all.push(next);
  }

  setCurrentAttendance(all);
  return next;
}

export function adjustCurrentAttendanceWithBaseline(
  subjectCode: string,
  delta: { attended?: number; total?: number }
): CurrentAttendanceItem {
  const all = getCurrentAttendance();
  const baseline = getCurrentAttendanceBaseline();

  const base = baseline.find((x) => x.subjectCode === subjectCode) ?? { subjectCode, attended: 0, total: 0 };
  const index = all.findIndex((x) => x.subjectCode === subjectCode);
  const current = index >= 0 ? all[index] : { subjectCode, attended: 0, total: 0 };

  let nextAttended = (current.attended ?? 0) + (delta.attended ?? 0);
  let nextTotal = (current.total ?? 0) + (delta.total ?? 0);

  nextAttended = Math.max(base.attended ?? 0, Math.floor(nextAttended));
  nextTotal = Math.max(base.total ?? 0, Math.floor(nextTotal));

  if (nextTotal < nextAttended) nextTotal = nextAttended;

  const next: CurrentAttendanceItem = { subjectCode, attended: nextAttended, total: nextTotal };

  if (index >= 0) all[index] = next;
  else all.push(next);

  setCurrentAttendance(all);
  return next;
}
