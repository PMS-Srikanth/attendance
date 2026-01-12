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

function escapeHtml(value: unknown): string {
  const s = value == null ? '' : String(value);
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderHtml(model: AttendanceReportModel): string {
  const title = 'Attendance Report';
  const rowsHtml = model.rows
    .map((r) => {
      return `
        <tr>
          <td>${escapeHtml(r.subjectCode)}</td>
          <td>${escapeHtml(r.subjectName)}</td>
          <td class="num">${escapeHtml(r.attended)}</td>
          <td class="num">${escapeHtml(r.total)}</td>
          <td class="num">${escapeHtml(r.currentPercent.toFixed(1))}%</td>
          <td class="num">${escapeHtml(r.upcomingClasses)}</td>
          <td class="num">${escapeHtml(r.minAttendNextDaysToReachThreshold)}</td>
          <td class="num">${escapeHtml(r.maxMissNextDaysAndStayThreshold)}</td>
          <td class="num">${escapeHtml(r.classesToAttendToReachThresholdOverall)}</td>
          <td class="num">${escapeHtml(r.classesCanMissBeforeBelowThresholdOverall)}</td>
        </tr>
      `;
    })
    .join('');

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <style>
      :root {
        --bg: #0b1220;
        --card: #0f1b33;
        --text: #eaf2ff;
        --muted: rgba(234,242,255,.75);
        --accent: #22c55e;
        --border: rgba(234,242,255,.12);
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji";
        background: radial-gradient(1200px 600px at 10% 0%, rgba(20,184,166,.25), transparent 70%),
                    radial-gradient(1000px 700px at 90% 20%, rgba(59,130,246,.20), transparent 65%),
                    var(--bg);
        color: var(--text);
      }
      header {
        position: sticky;
        top: 0;
        backdrop-filter: blur(12px);
        background: rgba(11,18,32,.7);
        border-bottom: 1px solid var(--border);
        z-index: 10;
      }
      .wrap { max-width: 1200px; margin: 0 auto; padding: 18px 16px; }
      .row { display: flex; gap: 12px; align-items: center; justify-content: space-between; flex-wrap: wrap; }
      h1 { margin: 0; font-size: 22px; letter-spacing: .2px; }
      .meta { font-size: 12px; color: var(--muted); line-height: 1.4; }
      .actions { display: flex; gap: 10px; }
      button {
        appearance: none;
        border: 1px solid var(--border);
        background: rgba(255,255,255,.06);
        color: var(--text);
        padding: 10px 12px;
        border-radius: 10px;
        cursor: pointer;
        font-weight: 600;
      }
      button.primary { background: rgba(34,197,94,.15); border-color: rgba(34,197,94,.35); }
      button:hover { filter: brightness(1.08); }
      main .wrap { padding-top: 14px; padding-bottom: 36px; }
      .cards { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin: 14px 0 18px; }
      .card {
        background: rgba(15,27,51,.7);
        border: 1px solid var(--border);
        border-radius: 16px;
        padding: 14px;
      }
      .card .k { font-size: 12px; color: var(--muted); }
      .card .v { font-size: 24px; font-weight: 800; margin-top: 4px; }
      .table {
        width: 100%;
        border-collapse: collapse;
        overflow: hidden;
        border-radius: 16px;
        border: 1px solid var(--border);
        background: rgba(15,27,51,.6);
      }
      th, td { padding: 10px 10px; border-bottom: 1px solid var(--border); vertical-align: top; }
      th { text-align: left; font-size: 12px; color: var(--muted); text-transform: uppercase; letter-spacing: .06em; }
      td { font-size: 13px; }
      td.num { text-align: right; font-variant-numeric: tabular-nums; }
      tr:last-child td { border-bottom: none; }
      .hint { margin-top: 12px; font-size: 12px; color: var(--muted); }

      @media print {
        header { position: static; }
        button { display: none; }
        body { background: white; color: #111827; }
        .card, .table { background: white; border-color: #e5e7eb; }
        th { color: #4b5563; }
        td { color: #111827; }
      }
      @media (max-width: 980px) {
        .cards { grid-template-columns: 1fr; }
      }
    </style>
  </head>
  <body>
    <header>
      <div class="wrap">
        <div class="row">
          <div>
            <h1>${escapeHtml(title)}</h1>
            <div class="meta">
              Generated: ${escapeHtml(model.generatedAtIso)}<br />
              Threshold: ${escapeHtml(model.thresholdPercent)}% • Plan window: ${escapeHtml(model.planDays)} days
            </div>
          </div>
          <div class="actions">
            <button class="primary" onclick="window.print()">Print</button>
            <button onclick="window.close()">Close</button>
          </div>
        </div>
      </div>
    </header>

    <main>
      <div class="wrap">
        <section class="cards">
          <div class="card">
            <div class="k">Overall Attendance</div>
            <div class="v">${escapeHtml(model.overallPercent.toFixed(1))}%</div>
            <div class="meta">${escapeHtml(model.overallAttended)} / ${escapeHtml(model.overallTotal)} classes attended</div>
          </div>
          <div class="card">
            <div class="k">Threshold</div>
            <div class="v">${escapeHtml(model.thresholdPercent)}%</div>
            <div class="meta">Target minimum attendance</div>
          </div>
          <div class="card">
            <div class="k">Planning Window</div>
            <div class="v">${escapeHtml(model.planDays)} days</div>
            <div class="meta">Upcoming-class estimates</div>
          </div>
        </section>

        <table class="table">
          <thead>
            <tr>
              <th>Subject Code</th>
              <th>Subject Name</th>
              <th class="num">Attended</th>
              <th class="num">Total</th>
              <th class="num">Current %</th>
              <th class="num">Upcoming (${escapeHtml(model.planDays)}d)</th>
              <th class="num">Need attend next ${escapeHtml(model.planDays)}d</th>
              <th class="num">Can miss next ${escapeHtml(model.planDays)}d</th>
              <th class="num">To reach threshold (overall)</th>
              <th class="num">Can miss before below (overall)</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="hint">
          Tip: This report opens in a new tab and doesn’t save a file unless you print/save manually.
        </div>
      </div>
    </main>
  </body>
</html>`;
}

export function openAttendanceReportInNewTab(model: AttendanceReportModel): void {
  const win = window.open('', '_blank', 'noopener,noreferrer');
  if (!win) {
    throw new Error('Popup blocked. Please allow popups for this site to open the report.');
  }
  win.document.open();
  win.document.write(renderHtml(model));
  win.document.close();
  win.focus();
}
