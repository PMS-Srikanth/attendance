import type { CalendarData, Holiday, SaturdayOverride } from '@/types/calendar';

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const;

type Weekday = (typeof WEEKDAYS)[number];

function asWeekday(value: unknown): Weekday | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return (WEEKDAYS as readonly string[]).includes(normalized) ? (normalized as Weekday) : null;
}

function inferHolidayType(name: string, description?: string): Holiday['type'] {
  const s = `${name} ${description ?? ''}`.toLowerCase();
  if (s.includes('exam')) return 'exam';
  if (s.includes('national')) return 'national';
  if (s.includes('college') || s.includes('university') || s.includes('institution')) return 'college';
  return 'other';
}

function normalizeDate(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim();
}

export function normalizeCalendarInput(raw: any): CalendarData {
  const semesterStartDate =
    raw?.semesterStartDate || raw?.semester_start || raw?.semesterStart || '2026-01-01';
  const semesterEndDate =
    raw?.semesterEndDate || raw?.semester_end || raw?.semesterEnd || '2026-05-31';

  const holidaysRaw: any[] = Array.isArray(raw?.holidays) ? raw.holidays : [];
  const holidays: Holiday[] = holidaysRaw
    .map((h) => {
      const date = normalizeDate(h?.date);
      const name = typeof h?.name === 'string' ? h.name.trim() : '';
      if (!date || !name) return null;
      const type: Holiday['type'] =
        h?.type && ['national', 'college', 'exam', 'other'].includes(String(h.type))
          ? (h.type as Holiday['type'])
          : inferHolidayType(name, h?.description);
      return { date, name, type };
    })
    .filter(Boolean) as Holiday[];

  // Accept multiple possible shapes for Saturday overrides.
  const overridesCandidates: any[] =
    (Array.isArray(raw?.saturdayOverrides) ? raw.saturdayOverrides : [])
      .concat(Array.isArray(raw?.saturday_overrides) ? raw.saturday_overrides : [])
      .concat(Array.isArray(raw?.working_saturdays) ? raw.working_saturdays : []);

  const saturdayOverrides: SaturdayOverride[] = overridesCandidates
    .map((o) => {
      // working_saturdays might be a string date array
      if (typeof o === 'string') {
        const date = normalizeDate(o);
        if (!date) return null;
        return { date, followsDay: 'Monday' as Weekday };
      }

      const date = normalizeDate(o?.date);
      if (!date) return null;

      const follows =
        asWeekday(o?.followsDay) ||
        asWeekday(o?.follows_day) ||
        asWeekday(o?.override_type) ||
        asWeekday(o?.overrideType);

      // If follows day isn't provided, default to Monday (user can edit in Planner).
      return { date, followsDay: follows ?? ('Monday' as Weekday) };
    })
    .filter(Boolean) as SaturdayOverride[];

  // De-dup by date
  const holidaysByDate = new Map<string, Holiday>();
  holidays.forEach((h) => holidaysByDate.set(h.date, h));

  const overridesByDate = new Map<string, SaturdayOverride>();
  saturdayOverrides.forEach((o) => overridesByDate.set(o.date, o));

  return {
    semesterStartDate: String(semesterStartDate),
    semesterEndDate: String(semesterEndDate),
    holidays: Array.from(holidaysByDate.values()).sort((a, b) => a.date.localeCompare(b.date)),
    saturdayOverrides: Array.from(overridesByDate.values()).sort((a, b) => a.date.localeCompare(b.date)),
  };
}

export function toBackendCalendarPayload(frontend: CalendarData): {
  semester_start: string;
  semester_end: string;
  holidays: Array<{ date: string; name: string; description?: string }>;
  working_saturdays: Array<{ date: string; saturday_type: string }>;
} {
  return {
    semester_start: frontend.semesterStartDate,
    semester_end: frontend.semesterEndDate,
    holidays: frontend.holidays.map((h) => ({
      date: h.date,
      name: h.name,
      description: h.type,
    })),
    // Backend only understands 1st/2nd/… Saturday patterns; we can’t represent followsDay.
    // Keep empty to avoid sending misleading data.
    working_saturdays: [],
  };
}
