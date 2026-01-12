type ReportRow = {
  subjectCode: string;
  subjectName: string;
  attended: number;
  total: number;
  currentPercent: number;
  upcomingClasses: number;
  minAttendNextDaysToReachThreshold: number;
  maxMissNextDaysAndStayThreshold: number;
  classesToAttendToReachThresholdOverall: number;
  classesCanMissBeforeBelowThresholdOverall: number;
};

export type AttendanceReportModel = {
  generatedAtIso: string;
  thresholdPercent: number;
  planDays: number;
  overallPercent: number;
  overallAttended: number;
  overallTotal: number;
  rows: ReportRow[];
};
export function openAttendanceReportInNewTab(model: AttendanceReportModel): void {
  const win = window.open('/report', '_blank');
  if (!win) throw new Error('Popup blocked. Please allow popups to open the report.');

  // Send multiple times to avoid race where the report page listener isn't ready yet.
  const msg = { type: 'attendance-report', payload: model };
  const targetOrigin = window.location.origin;

  let attempts = 0;
  const timer = window.setInterval(() => {
    attempts += 1;
    try {
      win.postMessage(msg, targetOrigin);
    } catch {
      // ignore
    }
    if (attempts >= 20) window.clearInterval(timer);
  }, 250);

  try {
    win.postMessage(msg, targetOrigin);
  } catch {
    // ignore
  }

  win.focus();
}
