# AttendEase — User Flow (Shareable)

This is the simplest “how to use the site” flow you can share in a class group so everyone can start using it without confusion.

---

## 0) What this site does (1 line)
AttendEase helps you upload your timetable + your current attendance, then it tells you what you can safely miss/need to attend to stay **≥ 75%**.

---

## 1) 60‑second onboarding (for everyone)
1. Open the site link.
2. **Sign in with Google**.
3. Go to **Upload**.
4. Upload your **Timetable JSON** (or paste JSON).
5. *(Optional)* Upload **Attendance CSV** if you have current attendance already.
6. Click **Upload / Continue** → you’ll land on **Review**.
7. Click **Continue** → go to **Planner** and start marking upcoming classes as **Planned Present / Planned Absent**.
8. Go to **Summary** → click **View Report** if you want a printable report.

That’s it.

---

## 2) Full user flow (page by page)

### A) Login (Google Auth)
**Goal:** Create a user session so your data is saved per user.
- If you aren’t logged in, the app redirects you to the Login page.
- After login, you can access all pages.

**Tip:** If you get stuck in login, try refreshing once.

---

### B) Upload (First-time setup)
**Goal:** Get your timetable into the system (required) and optionally import current attendance.

**You can provide timetable in 2 ways:**
- **Upload a `.json` file**, or
- Switch to **Paste JSON** and paste your timetable JSON.

**Optional:** Upload an attendance CSV to preload your current attendance (saves time).

**What happens after you upload:**
- Timetable is uploaded to the backend.
- The app generates the internal “class instances” used for tracking.
- If you uploaded attendance, it tries to match your records to the timetable subjects.
- You are auto‑redirected to **Review**.

**Common issues:**
- If the timetable isn’t JSON → the app will reject it. Convert your timetable to JSON using the provided template.

---

### C) Review (Sanity check + edits)
**Goal:** Confirm your timetable looks correct and fix small issues.

What you can do here:
- **See your weekly timetable grid** (subjects, slots, labs).
- **Reschedule** a class by enabling edit mode:
  - Click a class cell → then click a destination slot.
  - If the destination has a class, it swaps.
- **Enter / adjust current attendance manually** (there is a manual attendance form/modal).

When everything looks correct:
- Click **Continue** → goes to **Planner**.

**If you see “No data found”:**
- It means timetable/calendar isn’t loaded. Go back to **Upload** and upload again.

---

### D) Planner (Daily use — your main screen)
**Goal:** Plan attendance for upcoming classes and get warnings before you fall below 75%.

What you do here:
- The planner shows **upcoming classes** (next **14 days** by default).
- For each class, you mark:
  - **Planned Present**, or
  - **Planned Absent**
- The app shows **warnings** if your current/projected attendance is near/below **75%**.

Calendar controls (important):
- You can manage **Holidays** and **Saturday overrides** here.
  - Holidays remove classes from those dates.
  - Saturday overrides let a Saturday follow a weekday timetable.

Buttons:
- **Load More Days** adds more upcoming days.
- **View Summary** takes you to Summary.

---

### E) Summary (Numbers + what‑if)
**Goal:** See your current + projected attendance per subject, and how many classes you can miss/need to attend.

What you’ll see:
- Overall % + subject‑wise cards and charts.
- “At risk” subjects.
- Planning window calculations (e.g., “Need to attend next X classes”).

Actions:
- **View Report** opens a printable report in a new tab.

---

### F) Report (Print / share)
**Goal:** Get a clean printable report.

- This opens in a **new tab**.
- Click **Print** to save as PDF or print.

**If the report page looks blank:**
- Your browser likely blocked the popup. Allow popups for the site, then click **View Report** again.

---

## 3) “How do I start if I don’t have files?”

### Timetable
Use the timetable JSON template from the site’s public templates (or ask a friend who already converted it).

Fast method:
- Take a photo/screenshot or copy your timetable text.
- Ask any LLM to convert it into the same shape as the template.
- Paste into **Upload → Paste JSON**.

### Attendance (optional)
If you don’t have a CSV yet:
- Start without it.
- In **Review/Summary**, you can set a baseline manually.
- Or later upload the attendance CSV when you have it.

---

## 4) Practical daily routine (recommended)
- Once per week (or whenever your timetable changes): **Upload** updated timetable.
- Every 1–3 days: go to **Planner** and mark planned present/absent.
- Before attendance checks: open **Summary → View Report** and print/save.

---

## 5) Data & privacy notes (quick)
- Your login is via **Google**.
- Your timetable/plans are stored in your browser + backend APIs.
- If you switch browsers/devices, you may need to upload again (unless you’re using the same environment with saved data).

---

## 6) One‑liner you can paste in class group
“Open AttendEase → Sign in with Google → Upload timetable JSON (optional attendance CSV) → Review → Planner (mark planned present/absent) → Summary → View Report (print/PDF).”
