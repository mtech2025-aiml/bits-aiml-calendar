const CONFIG = window.APP_CONFIG || {};

const MANDATORY_ELECTIVES = ["aci", "drl"];
const DEFAULT_VIEW = CONFIG.defaultView || "ec1";

const SUBJECTS = {
  aci: { label: "ACI", color: "#1D4ED8" },
  drl: { label: "DRL", color: "#0EA5E9" },
  nlp: { label: "NLP", color: "#F97316" },
  ir: { label: "IR", color: "#8B5CF6" },
  udl: { label: "UDL", color: "#EC4899" },
  cv: { label: "CV", color: "#10B981" },
  seml: { label: "SEML", color: "#F59E0B" },
  cyber: { label: "CYBER", color: "#EF4444" },
  dmml: { label: "DMML", color: "#14B8A6" },
  dml: { label: "DML", color: "#22C55E" },
  va: { label: "VA", color: "#6366F1" },
  common: { label: "EXAM", color: "#64748B" }
};

const TYPE_COLORS = {
  webinar: "#0EA5E9",
  quiz: "#F97316",
  assignment: "#8B5CF6",
  midsem_exam: "#EF4444",
  endsem_exam: "#14B8A6",
  default: "#64748B"
};

const EXAM_SLOT_TIMES = {
  ec2: {
    duration: "2 hrs",
    fn: "9:00 AM to 11:00 AM",
    an: "1:00 PM to 3:00 PM",
    en: "4:30 PM to 6:30 PM"
  },
  ec3: {
    duration: "2.5 hrs",
    fn: "9:00 AM to 11:30 AM",
    an: "1:00 PM to 3:30 PM",
    en: "4:30 PM to 7:00 PM"
  }
};

const EXAM_ROWS = [
  { electiveId: "aci", courseNo: "AIMLCZG557", course: "Artificial and Computational Intelligence (Core)", ec2Regular: ["21-06-2026", "AN"], ec2Makeup: ["28-06-2026", "AN"], ec3Regular: ["06-09-2026", "AN"], ec3Makeup: ["13-09-2026", "AN"] },
  { electiveId: "drl", courseNo: "AIMLCZG512", course: "Deep Reinforcement Learning (Core)", ec2Regular: ["21-06-2026", "FN"], ec2Makeup: ["28-06-2026", "FN"], ec3Regular: ["06-09-2026", "FN"], ec3Makeup: ["13-09-2026", "FN"] },
  { electiveId: "va", courseNo: "AIML ZG540", course: "Video Analysis", ec2Regular: ["21-06-2026", "EN"], ec2Makeup: ["28-06-2026", "EN"], ec3Regular: ["06-09-2026", "EN"], ec3Makeup: ["13-09-2026", "EN"] },
  { electiveId: "udl", courseNo: "AIMLCZG533", course: "Unsupervised Deep Learning", ec2Regular: ["21-06-2026", "EN"], ec2Makeup: ["28-06-2026", "EN"], ec3Regular: ["06-09-2026", "EN"], ec3Makeup: ["13-09-2026", "EN"] },
  { electiveId: "nlp", courseNo: "AIMLCZG530", course: "Natural Language Processing", ec2Regular: ["20-06-2026", "FN"], ec2Makeup: ["27-06-2026", "FN"], ec3Regular: ["05-09-2026", "FN"], ec3Makeup: ["12-09-2026", "FN"] },
  { electiveId: "cyber", courseNo: "AIMLCZG567", course: "AI and ML Techniques for Cyber Security", ec2Regular: ["20-06-2026", "AN"], ec2Makeup: ["27-06-2026", "AN"], ec3Regular: ["05-09-2026", "AN"], ec3Makeup: ["12-09-2026", "AN"] },
  { electiveId: "cv", courseNo: "AIMLCZG525", course: "Computer Vision", ec2Regular: ["20-06-2026", "AN"], ec2Makeup: ["27-06-2026", "AN"], ec3Regular: ["05-09-2026", "AN"], ec3Makeup: ["12-09-2026", "AN"] },
  { electiveId: "seml", courseNo: "AIMLCZG546", course: "Software Engineering for Machine Learning", ec2Regular: ["20-06-2026", "AN"], ec2Makeup: ["27-06-2026", "AN"], ec3Regular: ["05-09-2026", "AN"], ec3Makeup: ["12-09-2026", "AN"] },
  { electiveId: "ir", courseNo: "AIMLCZG537", course: "Information Retrieval", ec2Regular: ["20-06-2026", "EN"], ec2Makeup: ["27-06-2026", "EN"], ec3Regular: ["05-09-2026", "EN"], ec3Makeup: ["12-09-2026", "EN"] },
  { electiveId: "dmml", courseNo: "AIMLCZG529", course: "Data Management for Machine Learning", ec2Regular: ["20-06-2026", "EN"], ec2Makeup: ["27-06-2026", "EN"], ec3Regular: ["05-09-2026", "EN"], ec3Makeup: ["12-09-2026", "EN"] },
  { electiveId: "dml", courseNo: "AIMLCZG515", course: "Distributed Machine Learning", ec2Regular: ["20-06-2026", "EN"], ec2Makeup: ["27-06-2026", "EN"], ec3Regular: ["05-09-2026", "EN"], ec3Makeup: ["12-09-2026", "EN"] }
];

const EC1_EVENT_TYPES = new Set(["quiz", "assignment"]);

const MONTHS = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, sept: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11
};

const CALENDAR_START = new Date(2026, 4, 1); // May 2026
const CALENDAR_END = new Date(2026, 8, 1);   // Sep 2026

const state = {
  bootstrap: null,
  deadlines: [],
  electivesById: {},
  selection: {
    elective1: localStorage.getItem("selectedElective1") || "",
    elective2: localStorage.getItem("selectedElective2") || ""
  },
  mainView: localStorage.getItem("mainView") || DEFAULT_VIEW,
  ec1Mode: localStorage.getItem("ec1Mode") || "list",
  ec1Scope: localStorage.getItem("ec1Scope") || "upcoming",
  ec1Subjects: new Set(),
  examMode: localStorage.getItem("examMode") || "list",
  examScope: localStorage.getItem("examScope") || "all",
  calendarIndex: 0
};

const el = (id) => document.getElementById(id);

function normalizeId(v) {
  return String(v || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function parseDateValue(value) {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return startOfDay(value);

  const raw = String(value).trim();
  if (!raw || /not provided|not there/i.test(raw)) return null;

  // YYYY-MM-DD
  let m = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return startOfDay(new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12));

  // DD-MM-YYYY
  m = raw.match(/^(\d{1,2})-(\d{1,2})-(\d{4})/);
  if (m) return startOfDay(new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]), 12));

  // remove day name in parentheses
  const cleaned = raw.replace(/\s+\([A-Za-z]{3}\)\s*$/i, "").replace(/\s+IST$/i, "").trim();

  // 20th June 2026 7:30 PM
  m = cleaned.match(/^(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]{3,9})\s+(\d{4})(?:\s+(\d{1,2}):(\d{2})\s*(AM|PM))?/i);
  if (m) {
    const day = Number(m[1]);
    const month = MONTHS[m[2].toLowerCase()];
    const year = Number(m[3]);
    if (month == null) return null;
    let hour = m[4] ? Number(m[4]) : 12;
    const minute = m[5] ? Number(m[5]) : 0;
    const ampm = m[6] ? m[6].toUpperCase() : null;
    if (ampm) {
      if (hour === 12) hour = 0;
      if (ampm === "PM") hour += 12;
    }
    return new Date(year, month, day, hour, minute, 0, 0);
  }

  const direct = new Date(cleaned);
  if (!Number.isNaN(direct.getTime())) return startOfDay(direct);
  return null;
}

function parseDisplayDate(value) {
  const d = parseDateValue(value);
  if (!d) return "";
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function formatDateChip(value) {
  const d = parseDateValue(value);
  if (!d) return "";
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short"
  });
}

function formatMonthTitle(dateObj) {
  return dateObj.toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric"
  });
}

function qs(params) {
  return new URLSearchParams(params).toString();
}

async function fetchJSON(path, params = {}) {
  const url = `${CONFIG.apiBase}${path}${path.includes("?") ? "&" : "?"}${qs(params)}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

function safeSetText(id, value) {
  const node = el(id);
  if (node) node.textContent = value;
}

function safeSetHTML(id, value) {
  const node = el(id);
  if (node) node.innerHTML = value;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function getSetting(key, fallback = "") {
  const settings = state.bootstrap?.settings || [];
  const found = settings.find((s) => normalizeId(s.key) === normalizeId(key));
  return found?.value ?? fallback;
}

function getElectiveMeta(id) {
  return state.electivesById[normalizeId(id)] || null;
}

function getElectiveLabel(id) {
  const meta = getElectiveMeta(id);
  return meta?.short_name || SUBJECTS[normalizeId(id)]?.label || String(id || "").toUpperCase();
}

function getElectiveFullName(id) {
  const meta = getElectiveMeta(id);
  return meta?.full_name || "";
}

function getSubjectMeta(id) {
  return SUBJECTS[normalizeId(id)] || { label: String(id || "").toUpperCase(), color: TYPE_COLORS.default };
}

function subjectColor(id) {
  return getSubjectMeta(id).color;
}

function subjectLabel(id) {
  return getSubjectMeta(id).label;
}

function currentDate() {
  const override = getSetting("current_date_override", "");
  const parsed = parseDateValue(override);
  return parsed || startOfDay(new Date());
}

function selectedElectiveIds() {
  return [state.selection.elective1, state.selection.elective2].map(normalizeId).filter(Boolean);
}

function hasTwoElectives() {
  const ids = selectedElectiveIds();
  return ids.length === 2 && ids[0] !== ids[1];
}

function allowedSubjectIds(includeNone = false) {
  const selected = selectedElectiveIds();
  const base = [...MANDATORY_ELECTIVES, ...selected].map(normalizeId);
  const out = [...new Set(base.filter(Boolean))];
  if (includeNone && out.length === 0) return [];
  return out;
}

function selectionSummaryHTML() {
  const sem = `SEM ${getSetting("current_semester", CONFIG.defaultSemester || "2")}`;
  const mandatory = `ACI + DRL`;
  const e1 = getElectiveLabel(state.selection.elective1);
  const e2 = getElectiveLabel(state.selection.elective2);

  const chips = [
    `<span class="summary-chip">${sem}</span>`,
    `<span class="summary-chip">${mandatory}</span>`,
    e1 ? `<span class="summary-chip">${e1}</span>` : `<span class="summary-chip">Select E1</span>`,
    e2 ? `<span class="summary-chip">${e2}</span>` : `<span class="summary-chip">Select E2</span>`
  ];

  return chips.join("");
}

function renderSelectionPanel() {
  const electives = (state.bootstrap?.electives || [])
    .map((e) => ({
      ...e,
      elective_id: normalizeId(e.elective_id),
      visible: String(e.visible || "YES").toUpperCase() !== "NO"
    }))
    .filter((e) => e.visible && !MANDATORY_ELECTIVES.includes(e.elective_id));

  const opts = electives
    .map((e) => `<option value="${e.elective_id}">${e.short_name} — ${e.full_name}</option>`)
    .join("");

  const e1 = el("elective1Select");
  const e2 = el("elective2Select");
  if (e1 && !e1.dataset.ready) {
    e1.innerHTML = `<option value="">Select elective</option>${opts}`;
    e2.innerHTML = `<option value="">Select elective</option>${opts}`;
    e1.dataset.ready = "1";
  }

  if (e1) e1.value = state.selection.elective1 || "";
  if (e2) e2.value = state.selection.elective2 || "";

  safeSetHTML("academicSummary", selectionSummaryHTML());
}

function renderPriorityBanner() {
  const banner = el("priorityBanner");
  if (!banner) return;

  const items = getPriorityFeed();
  const best = items[0];

  if (!best) {
    banner.innerHTML = `
      <div class="notice">No upcoming items found yet.</div>
    `;
    return;
  }

  const subj = subjectLabel(best.electiveId || best.subject || "common");
  const color = subjectColor(best.electiveId || best.subject || "common");
  const title = best.title || best.course || "Upcoming item";
  const status = best.status === "ongoing" ? "ONGOING" : "UP NEXT";
  const range = best.status === "ongoing"
    ? `Ends ${formatDateChip(best.endDate || best.end_date || best.end || best.date)}`
    : `Starts ${formatDateChip(best.startDate || best.start_date || best.start || best.date)} • Ends ${formatDateChip(best.endDate || best.end_date || best.end || best.startDate || best.start_date)}`;

  banner.innerHTML = `
    <div class="priority-card">
      <div class="priority-main">
        <span class="subject-chip" style="background:${color}">${subj}</span>
        <div style="min-width:0">
          <h3>${title}</h3>
          <div class="subtle">${status} • ${range}</div>
        </div>
      </div>
      <span class="status-chip ${best.status === "ongoing" ? "ongoing" : "upcoming"}">${status}</span>
    </div>
  `;
}

function normalizeDeadline(row) {
  const electiveId = normalizeId(row.elective_id || row.elective || row.subject);
  const subject = subjectLabel(electiveId || row.subject);
  const startDate = parseDateValue(row.start_date) || parseDateValue(row.start_display);
  const endDate = parseDateValue(row.end_date) || parseDateValue(row.end_display) || startDate;
  const startDisplay = row.start_display || parseDisplayDate(startDate);
  const endDisplay = row.end_display || parseDisplayDate(endDate) || startDisplay;
  const type = normalizeId(row.type);

  const now = currentDate();
  const status = startDate && endDate && now >= startOfDay(startDate) && now <= startOfDay(endDate)
    ? "ongoing"
    : startDate && startOfDay(startDate) > now
      ? "upcoming"
      : "done";

  return {
    ...row,
    electiveId,
    subject,
    type,
    startDate,
    endDate,
    startDisplay,
    endDisplay,
    status,
    statusRank: status === "upcoming" ? 0 : status === "ongoing" ? 1 : 2
  };
}

function normalizeDeadlines(rows) {
  return rows
    .filter((r) => String(r.visible || "YES").toUpperCase() !== "NO")
    .map(normalizeDeadline);
}

function getDeadlineFeed() {
  const ids = allowedSubjectIds();
  const deadlineTypes = new Set(["quiz", "assignment", "webinar"]);
  const rows = state.deadlines.filter((r) => ids.includes(r.electiveId) && deadlineTypes.has(r.type));
  return rows
    .filter((r) => {
      const now = currentDate();
      if (state.ec1Scope === "all") return true;
      if (r.status === "done") return false;
      return true;
    })
    .filter((r) => {
      if (!state.ec1SubjectSet().size) return true;
      return state.ec1SubjectSet().has(r.electiveId);
    })
    .sort(sortByDate);
}

function sortByDate(a, b) {
  const ra = a.statusRank ?? 2;
  const rb = b.statusRank ?? 2;
  if (ra !== rb) return ra - rb;

  const da = a.startDate || a.endDate || new Date(0);
  const db = b.startDate || b.endDate || new Date(0);
  const diff = da - db;
  if (diff !== 0) return diff;

  return String(a.title || "").localeCompare(String(b.title || ""));
}

function sortByStartDateOnly(a, b) {
  const da = a.startDate || a.endDate || new Date(0);
  const db = b.startDate || b.endDate || new Date(0);
  const diff = da - db;
  if (diff !== 0) return diff;
  return String(a.title || "").localeCompare(String(b.title || ""));
}

state.ec1SubjectSet = function ec1SubjectSet() {
  if (!state.ec1Subjects.size) {
    const defaults = allowedSubjectIds();
    defaults.forEach((id) => state.ec1Subjects.add(id));
  }
  return state.ec1Subjects;
};

function refreshEc1SubjectsDefault() {
  const ids = allowedSubjectIds();
  state.ec1Subjects = new Set(ids);
}

function getPriorityFeed() {
  const now = currentDate();
  const selectedAllowed = allowedSubjectIds();
  const deadlineEvents = state.deadlines
    .filter((r) => selectedAllowed.includes(r.electiveId) || r.electiveId === "common")
    .filter((r) => !["webinar", "quiz", "assignment", "midsem_exam", "endsem_exam"].includes("x") || true)
    .map((r) => ({
      electiveId: r.electiveId,
      subject: r.subject,
      title: `${r.subject} · ${prettyType(r.type)} · ${r.title}`,
      startDate: r.startDate,
      endDate: r.endDate,
      status: r.status,
      statusRank: r.statusRank,
      kind: "deadline"
    }));

  const examEvents = getSelectedExamEvents().map((e) => ({
    electiveId: e.electiveId,
    subject: e.subject,
    title: `${e.subject} · ${e.courseNo}`,
    startDate: e.ec2Regular.dateObj || e.ec3Regular.dateObj,
    endDate: e.ec2Makeup.dateObj || e.ec3Makeup.dateObj,
    status: (() => {
      const dates = [e.ec2Regular.dateObj, e.ec2Makeup.dateObj, e.ec3Regular.dateObj, e.ec3Makeup.dateObj].filter(Boolean);
      const future = dates.filter((d) => d >= now);
      return future.length ? "upcoming" : "done";
    })(),
    statusRank: 0,
    kind: "exam"
  }));

  const combined = [...deadlineEvents, ...examEvents]
    .filter((e) => {
      if (e.status === "ongoing") return true;
      if (e.status === "upcoming") return true;
      return false;
    })
    .sort((a, b) => {
      const rank = (a.status === "upcoming" ? 0 : a.status === "ongoing" ? 1 : 2) - (b.status === "upcoming" ? 0 : b.status === "ongoing" ? 1 : 2);
      if (rank !== 0) return rank;
      const da = a.startDate || a.endDate || new Date(8640000000000000);
      const db = b.startDate || b.endDate || new Date(8640000000000000);
      if (da - db !== 0) return da - db;
      return String(a.title).localeCompare(String(b.title));
    });

  return combined;
}

function prettyType(type) {
  const t = normalizeId(type);
  if (t === "midsem_exam") return "Midsem Exam";
  if (t === "endsem_exam") return "Endsem Exam";
  if (t === "assignment") return "Assignment";
  if (t === "quiz") return "Quiz";
  if (t === "webinar") return "Webinar";
  return String(type || "").toUpperCase();
}

function renderMainTitle() {
  const mainTitle = el("viewTitle");
  const subtitle = el("viewSubtitle");
  if (!mainTitle || !subtitle) return;

  if (state.mainView === "ec1") {
    mainTitle.textContent = "EC1 schedule";
    subtitle.textContent = "Quizzes & assignments only • Upcoming by default";
  } else if (state.mainView === "exam") {
    mainTitle.textContent = "Exam schedule";
    subtitle.textContent = "EC2 / EC3 exam slots • Image or list";
  } else {
    mainTitle.textContent = "Class schedule";
    subtitle.textContent = "";
  }
}

function renderMainTabs() {
  document.querySelectorAll("[data-main-view]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.mainView === state.mainView);
  });
}

function isSelectionComplete() {
  return hasTwoElectives();
}

function renderView() {
  renderMainTitle();
  renderMainTabs();
  renderSelectionPanel();
  renderPriorityBanner();

  const controls = el("viewControls");
  const root = el("viewRoot");
  if (!controls || !root) return;

  if (state.mainView === "ec1") {
    controls.innerHTML = `
      <div class="control-row">
        <div class="control-group" data-ec1-mode>
          <button class="toggle-btn ${state.ec1Mode === "list" ? "active" : ""}" data-ec1-mode-btn="list">List</button>
          <button class="toggle-btn ${state.ec1Mode === "table" ? "active" : ""}" data-ec1-mode-btn="table">Table</button>
          <button class="toggle-btn ${state.ec1Mode === "calendar" ? "active" : ""}" data-ec1-mode-btn="calendar">Calendar</button>
        </div>
        <div class="control-group" data-ec1-scope>
          <button class="toggle-btn ${state.ec1Scope === "upcoming" ? "active" : ""}" data-ec1-scope-btn="upcoming">Upcoming</button>
          <button class="toggle-btn ${state.ec1Scope === "all" ? "active" : ""}" data-ec1-scope-btn="all">All</button>
        </div>
      </div>

      <div class="control-row" style="align-items:flex-start;">
        <div class="legend" id="ec1SubjectLegend"></div>
      </div>
    `;

    const legend = controls.querySelector("#ec1SubjectLegend");
    const subjectIds = allowedSubjectIds();
    const available = subjectIds.map((id) => ({
      id,
      label: subjectLabel(id),
      color: subjectColor(id)
    }));

    if (!state.ec1Subjects.size) {
      refreshEc1SubjectsDefault();
    }
    const activeSet = state.ec1Subjects;
    const allActive = subjectIds.length === activeSet.size && subjectIds.every((id) => activeSet.has(id));

    legend.innerHTML = `
      <button class="subject-toggle ${allActive ? "active" : ""}" data-ec1-subject="all">
        All
      </button>
      ${available.map((s) => `
        <button class="subject-toggle ${activeSet.has(s.id) ? "active" : ""}" data-ec1-subject="${s.id}">
          <span class="subject-dot" style="background:${s.color}"></span>
          ${s.label}
        </button>
      `).join("")}
    `;

    if (!isSelectionComplete()) {
      root.innerHTML = `
        <div class="notice">Choose your 2 electives above to unlock the personalized EC1 schedule.</div>
      `;
      return;
    }

    const items = getEc1Events();
    if (state.ec1Mode === "table") {
      root.innerHTML = renderEc1Table(items);
    } else if (state.ec1Mode === "calendar") {
      root.innerHTML = renderEc1Calendar(items);
    } else {
      root.innerHTML = renderEc1List(items);
    }
    return;
  }

  if (state.mainView === "exam") {
    controls.innerHTML = `
      <div class="control-row">
        <div class="control-group" data-exam-mode>
          <button class="toggle-btn ${state.examMode === "image" ? "active" : ""}" data-exam-mode-btn="image">Image</button>
          <button class="toggle-btn ${state.examMode === "list" ? "active" : ""}" data-exam-mode-btn="list">List</button>
        </div>
        <div class="control-group" data-exam-scope>
          <button class="toggle-btn ${state.examScope === "all" ? "active" : ""}" data-exam-scope-btn="all">All</button>
          <button class="toggle-btn ${state.examScope === "ec2" ? "active" : ""}" data-exam-scope-btn="ec2">EC2</button>
          <button class="toggle-btn ${state.examScope === "ec3" ? "active" : ""}" data-exam-scope-btn="ec3">EC3</button>
        </div>
      </div>
    `;

    if (!isSelectionComplete()) {
      root.innerHTML = `<div class="notice">Choose your 2 electives above to unlock the exam schedule.</div>`;
      return;
    }

    root.innerHTML = state.examMode === "image" ? renderExamImage() : renderExamList();
    return;
  }

  controls.innerHTML = "";
  root.innerHTML = renderClassSchedule();
}

function renderEc1List(items) {
  if (!items.length) return `<div class="notice">No upcoming EC1 items found.</div>`;

  return `
    <div class="card-list">
      ${items.map((item) => renderEc1Card(item)).join("")}
    </div>
  `;
}

function renderEc1Card(item) {
  const color = subjectColor(item.electiveId);
  const statusClass = item.status === "ongoing" ? "ongoing" : "upcoming";
  const range = item.status === "ongoing"
    ? `<span class="date-chip">Ends ${formatDateChip(item.endDate || item.end_date || item.end || item.endDisplay)}</span>`
    : `<span class="date-chip">From ${formatDateChip(item.startDate || item.start_date || item.start || item.startDisplay)}</span><span class="date-chip">To ${formatDateChip(item.endDate || item.end_date || item.end || item.endDisplay)}</span>`;

  return `
    <div class="item" style="border-left: 8px solid ${color}">
      <div class="item-head">
        <span class="subject-chip" style="background:${color}">${item.subject}</span>
        <span class="title-chip">${item.title}</span>
        <span class="status-chip ${statusClass}">${item.status.toUpperCase()}</span>
      </div>
      <div class="item-sub">
        ${range}
      </div>
    </div>
  `;
}

function renderEc1Table(items) {
  if (!items.length) return `<div class="notice">No upcoming EC1 items found.</div>`;

  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Subject</th>
            <th>Title</th>
            <th>Status</th>
            <th>Start</th>
            <th>End</th>
          </tr>
        </thead>
        <tbody>
          ${items.map((item) => {
            const color = subjectColor(item.electiveId);
            return `
              <tr>
                <td><span class="subject-chip" style="background:${color}">${item.subject}</span></td>
                <td><span class="title-chip">${item.title}</span></td>
                <td><span class="status-chip ${item.status === "ongoing" ? "ongoing" : "upcoming"}">${item.status.toUpperCase()}</span></td>
                <td>${formatDateChip(item.startDate || item.start_date || item.startDisplay || item.start)}</td>
                <td>${formatDateChip(item.endDate || item.end_date || item.endDisplay || item.end)}</td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
    </div>
  `;
}

const EC1_CALENDAR_BASE = new Date(2026, 4, 1); // May 2026

function renderEc1Calendar(items) {
  const monthDate = new Date(EC1_CALENDAR_BASE.getFullYear(), EC1_CALENDAR_BASE.getMonth() + state.calendarIndex, 1);
  const minIndex = 0;
  const maxIndex = 4; // May to Sep inclusive
  state.calendarIndex = clamp(state.calendarIndex, minIndex, maxIndex);

  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const first = new Date(year, month, 1);
  const firstDay = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = currentDate();
  const todayIso = today.toISOString().slice(0, 10);

  const monthEvents = items.filter((item) => {
    const start = item.startDate || item.endDate;
    const end = item.endDate || item.startDate;
    if (!start && !end) return false;
    const s = startOfDay(start || end);
    const e = startOfDay(end || start);
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    return e >= monthStart && s <= monthEnd;
  });

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(`<div class="day empty"></div>`);

  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, month, d);
    const iso = dateObj.toISOString().slice(0, 10);
    const isToday = iso === todayIso;
    const dayEvents = monthEvents
      .filter((item) => {
        const start = startOfDay(item.startDate || item.endDate);
        const end = startOfDay(item.endDate || item.startDate || start);
        return dateObj >= start && dateObj <= end;
      })
      .sort(sortByDate);

    cells.push(`
      <div class="day ${isToday ? "today" : ""}">
        <div class="day-num">
          <span>${d}</span>
          ${isToday ? `<span class="today-badge">Today</span>` : ""}
        </div>
        ${dayEvents.slice(0, 3).map((event) => `
          <div class="day-item" style="background:${subjectColor(event.electiveId)}">
            ${event.subject} · ${event.title}
          </div>
        `).join("")}
        ${dayEvents.length > 3 ? `<div class="subtle" style="font-size:.78rem;margin-top:6px;">+${dayEvents.length - 3} more</div>` : ""}
      </div>
    `);
  }

  const controls = `
    <div class="month-toolbar">
      <button class="mini-btn" data-cal-nav="prev" ${state.calendarIndex <= 0 ? "disabled" : ""}>← Prev</button>
      <div class="month-title">${formatMonthTitle(monthDate)}</div>
      <button class="mini-btn" data-cal-nav="next" ${state.calendarIndex >= 4 ? "disabled" : ""}>Next →</button>
    </div>
  `;

  const legend = `
    <div class="legend" style="margin-bottom: 12px;">
      ${Array.from(new Set(items.map((i) => i.electiveId))).map((id) => `
        <span class="legend-item"><span class="subject-dot" style="background:${subjectColor(id)}"></span>${subjectLabel(id)}</span>
      `).join("")}
    </div>
  `;

  return `${controls}${legend}<div class="month-grid">${["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => `<div class="day-head">${d}</div>`).join("")}${cells.join("")}</div>`;
}

function getEc1Events() {
  const allowed = new Set(allowedSubjectIds());
  const subjectSet = state.ec1Subjects.size ? state.ec1Subjects : new Set(allowed);

  return state.deadlines
    .filter((r) => allowed.has(r.electiveId) && EC1_EVENT_TYPES.has(r.type))
    .filter((r) => subjectSet.has(r.electiveId))
    .filter((r) => state.ec1Scope === "all" ? true : r.status !== "done")
    .sort(sortByDate);
}

function getSelectedExamEvents() {
  const allowed = new Set(allowedSubjectIds());
  return EXAM_ROWS.filter((row) => allowed.has(normalizeId(row.electiveId)));
}

function examDisplay(dateStr, slot, group) {
  const groupKey = group === "ec2" ? "ec2" : "ec3";
  const slotTimes = EXAM_SLOT_TIMES[groupKey];
  const chipColor = slot === "FN" ? "#F97316" : slot === "AN" ? "#16A34A" : "#7C3AED";
  return `
    <div class="chip-line">
      <span class="session-chip" style="background:${chipColor}">${slot}</span>
      <span class="date-chip">${dateStr}</span>
      <span class="date-chip">${slotTimes[slot.toLowerCase()]}</span>
    </div>
  `;
}

function renderExamList() {
  const rows = getSelectedExamEvents();
  const mode = state.examScope;

  if (!rows.length) {
    return `<div class="notice">No exam rows available for the selected electives.</div>`;
  }

  const legend = `
    <div class="panel image-panel" style="margin-bottom: 14px;">
      <div class="legend" style="justify-content: space-between; align-items: center;">
        <span class="legend-item"><span class="subject-dot" style="background:#1D4ED8"></span>EC2 ${EXAM_SLOT_TIMES.ec2.duration}</span>
        <span class="legend-item"><span class="subject-dot" style="background:#0EA5E9"></span>EC3 ${EXAM_SLOT_TIMES.ec3.duration}</span>
        <span class="legend-item"><strong>FN</strong> ${EXAM_SLOT_TIMES.ec2.fn}</span>
        <span class="legend-item"><strong>AN</strong> ${EXAM_SLOT_TIMES.ec2.an}</span>
        <span class="legend-item"><strong>EN</strong> ${EXAM_SLOT_TIMES.ec2.en}</span>
      </div>
    </div>
  `;

  const filtered = rows.filter((row) => {
    if (mode === "ec2") return true;
    if (mode === "ec3") return true;
    return true;
  });

  const cols = mode === "ec2"
    ? ["Course Number", "Course", "EC-2 Regular", "EC-2 Make-up"]
    : mode === "ec3"
      ? ["Course Number", "Course", "EC-3 Regular", "EC-3 Make-up"]
      : ["Course Number", "Course", "EC-2 Regular", "EC-2 Make-up", "EC-3 Regular", "EC-3 Make-up"];

  return `
    ${legend}
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            ${cols.map((c) => `<th>${c}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${filtered.map((row) => {
            const cells = [
              `<td><strong>${row.courseNo}</strong></td>`,
              `<td>${row.course}</td>`
            ];
            if (mode === "ec2" || mode === "all") {
              cells.push(`<td>${examDisplay(row.ec2Regular[0], row.ec2Regular[1], "ec2")}</td>`);
              cells.push(`<td>${examDisplay(row.ec2Makeup[0], row.ec2Makeup[1], "ec2")}</td>`);
            }
            if (mode === "ec3" || mode === "all") {
              cells.push(`<td>${examDisplay(row.ec3Regular[0], row.ec3Regular[1], "ec3")}</td>`);
              cells.push(`<td>${examDisplay(row.ec3Makeup[0], row.ec3Makeup[1], "ec3")}</td>`);
            }
            return `<tr>${cells.join("")}</tr>`;
          }).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderExamImage() {
  return `
    <div class="image-panel">
      <img src="${CONFIG.examGuideImageUrl}" alt="AIML exam schedule guide" />
    </div>
  `;
}

function renderClassSchedule() {
  return `
    <div class="image-panel">
      <img src="${CONFIG.classScheduleImageUrl}" alt="Class schedule" />
    </div>
  `;
}

function populateSummaryAndBanner() {
  renderSelectionPanel();
  renderPriorityBanner();
  renderMainTitle();
  renderMainTabs();
}

function setupSelectionListeners() {
  const e1 = el("elective1Select");
  const e2 = el("elective2Select");
  if (!e1 || !e2) return;

  e1.addEventListener("change", () => {
    state.selection.elective1 = e1.value;
    localStorage.setItem("selectedElective1", e1.value);
    refreshEc1SubjectsDefault();
    populateSummaryAndBanner();
    renderView();
  });

  e2.addEventListener("change", () => {
    state.selection.elective2 = e2.value;
    localStorage.setItem("selectedElective2", e2.value);
    refreshEc1SubjectsDefault();
    populateSummaryAndBanner();
    renderView();
  });
}

function setupDelegatedControls() {
  const tabs = el("mainTabs");
  if (tabs && !tabs.dataset.bound) {
    tabs.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-main-view]");
      if (!btn) return;
      state.mainView = btn.dataset.mainView;
      localStorage.setItem("mainView", state.mainView);
      renderView();
    });
    tabs.dataset.bound = "1";
  }

  const viewControls = el("viewControls");
  if (viewControls && !viewControls.dataset.bound) {
    viewControls.addEventListener("click", (e) => {
      const ec1ModeBtn = e.target.closest("[data-ec1-mode-btn]");
      const ec1ScopeBtn = e.target.closest("[data-ec1-scope-btn]");
      const ec1SubjectBtn = e.target.closest("[data-ec1-subject]");
      const examModeBtn = e.target.closest("[data-exam-mode-btn]");
      const examScopeBtn = e.target.closest("[data-exam-scope-btn]");
      const calNavBtn = e.target.closest("[data-cal-nav]");

      if (ec1ModeBtn) {
        state.ec1Mode = ec1ModeBtn.dataset.ec1ModeBtn;
        localStorage.setItem("ec1Mode", state.ec1Mode);
        renderView();
        return;
      }

      if (ec1ScopeBtn) {
        state.ec1Scope = ec1ScopeBtn.dataset.ec1ScopeBtn;
        localStorage.setItem("ec1Scope", state.ec1Scope);
        renderView();
        return;
      }

      if (ec1SubjectBtn) {
        const id = ec1SubjectBtn.dataset.ec1Subject;
        const allowed = allowedSubjectIds();
        if (id === "all") {
          state.ec1Subjects = new Set(allowed);
        } else if (state.ec1Subjects.has(id)) {
          state.ec1Subjects.delete(id);
          if (!state.ec1Subjects.size) {
            state.ec1Subjects = new Set(allowed);
          }
        } else {
          state.ec1Subjects.add(id);
        }
        renderView();
        return;
      }

      if (examModeBtn) {
        state.examMode = examModeBtn.dataset.examModeBtn;
        localStorage.setItem("examMode", state.examMode);
        renderView();
        return;
      }

      if (examScopeBtn) {
        state.examScope = examScopeBtn.dataset.examScopeBtn;
        localStorage.setItem("examScope", state.examScope);
        renderView();
        return;
      }

      if (calNavBtn) {
        if (calNavBtn.dataset.calNav === "prev") state.calendarIndex = clamp(state.calendarIndex - 1, 0, 4);
        if (calNavBtn.dataset.calNav === "next") state.calendarIndex = clamp(state.calendarIndex + 1, 0, 4);
        renderView();
      }
    });
    viewControls.dataset.bound = "1";
  }
}

function initSubjectFilterDefaults() {
  const allowed = allowedSubjectIds();
  state.ec1Subjects = new Set(allowed);
}

function renderView() {
  populateSummaryAndBanner();
  setupDelegatedControls();
  const viewTitle = el("viewTitle");
  const viewSubtitle = el("viewSubtitle");
  if (state.mainView === "ec1") {
    viewTitle.textContent = "EC1 schedule";
    viewSubtitle.textContent = "Quizzes & assignments only • Upcoming by default";
  } else if (state.mainView === "exam") {
    viewTitle.textContent = "Exam schedule";
    viewSubtitle.textContent = "EC2 / EC3 slots • Image or list";
  } else {
    viewTitle.textContent = "Class schedule";
    viewSubtitle.textContent = "";
  }

  const root = el("viewRoot");
  if (!root) return;

  if (state.mainView === "ec1") {
    if (!isSelectionComplete()) {
      root.innerHTML = `<div class="notice">Choose your 2 electives above to unlock the personalized EC1 schedule.</div>`;
      return;
    }
    const items = getEc1Events();
    root.innerHTML = state.ec1Mode === "table" ? renderEc1Table(items) : state.ec1Mode === "calendar" ? renderEc1Calendar(items) : renderEc1List(items);
  } else if (state.mainView === "exam") {
    if (!isSelectionComplete()) {
      root.innerHTML = `<div class="notice">Choose your 2 electives above to unlock the exam schedule.</div>`;
      return;
    }
    root.innerHTML = state.examMode === "image" ? renderExamImage() : renderExamList();
  } else {
    root.innerHTML = renderClassSchedule();
  }
}

function updateFooterLinks() {
  const links = state.bootstrap?.links || [];
  const map = {};
  links.forEach((l) => {
    const key = normalizeId(l.label);
    map[key] = l.url;
  });
  const drive = map.masterdrive || map.masterdrivefolder || map.masterdrivefiles || map.masterdrive1 || map.masterdrive2 || map.masterdrivefolderlink || map.masterdrive;
  if (el("taxilaLink")) el("taxilaLink").href = map.taxila || "#";
  if (el("driveLink")) el("driveLink").href = drive || map.masterdrive || "#";
  if (el("examLink")) el("examLink").href = map.examlinks || map.examlink || "#";
}

function buildElectiveMap() {
  const out = {};
  (state.bootstrap?.electives || []).forEach((e) => {
    out[normalizeId(e.elective_id)] = e;
  });
  state.electivesById = out;
}

async function init() {
  const [bootstrapResponse, deadlinesResponse] = await Promise.all([
    fetchJSON("", { action: "bootstrap" }),
    fetchJSON("", { action: "deadlines" })
  ]);

  state.bootstrap = bootstrapResponse;
  buildElectiveMap();
  state.deadlines = normalizeDeadlines(deadlinesResponse.deadlines || []);
  initSubjectFilterDefaults();

  // Set summary panel values now that bootstrap is available
  renderSelectionPanel();
  setupSelectionListeners();
  updateFooterLinks();
  renderView();
}

document.addEventListener("DOMContentLoaded", () => {
  try {
    init().catch((err) => {
      console.error(err);
      safeSetHTML("viewRoot", `<div class="notice">Could not load data. Check your Apps Script URL and deployment.</div>`);
    });
  } catch (err) {
    console.error(err);
  }
});
