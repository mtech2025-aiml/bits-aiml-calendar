const CONFIG = window.APP_CONFIG || {};

const MANDATORY_ELECTIVES = ["aci", "drl"];

const TYPE_COLORS = {
  webinar: "#DBEAFE",
  quiz: "#FEF3C7",
  assignment: "#DCFCE7",
  midsem_exam: "#FECACA",
  endsem_exam: "#E9D5FF",
  class_schedule: "#D1FAE5",
  default: "#E5E7EB"
};

const CLASS_SCHEDULE_URL = "https://drive.google.com/file/d/10iKBANaPW74PAc8xZ-qQyYvEbKLNbmOp/preview";
const EXAM_SCHEDULE_URL = "https://drive.google.com/file/d/1T-OU5t-RTQg2utNNpxbQRvfnhrmN8UeT/preview";

const EXAM_LEGEND = {
  ec2: [
    { slot: "FN", time: "9:00 AM – 11:00 AM", duration: "2 hrs" },
    { slot: "AN", time: "1:00 PM – 3:00 PM", duration: "2 hrs" },
    { slot: "EN", time: "4:30 PM – 6:30 PM", duration: "2 hrs" }
  ],
  ec3: [
    { slot: "FN", time: "9:00 AM – 11:30 AM", duration: "2.5 hrs" },
    { slot: "AN", time: "1:00 PM – 3:30 PM", duration: "2.5 hrs" },
    { slot: "EN", time: "4:30 PM – 7:00 PM", duration: "2.5 hrs" }
  ]
};

const state = {
  bootstrap: null,
  deadlines: [],
  selection: {
    elective1: localStorage.getItem("selectedElective1") || "",
    elective2: localStorage.getItem("selectedElective2") || ""
  },
  mode: "class",
  view: "list",
  examScope: "all",
  calendarMonthOffset: 0
};

const el = (id) => document.getElementById(id);

function qs(params) {
  return new URLSearchParams(params).toString();
}

async function fetchJSON(path, params = {}) {
  const url = `${CONFIG.apiBase}${path}${path.includes("?") ? "&" : "?"}${qs(params)}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function setOptions(select, values, current) {
  select.innerHTML = "";
  values.forEach((value) => {
    const opt = document.createElement("option");
    opt.value = value;
    opt.textContent = value;
    if (value === current) opt.selected = true;
    select.appendChild(opt);
  });
}

function getSetting(key, fallback = "") {
  const settings = state.bootstrap?.settings || [];
  const found = settings.find((s) => String(s.key).trim() === String(key).trim());
  return found?.value ?? fallback;
}

function getElectivesMap() {
  const map = {};
  (state.bootstrap?.electives || []).forEach((e) => {
    const id = String(e.elective_id || "").toLowerCase();
    map[id] = e;
  });
  return map;
}

function electiveLabel(id) {
  const map = getElectivesMap();
  const item = map[String(id || "").toLowerCase()];
  if (!item) return id || "";
  return item.full_name || item.short_name || id;
}

function getSelectedElectives() {
  return [state.selection.elective1, state.selection.elective2]
    .filter(Boolean)
    .map((x) => String(x).toLowerCase());
}

function getAllowedElectives() {
  return [...MANDATORY_ELECTIVES, ...getSelectedElectives()];
}

function getLinksMap() {
  const links = state.bootstrap?.links || [];
  const map = {};
  links.forEach((link) => {
    const normalized = String(link.label || "").toLowerCase().replace(/\s+/g, "");
    map[normalized] = link.url;
  });
  return map;
}

function normalizeText(v) {
  return String(v || "").trim();
}

function parseFlexibleDate(value) {
  const raw = normalizeText(value);
  if (!raw) return null;
  const lowered = raw.toLowerCase();
  if (lowered.includes("not provided") || lowered.includes("not there") || lowered === "-") return null;

  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{1,2}):(\d{2})(?:\s*(AM|PM))?)?/i);
  if (iso) {
    let [, y, m, d, hh, mm, ap] = iso;
    let hour = hh ? Number(hh) : 0;
    const minute = mm ? Number(mm) : 0;
    if (ap) {
      const up = ap.toUpperCase();
      if (hour === 12) hour = 0;
      if (up === "PM") hour += 12;
    }
    return new Date(Number(y), Number(m) - 1, Number(d), hour, minute, 0, 0);
  }

  const dmy = raw.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})(?:\s*\((FN|AN|EN)\))?/i);
  if (dmy) {
    const [, d, m, y] = dmy;
    return new Date(Number(y), Number(m) - 1, Number(d), 0, 0, 0, 0);
  }

  const cleaned = raw
    .replace(/(\d+)(st|nd|rd|th)/gi, "$1")
    .replace(/\((sun|mon|tue|wed|thu|fri|sat)\)/gi, "")
    .replace(/\bIST\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  const direct = new Date(cleaned);
  if (!Number.isNaN(direct.getTime())) return direct;

  const mmm = cleaned.match(/^(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})(?:\s+(\d{1,2}):(\d{2})\s*(AM|PM))?/i);
  if (mmm) {
    const monthNames = {
      jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2, apr: 3, april: 3,
      may: 4, jun: 5, june: 5, jul: 6, july: 6, aug: 7, august: 7,
      sep: 8, sept: 8, september: 8, oct: 9, october: 9, nov: 10, november: 10, dec: 11, december: 11
    };
    const day = Number(mmm[1]);
    const month = monthNames[mmm[2].toLowerCase()];
    const year = Number(mmm[3]);
    if (month !== undefined) {
      let hour = mmm[4] ? Number(mmm[4]) : 0;
      const minute = mmm[5] ? Number(mmm[5]) : 0;
      const ap = mmm[6] ? mmm[6].toUpperCase() : "";
      if (ap) {
        if (hour === 12) hour = 0;
        if (ap === "PM") hour += 12;
      }
      return new Date(year, month, day, hour, minute, 0, 0);
    }
  }

  return null;
}

function normalizeDeadline(row) {
  const startRaw = normalizeText(row.start_date || row.start_display || row.starttime || row.start || row.date);
  const endRaw = normalizeText(row.end_date || row.end_display || row.endtime || row.end || startRaw);
  const subject = normalizeText(row.subject || row.short_name || row.name || row.elective || row.elective_id);
  const elective = normalizeText(row.elective || row.elective_id || subject).toLowerCase();
  const type = normalizeText(row.type || row.category || row.section).toLowerCase();
  const title = normalizeText(row.title || row.event || row.name || row.subject);
  const details = normalizeText(row.details || row.moredetails || row.description || row.message);
  const startDate = parseFlexibleDate(startRaw);
  const endDate = parseFlexibleDate(endRaw || startRaw);

  return {
    ...row,
    subject,
    elective,
    type,
    title,
    details,
    startRaw,
    endRaw,
    startDate,
    endDate
  };
}

function isBadText(row) {
  const text = [row.startRaw, row.endRaw, row.details, row.title]
    .map((v) => String(v || "").toLowerCase())
    .join(" ");
  return text.includes("not provided") || text.includes("not there") || text.includes("tbd");
}

function isUpcoming(row) {
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
  const end = row.endDate || row.startDate;
  if (!end) return false;
  return end >= todayStart;
}

function activeRows() {
  const currentSemester = String(getSetting("current_semester", CONFIG.defaultSemester || "2"));
  const allowedElectives = getAllowedElectives();

  return state.deadlines
    .filter((row) => String(row.semester) === currentSemester)
    .filter((row) => {
      const electiveOk = allowedElectives.includes(row.elective) || row.elective === "common" || row.elective === "all";
      if (!electiveOk) return false;
      if (isBadText(row)) return false;
      return isUpcoming(row);
    })
    .filter((row) => {
      if (state.mode === "ec1") return ["quiz", "assignment"].includes(row.type);
      if (state.mode === "exam") return ["midsem_exam", "endsem_exam"].includes(row.type);
      return true;
    })
    .filter((row) => {
      if (state.mode !== "exam") return true;
      if (state.examScope === "all") return true;
      if (state.examScope === "ec2") return row.type === "midsem_exam";
      if (state.examScope === "ec3") return row.type === "endsem_exam";
      return true;
    })
    .sort((a, b) => {
      const da = (a.endDate || a.startDate || new Date(0)).getTime();
      const db = (b.endDate || b.startDate || new Date(0)).getTime();
      return da - db;
    });
}

function eventLabel(item) {
  return `${item.subject || item.elective || "General"} · ${item.type || ""} · ${item.title || ""}`;
}

function formatDate(dateObj) {
  if (!dateObj) return "";
  return dateObj.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function renderList(items) {
  if (!items.length) return `<p class="empty-state">No upcoming entries found for this view.</p>`;
  return `
    <div class="card-list">
      ${items.map((item) => `
        <article class="item" style="border-left-color:${TYPE_COLORS[item.type] || TYPE_COLORS.default}">
          <div class="item-top">
            <h3>${eventLabel(item)}</h3>
            <span class="type-pill">${(item.type || "item").replace(/_/g, " ")}</span>
          </div>
          <div class="meta-row">
            <span>${formatDate(item.startDate || item.endDate)}</span>
            ${item.details ? `<span>${item.details}</span>` : ""}
          </div>
        </article>
      `).join("")}
    </div>
  `;
}

function renderTable(items) {
  if (!items.length) return `<p class="empty-state">No upcoming entries found for this view.</p>`;
  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Event</th>
            <th>Date</th>
            <th>Type</th>
          </tr>
        </thead>
        <tbody>
          ${items.map((item) => `
            <tr>
              <td>${eventLabel(item)}</td>
              <td>${formatDate(item.startDate || item.endDate)}</td>
              <td>${(item.type || "").replace(/_/g, " ")}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderCalendar(items) {
  const baseDate = new Date();
  const monthDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + state.calendarMonthOffset, 1);
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const monthName = monthDate.toLocaleString("default", { month: "long", year: "numeric" });
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayIso = new Date().toISOString().slice(0, 10);

  const headings = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => `<div class="day-head">${d}</div>`).join("");
  const cells = [];

  for (let i = 0; i < firstDay; i++) cells.push(`<div class="day empty"></div>`);

  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, month, d);
    const iso = dateObj.toISOString().slice(0, 10);
    const isToday = iso === todayIso;
    const dayItems = items.filter((item) => {
      const s = item.startDate || item.endDate;
      const e = item.endDate || item.startDate;
      if (!s && !e) return false;
      const start = s ? new Date(s.getFullYear(), s.getMonth(), s.getDate()).toISOString().slice(0,10) : "";
      const end = e ? new Date(e.getFullYear(), e.getMonth(), e.getDate()).toISOString().slice(0,10) : start;
      return iso >= start && iso <= end;
    });

    cells.push(`
      <div class="day ${isToday ? "today" : ""}">
        <div class="day-num">${d}${isToday ? `<span class="today-tag">Today</span>` : ""}</div>
        ${dayItems.map((it) => `
          <div class="badge" style="background:${TYPE_COLORS[it.type] || TYPE_COLORS.default}">
            ${eventLabel(it)}
          </div>
        `).join("")}
      </div>
    `);
  }

  return `
    <div class="calendar-controls">
      <button type="button" id="prevMonthBtn">← Prev</button>
      <div class="calendar-title">${monthName}</div>
      <button type="button" id="todayBtn">Today</button>
      <button type="button" id="nextMonthBtn">Next →</button>
    </div>
    <div class="calendar-grid">
      ${headings}
      ${cells.join("")}
    </div>
  `;
}

function renderScheduleImage(url, title, note) {
  return `
    <div class="image-card">
      <div class="image-card-head">
        <div>
          <p class="eyebrow">${note}</p>
          <h2>${title}</h2>
        </div>
        <a class="ghost-link" href="${url}" target="_blank" rel="noreferrer">Open full view</a>
      </div>
      <iframe class="schedule-frame" src="${url}" loading="lazy" title="${title}"></iframe>
    </div>
  `;
}

function renderLegend() {
  return `
    <div class="legend-grid">
      <div class="legend-card">
        <h3>EC-2 regular / make-up</h3>
        ${EXAM_LEGEND.ec2.map((item) => `<div class="legend-row"><span class="slot ${item.slot.toLowerCase()}">${item.slot}</span><span>${item.time}</span><span>${item.duration}</span></div>`).join("")}
      </div>
      <div class="legend-card">
        <h3>EC-3 regular / make-up</h3>
        ${EXAM_LEGEND.ec3.map((item) => `<div class="legend-row"><span class="slot ${item.slot.toLowerCase()}">${item.slot}</span><span>${item.time}</span><span>${item.duration}</span></div>`).join("")}
      </div>
    </div>
  `;
}

function renderExamList(items) {
  if (!items.length) return `<p class="empty-state">No exam rows found for this filter.</p>`;
  return `
    ${renderLegend()}
    <div class="card-list">
      ${items.map((item) => {
        const scope = item.type === "midsem_exam" ? "EC-2" : "EC-3";
        const sessionMatch = (item.startRaw || item.endRaw || "").match(/\((FN|AN|EN)\)/i);
        const session = sessionMatch ? sessionMatch[1].toUpperCase() : "";
        const duration = scope === "EC-2" ? "2 hrs" : "2.5 hrs";
        return `
          <article class="item exam-item" style="border-left-color:${TYPE_COLORS[item.type] || TYPE_COLORS.default}">
            <div class="item-top">
              <h3>${eventLabel(item)}</h3>
              <span class="type-pill">${scope}</span>
            </div>
            <div class="meta-row">
              <span>${item.startRaw || item.endRaw || ""}</span>
              <span>${session ? `${session} · ${duration}` : duration}</span>
            </div>
          </article>
        `;
      }).join("")}
    </div>
  `;
}

function updateSummary() {
  const sem = getSetting("current_semester", CONFIG.defaultSemester || "2");
  const e1 = electiveLabel(state.selection.elective1);
  const e2 = electiveLabel(state.selection.elective2);
  const summary = `Semester ${sem} • ${MANDATORY_ELECTIVES.map(electiveLabel).join(" + ")} • ${[e1, e2].filter(Boolean).join(" • ")}`;
  el("selectedSummary").textContent = summary;
}

function updateProgress() {
  const done = Number(getSetting("current_lecture", 0));
  const total = Number(getSetting("total_lectures", 16));
  const percent = Math.min(100, Math.round((done / total) * 100));
  el("progressText").textContent = `${done} / ${total} lectures`;
  el("progressFill").style.width = `${percent}%`;
}

function updateBanner() {
  el("bannerTitle").textContent = getSetting("top_banner_title", "Academic tracker");
  el("bannerText").textContent = getSetting("top_banner_message", "Choose your electives to filter the live schedule.");
}

function updateFooterLinks() {
  const links = getLinksMap();
  if (links.taxila) el("taxilaLink").href = links.taxila;
  if (links.masterdrive) el("driveLink").href = links.masterdrive;
  if (links.examlinks) el("examLink").href = links.examlinks;
}

function renderModeDescription() {
  const descriptions = {
    class: {
      title: "Class schedule",
      text: "Quick view of the weekly class plan."
    },
    ec1: {
      title: "EC1 schedule",
      text: "Upcoming quizzes and assignments only. Past items are hidden."
    },
    exam: {
      title: "Exam schedule",
      text: "EC-2 / EC-3 exam view with image or list mode."
    }
  };
  const info = descriptions[state.mode];
  el("modeTitle").textContent = info.title;
  el("modeText").textContent = info.text;
}

function renderControls() {
  const root = el("controlsRoot");
  if (state.mode === "class") {
    root.innerHTML = `
      <div class="mini-note">
        <span class="mini-chip">Mobile friendly</span>
        <span>Class schedule is shown as the latest shared image.</span>
      </div>
    `;
    return;
  }

  if (state.mode === "ec1") {
    root.innerHTML = `
      <div class="control-strip">
        <div class="view-tabs">
          <button class="subtab ${state.view === "list" ? "active" : ""}" data-view="list">List</button>
          <button class="subtab ${state.view === "table" ? "active" : ""}" data-view="table">Table</button>
          <button class="subtab ${state.view === "calendar" ? "active" : ""}" data-view="calendar">Calendar</button>
        </div>
        <div class="mini-note"><span class="mini-chip">Upcoming only</span><span>Quizzes and assignments only.</span></div>
      </div>
    `;
    return;
  }

  root.innerHTML = `
    <div class="control-stack">
      <div class="scope-tabs">
        <button class="subtab ${state.examScope === "ec2" ? "active" : ""}" data-scope="ec2">EC2 (midsem)</button>
        <button class="subtab ${state.examScope === "ec3" ? "active" : ""}" data-scope="ec3">EC3 (endsem)</button>
        <button class="subtab ${state.examScope === "all" ? "active" : ""}" data-scope="all">All</button>
      </div>
      <div class="view-tabs">
        <button class="subtab ${state.view === "image" ? "active" : ""}" data-view="image">Image</button>
        <button class="subtab ${state.view === "list" ? "active" : ""}" data-view="list">List</button>
      </div>
      <div class="mini-note"><span class="mini-chip">FN / AN / EN</span><span>Timings and durations are shown in the legend and list.</span></div>
    </div>
  `;
}

function renderContent() {
  const items = activeRows();
  const root = el("viewRoot");

  if (state.mode === "class") {
    root.innerHTML = renderScheduleImage(CLASS_SCHEDULE_URL, "Class Schedule", "Weekly class schedule");
    return;
  }

  if (state.mode === "ec1") {
    if (state.view === "table") root.innerHTML = renderTable(items);
    else if (state.view === "calendar") root.innerHTML = renderCalendar(items);
    else root.innerHTML = renderList(items);
    return;
  }

  if (state.view === "image") {
    root.innerHTML = renderScheduleImage(EXAM_SCHEDULE_URL, "Exam Schedule 2026", "EC-2 / EC-3 exam schedule");
    return;
  }

  root.innerHTML = renderExamList(items);
}

function bindModeTabs() {
  document.querySelectorAll("[data-mode]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("[data-mode]").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      state.mode = btn.dataset.mode;
      if (state.mode === "exam" && state.view !== "image" && state.view !== "list") state.view = "image";
      if (state.mode === "class") state.view = "list";
      if (state.mode === "ec1" && !["list", "table", "calendar"].includes(state.view)) state.view = "list";
      renderAll();
    });
  });
}

function bindControls() {
  el("controlsRoot").onclick = (e) => {
    const target = e.target.closest("button");
    if (!target) return;

    if (target.dataset.view) {
      state.view = target.dataset.view;
      renderAll();
      return;
    }

    if (target.dataset.scope) {
      state.examScope = target.dataset.scope;
      renderAll();
      return;
    }
  };

  const prevBtn = document.getElementById("prevMonthBtn");
  const nextBtn = document.getElementById("nextMonthBtn");
  const todayBtn = document.getElementById("todayBtn");

  if (prevBtn) prevBtn.onclick = () => { state.calendarMonthOffset--; renderAll(); };
  if (nextBtn) nextBtn.onclick = () => { state.calendarMonthOffset++; renderAll(); };
  if (todayBtn) todayBtn.onclick = () => { state.calendarMonthOffset = 0; renderAll(); };
}

function populateElectiveOverlay() {
  const electives = (state.bootstrap?.electives || [])
    .filter((e) => !MANDATORY_ELECTIVES.includes(String(e.elective_id || "").toLowerCase()))
    .sort((a, b) => String(a.short_name || "").localeCompare(String(b.short_name || "")));

  const options = `<option value="">Select elective</option>` + electives.map((e) => `<option value="${e.elective_id}">${e.short_name} — ${e.full_name}</option>`).join("");
  el("elective1Select").innerHTML = options;
  el("elective2Select").innerHTML = options;
  el("elective1Select").value = state.selection.elective1;
  el("elective2Select").value = state.selection.elective2;
}

function showOverlay() {
  el("selectionOverlay").classList.add("show");
}

function hideOverlay() {
  el("selectionOverlay").classList.remove("show");
}

function maybePromptSelection() {
  if (!state.selection.elective1 || !state.selection.elective2) {
    populateElectiveOverlay();
    showOverlay();
    return true;
  }
  return false;
}

function renderAll() {
  updateSummary();
  renderModeDescription();
  renderControls();
  renderContent();
  bindControls();
  updateBanner();
  updateProgress();
  updateFooterLinks();
}

async function init() {
  const [bootstrapResponse, deadlinesResponse] = await Promise.all([
    fetchJSON("", { action: "bootstrap" }),
    fetchJSON("", { action: "deadlines" })
  ]);

  state.bootstrap = bootstrapResponse;
  state.deadlines = (deadlinesResponse.deadlines || []).map(normalizeDeadline);

  bindModeTabs();

  if (maybePromptSelection()) {
    el("saveElectivesBtn").onclick = () => {
      const e1 = el("elective1Select").value;
      const e2 = el("elective2Select").value;
      if (!e1 || !e2) return alert("Please select both electives.");
      if (e1 === e2) return alert("Choose two different electives.");
      state.selection.elective1 = e1;
      state.selection.elective2 = e2;
      localStorage.setItem("selectedElective1", e1);
      localStorage.setItem("selectedElective2", e2);
      hideOverlay();
      renderAll();
      bindModeTabs();
    };
    return;
  }

  updateSummary();
  updateBanner();
  updateProgress();
  updateFooterLinks();
  renderModeDescription();
  renderControls();
  renderContent();
  bindModeTabs();
  bindControls();
}

init().catch((err) => {
  console.error(err);
  el("viewRoot").innerHTML = `<p class="empty-state">Could not load data yet. Check config.js and the Apps Script deployment.</p>`;
});
