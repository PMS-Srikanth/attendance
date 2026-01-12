import React, { useEffect, useMemo, useState } from 'react';
import type { AttendanceReportModel } from '@/utils/reportWindow';

type AttendanceReportMessage = { type: 'attendance-report'; payload: AttendanceReportModel };

function isAttendanceReportMessage(data: unknown): data is AttendanceReportMessage {
  if (!data || typeof data !== 'object') return false;
  const d = data as { type?: unknown; payload?: unknown };
  if (d.type !== 'attendance-report') return false;
  const p = d.payload as Partial<AttendanceReportModel> | undefined;
  return Boolean(
    p &&
      typeof p.generatedAtIso === 'string' &&
      typeof p.thresholdPercent === 'number' &&
      typeof p.planDays === 'number' &&
      typeof p.overallPercent === 'number' &&
      typeof p.overallAttended === 'number' &&
      typeof p.overallTotal === 'number' &&
      Array.isArray(p.rows)
  );
}

export const ReportPage: React.FC = () => {
  const [model, setModel] = useState<AttendanceReportModel | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      // Only accept same-origin messages.
      if (event.origin !== window.location.origin) return;

      if (!isAttendanceReportMessage(event.data)) return;
      setModel(event.data.payload);
      setError(null);
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  const rows = useMemo(() => model?.rows ?? [], [model]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <div className="sticky top-0 z-10 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-bold tracking-tight">Attendance Report</h1>
              {model ? (
                <div className="mt-1 text-xs text-slate-300">
                  Generated: {model.generatedAtIso} • Threshold: {model.thresholdPercent}% • Plan window: {model.planDays} days
                </div>
              ) : (
                <div className="mt-1 text-xs text-slate-300">Waiting for report data…</div>
              )}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                onClick={() => window.print()}
                className="rounded-xl border border-emerald-400/30 bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-100 hover:bg-emerald-500/25"
              >
                Print
              </button>
              <button
                onClick={() => window.close()}
                className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-white/10"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6">
        {error ? (
          <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4 text-rose-100">
            {error}
          </div>
        ) : null}

        {!model ? (
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-slate-200">
            If this page stays blank, go back and click “Export Report” again. If your browser blocks popups, allow popups for this site.
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-3 mt-2">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <div className="text-xs text-slate-300">Overall Attendance</div>
                <div className="mt-1 text-3xl font-extrabold">{model.overallPercent.toFixed(1)}%</div>
                <div className="mt-1 text-xs text-slate-300">
                  {model.overallAttended} / {model.overallTotal} classes attended
                </div>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <div className="text-xs text-slate-300">Threshold</div>
                <div className="mt-1 text-3xl font-extrabold">{model.thresholdPercent}%</div>
                <div className="mt-1 text-xs text-slate-300">Target minimum attendance</div>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <div className="text-xs text-slate-300">Planning Window</div>
                <div className="mt-1 text-3xl font-extrabold">{model.planDays} days</div>
                <div className="mt-1 text-xs text-slate-300">Upcoming-class estimates</div>
              </div>
            </div>

            <div className="mt-6 overflow-x-auto rounded-3xl border border-white/10 bg-white/5">
              <table className="min-w-full divide-y divide-white/10">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-300">Subject</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-300">Name</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-300">Attended</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-300">Total</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-300">Current %</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-300">Upcoming</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-300">Need attend next</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-300">Can miss next</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-300">To reach threshold</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-300">Can miss before below</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {rows.map((r) => (
                    <tr key={r.subjectCode}>
                      <td className="px-4 py-3 text-sm font-semibold">{r.subjectCode}</td>
                      <td className="px-4 py-3 text-sm text-slate-200">{r.subjectName}</td>
                      <td className="px-4 py-3 text-right text-sm tabular-nums">{r.attended}</td>
                      <td className="px-4 py-3 text-right text-sm tabular-nums">{r.total}</td>
                      <td className="px-4 py-3 text-right text-sm tabular-nums">{r.currentPercent.toFixed(1)}%</td>
                      <td className="px-4 py-3 text-right text-sm tabular-nums">{r.upcomingClasses}</td>
                      <td className="px-4 py-3 text-right text-sm tabular-nums">{r.minAttendNextDaysToReachThreshold}</td>
                      <td className="px-4 py-3 text-right text-sm tabular-nums">{r.maxMissNextDaysAndStayThreshold}</td>
                      <td className="px-4 py-3 text-right text-sm tabular-nums">{r.classesToAttendToReachThresholdOverall}</td>
                      <td className="px-4 py-3 text-right text-sm tabular-nums">{r.classesCanMissBeforeBelowThresholdOverall}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-3 text-xs text-slate-300">
              This report is rendered in a new tab and doesn’t create downloads unless you print/save manually.
            </div>
          </>
        )}
      </div>
    </div>
  );
};
