import { userLocalStorage } from '@/utils/userStorage';

export interface CurrentAttendanceItem {
  subjectCode: string;
  attended: number;
  total: number;
  percentage?: number;
}

const STORAGE_KEY = 'currentAttendance';

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

export function bumpCurrentAttendance(
  subjectCode: string,
  delta: { attended?: number; total?: number }
): CurrentAttendanceItem {
  const all = getCurrentAttendance();
  const index = all.findIndex((x) => x.subjectCode === subjectCode);
  const current = index >= 0 ? all[index] : { subjectCode, attended: 0, total: 0 };

  const next: CurrentAttendanceItem = {
    subjectCode,
    attended: Math.max(0, current.attended + (delta.attended ?? 0)),
    total: Math.max(0, current.total + (delta.total ?? 0)),
  };

  if (index >= 0) {
    all[index] = next;
  } else {
    all.push(next);
  }

  setCurrentAttendance(all);
  return next;
}
