import { userLocalStorage } from '@/utils/userStorage';

export interface CurrentAttendanceItem {
  subjectCode: string;
  attended: number;
  total: number;
  percentage?: number;
}

const STORAGE_KEY = 'currentAttendance';
const BASELINE_KEY = 'currentAttendanceBaseline';

const ATTENDANCE_CHANGED_EVENT = 'currentAttendance:changed';
let emitScheduled = false;

function emitAttendanceChanged(): void {
  // localStorage 'storage' events do NOT fire in the same tab that made the change.
  // We dispatch our own event so Summary/Quick Update can refresh immediately.
  if (emitScheduled) return;
  emitScheduled = true;
  Promise.resolve().then(() => {
    emitScheduled = false;
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent(ATTENDANCE_CHANGED_EVENT));
  });
}

function normalizeSubjectCode(code: unknown): string {
  return String(code ?? '').trim();
}

function parseItems(raw: string | null): CurrentAttendanceItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((x) => x && typeof x.subjectCode === 'string')
      .map((x) => ({
        subjectCode: normalizeSubjectCode(x.subjectCode),
        attended: Number.isFinite(Number(x.attended)) ? Number(x.attended) : 0,
        total: Number.isFinite(Number(x.total)) ? Number(x.total) : 0,
        percentage: x.percentage != null ? Number(x.percentage) : undefined,
      }))
      .filter((x) => x.subjectCode.length > 0);
  } catch {
    return [];
  }
}

function mergeByMax(a: CurrentAttendanceItem[], b: CurrentAttendanceItem[]): CurrentAttendanceItem[] {
  const map = new Map<string, CurrentAttendanceItem>();
  [...a, ...b].forEach((x) => {
    const code = normalizeSubjectCode(x.subjectCode);
    if (!code) return;
    const prev = map.get(code);
    if (!prev) {
      map.set(code, { ...x, subjectCode: code });
      return;
    }

    map.set(code, {
      subjectCode: code,
      attended: Math.max(prev.attended ?? 0, x.attended ?? 0),
      total: Math.max(prev.total ?? 0, x.total ?? 0),
      percentage: x.percentage ?? prev.percentage,
    });
  });

  return Array.from(map.values());
}

export function getCurrentAttendance(): CurrentAttendanceItem[] {
  // Merge both user-specific and legacy/global keys so data never “disappears”
  const userRaw = userLocalStorage.getItem(STORAGE_KEY);
  const legacyRaw = localStorage.getItem(STORAGE_KEY);
  const fromUser = parseItems(userRaw);
  const fromLegacy = parseItems(legacyRaw);
  return mergeByMax(fromUser, fromLegacy);
}

export function setCurrentAttendance(items: CurrentAttendanceItem[]): void {
  const normalized = items.map((x) => {
    const attended = Math.max(0, Math.floor(x.attended));
    const total = Math.max(attended, Math.max(0, Math.floor(x.total)));
    return {
      subjectCode: normalizeSubjectCode(x.subjectCode),
      attended,
      total,
      percentage: x.percentage,
    };
  });

  const raw = JSON.stringify(normalized);
  localStorage.setItem(STORAGE_KEY, raw);
  userLocalStorage.setItem(STORAGE_KEY, raw);

  emitAttendanceChanged();
}

export function getCurrentAttendanceBaseline(): CurrentAttendanceItem[] {
  const userRaw = userLocalStorage.getItem(BASELINE_KEY);
  const legacyRaw = localStorage.getItem(BASELINE_KEY);
  return mergeByMax(parseItems(userRaw), parseItems(legacyRaw));
}

export function setCurrentAttendanceBaseline(items: CurrentAttendanceItem[]): void {
  const normalized = items.map((x) => {
    const attended = Math.max(0, Math.floor(x.attended));
    const total = Math.max(attended, Math.max(0, Math.floor(x.total)));
    return {
      subjectCode: normalizeSubjectCode(x.subjectCode),
      attended,
      total,
      percentage: x.percentage,
    };
  });

  const raw = JSON.stringify(normalized);
  localStorage.setItem(BASELINE_KEY, raw);
  userLocalStorage.setItem(BASELINE_KEY, raw);

  emitAttendanceChanged();
}

export function ensureCurrentAttendanceBaseline(initialItems?: CurrentAttendanceItem[]): void {
  const existing = getCurrentAttendanceBaseline();
  if (existing.length > 0) return;

  const seed = (initialItems && initialItems.length > 0) ? initialItems : getCurrentAttendance();
  const raw = JSON.stringify(
    seed.map((x) => {
      const attended = Math.max(0, Math.floor(x.attended));
      const total = Math.max(attended, Math.max(0, Math.floor(x.total)));
      return {
        subjectCode: normalizeSubjectCode(x.subjectCode),
        attended,
        total,
        percentage: x.percentage,
      };
    })
  );

  localStorage.setItem(BASELINE_KEY, raw);
  userLocalStorage.setItem(BASELINE_KEY, raw);

  emitAttendanceChanged();
}

export function bumpCurrentAttendance(
  subjectCode: string,
  delta: { attended?: number; total?: number }
): CurrentAttendanceItem {
  const code = normalizeSubjectCode(subjectCode);
  const all = getCurrentAttendance();
  const index = all.findIndex((x) => x.subjectCode === code);
  const current = index >= 0 ? all[index] : { subjectCode, attended: 0, total: 0 };

  const next: CurrentAttendanceItem = {
    subjectCode: code,
    attended: Math.max(0, current.attended + Math.max(0, delta.attended ?? 0)),
    total: Math.max(0, current.total + Math.max(0, delta.total ?? 0)),
  };

  // Prevent invalid states like 26/25
  if (next.total < next.attended) next.total = next.attended;

  if (index >= 0) {
    all[index] = next;
  } else {
    all.push(next);
  }

  setCurrentAttendance(all);
  return next;
}

export function sanitizeCurrentAttendance(): { changed: boolean } {
  const items = getCurrentAttendance();
  let changed = false;
  const next = items.map((x) => {
    const attended = Math.max(0, Math.floor(x.attended ?? 0));
    const total = Math.max(attended, Math.max(0, Math.floor(x.total ?? 0)));
    if (attended !== (x.attended ?? 0) || total !== (x.total ?? 0)) changed = true;
    return { ...x, attended, total };
  });

  if (changed) setCurrentAttendance(next);
  return { changed };
}

export function sanitizeCurrentAttendanceBaseline(): { changed: boolean } {
  const items = getCurrentAttendanceBaseline();
  if (items.length === 0) return { changed: false };

  let changed = false;
  const next = items.map((x) => {
    const attended = Math.max(0, Math.floor(x.attended ?? 0));
    const total = Math.max(attended, Math.max(0, Math.floor(x.total ?? 0)));
    if (attended !== (x.attended ?? 0) || total !== (x.total ?? 0)) changed = true;
    return { ...x, attended, total };
  });

  if (changed) {
    const raw = JSON.stringify(next);
    localStorage.setItem(BASELINE_KEY, raw);
    userLocalStorage.setItem(BASELINE_KEY, raw);
  }

  return { changed };
}

export function adjustCurrentAttendanceWithBaseline(
  subjectCode: string,
  delta: { attended?: number; total?: number }
): CurrentAttendanceItem {
  const code = normalizeSubjectCode(subjectCode);
  const all = getCurrentAttendance();
  const baseline = getCurrentAttendanceBaseline();

  const base = baseline.find((x) => x.subjectCode === code) ?? { subjectCode: code, attended: 0, total: 0 };
  const index = all.findIndex((x) => x.subjectCode === code);
  const current = index >= 0 ? all[index] : { subjectCode: code, attended: 0, total: 0 };

  let nextAttended = (current.attended ?? 0) + (delta.attended ?? 0);
  let nextTotal = (current.total ?? 0) + (delta.total ?? 0);

  nextAttended = Math.max(base.attended ?? 0, Math.floor(nextAttended));
  nextTotal = Math.max(base.total ?? 0, Math.floor(nextTotal));

  if (nextTotal < nextAttended) nextTotal = nextAttended;

  const next: CurrentAttendanceItem = { subjectCode: code, attended: nextAttended, total: nextTotal };

  if (index >= 0) all[index] = next;
  else all.push(next);

  setCurrentAttendance(all);
  return next;
}
