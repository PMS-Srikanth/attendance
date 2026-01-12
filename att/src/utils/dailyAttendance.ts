import { userLocalStorage } from '@/utils/userStorage';

export interface DailySubjectDelta {
  subjectCode: string;
  totalDelta: number;
  attendedDelta: number;
}

export interface DailyAttendanceLog {
  dateIso: string; // yyyy-MM-dd (local)
  createdAtIso: string;
  updatedAtIso: string;
  subjects: DailySubjectDelta[];
}

const STORAGE_KEY = 'dailyAttendanceLog';

function parseMap(raw: string | null): Record<string, DailyAttendanceLog> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed as Record<string, DailyAttendanceLog>;
  } catch {
    return {};
  }
}

function mergeMaps(
  a: Record<string, DailyAttendanceLog>,
  b: Record<string, DailyAttendanceLog>
): Record<string, DailyAttendanceLog> {
  const out: Record<string, DailyAttendanceLog> = { ...b, ...a };
  return out;
}

function readAll(): Record<string, DailyAttendanceLog> {
  const userRaw = userLocalStorage.getItem(STORAGE_KEY);
  const legacyRaw = localStorage.getItem(STORAGE_KEY);
  return mergeMaps(parseMap(userRaw), parseMap(legacyRaw));
}

function writeAll(map: Record<string, DailyAttendanceLog>): void {
  const raw = JSON.stringify(map);
  localStorage.setItem(STORAGE_KEY, raw);
  userLocalStorage.setItem(STORAGE_KEY, raw);
}

export function getDailyLog(dateIso: string): DailyAttendanceLog | null {
  const all = readAll();
  return all[dateIso] ?? null;
}

export function upsertDailyLog(log: DailyAttendanceLog): void {
  const all = readAll();
  all[log.dateIso] = log;
  writeAll(all);
}

export function removeDailyLog(dateIso: string): void {
  const all = readAll();
  if (!(dateIso in all)) return;
  delete all[dateIso];
  writeAll(all);
}
