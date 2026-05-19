const CONFIG = window.APP_CONFIG || {};
const state = {
  bootstrap: null,
  deadlines: [],
  filters: {
    semester: CONFIG.defaultSemester || "All",
    elective: CONFIG.defaultElective || "All",
    type: CONFIG.defaultType || "All"
  },
  view: "list"
};

const el = (id) => document.getElementById(id);

function qs(params) {
  const u = new URLSearchParams(params);
  return u.toString();
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

function filteredDeadlines() {
  return state.deadlines.filter((row) => {
    const semesterOk = state.filters.semester === "All" || row.semester === state.filters.semester;
    const electiveOk = state.filters.elective === "All" || row.elective === state.filters.elective;
    const typeOk = state.filters.type === "All" || row.type === state.filters.type;
    return semesterOk && electiveOk && typeOk;
  });
}

function renderList(items) {
  if (!items.length) return "<p class='subtle'>No deadlines found for the selected filters.</p>";
  return `<div class="card-list">${items.map((item) => `
    <div class="item">
      <h3>${item.title || item.subject || "Deadline"}</h3>
      <div class="meta">${item.semester || ""} • ${item.elective || ""} • ${item.type || ""}</div>
      <div>${item.details || ""}</div>
      <div class="meta">${item.end_display || item.date || ""}</div>
    </div>`).join("")}</div>`;
}

function renderTable(items) {
  if (!items.length) return "<p class='subtle'>No deadlines found for the selected filters.</p>";
  return `<div class="table-wrap"><table>
    <thead><tr><th>Title</th><th>Semester</th><th>Elective</th><th>Type</th><th>Due</th><th>Details</th></tr></thead>
    <tbody>${items.map((item) => `
      <tr>
        <td>${item.title || item.subject || ""}</td>
        <td>${item.semester || ""}</td>
        <td>${item.elective || ""}</td>
        <td>${item.type || ""}</td>
        <td>${item.end_display || item.date || ""}</td>
        <td>${item.details || ""}</td>
      </tr>`).join("")}</tbody>
  </table></div>`;
}

function renderCalendar(items) {
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const firstDay = monthStart.getDay();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const headings = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => `<div class="day-head">${d}</div>`).join("");
  let cells = Array.from({length: firstDay}, () => "<div class='day'></div>");
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = new Date(today.getFullYear(), today.getMonth(), d).toISOString().slice(0,10);
    const dayItems = items.filter((item) => (item.date || "").startsWith(dateStr));
    cells.push(`
      <div class="day">
        <div class="day-num">${d}</div>
        ${dayItems.map((it) => `<div class="badge">${it.type || "item"} · ${it.title || it.subject || ""}</div>`).join("")}
      </div>`);
  }
  return `<div class="calendar-grid">${headings}${cells.join("")}</div>`;
}

function updateProgress() {
  const meta = state.bootstrap?.settings || {};
  const done = Number(meta.current_lectures || 0);
  const total = Number(meta.total_lectures || 16);
  const percent = Math.min(100, Math.round((done / total) * 100));
  el("progressText").textContent = `${done} / ${total} lectures`;
  el("progressFill").style.width = `${percent}%`;
}

function updateBanner() {
  const banner = state.bootstrap?.banner || {};
  el("bannerTitle").textContent = banner.title || "No banner yet";
  el("bannerText").textContent = banner.message || "";
}

function updateFooterLinks() {
  const links = state.bootstrap?.links || {};
  if (links.taxila) el("taxilaLink").href = links.taxila;
  if (links.drive) el("driveLink").href = links.drive;
  if (links.exam) el("examLink").href = links.exam;
}

function render() {
  const items = filteredDeadlines();
  const root = el("viewRoot");
  if (state.view === "table") root.innerHTML = renderTable(items);
  else if (state.view === "calendar") root.innerHTML = renderCalendar(items);
  else root.innerHTML = renderList(items);
}

async function init() {
  state.bootstrap = await fetchJSON("", { action: "bootstrap" });
  state.deadlines = await fetchJSON("", { action: "deadlines" });

  const semesters = ["All", ...unique(state.deadlines.map((d) => d.semester))];
  const electives = ["All", ...unique(state.deadlines.map((d) => d.elective))];
  const types = ["All", ...unique(state.deadlines.map((d) => d.type))];

  setOptions(el("semesterSelect"), semesters, state.filters.semester);
  setOptions(el("electiveSelect"), electives, state.filters.elective);
  setOptions(el("typeSelect"), types, state.filters.type);

  el("semesterSelect").addEventListener("change", (e) => { state.filters.semester = e.target.value; render(); });
  el("electiveSelect").addEventListener("change", (e) => { state.filters.elective = e.target.value; render(); });
  el("typeSelect").addEventListener("change", (e) => { state.filters.type = e.target.value; render(); });

  document.querySelectorAll(".tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      state.view = btn.dataset.view;
      render();
    });
  });

  updateBanner();
  updateProgress();
  updateFooterLinks();
  render();
}

init().catch((err) => {
  console.error(err);
  el("viewRoot").innerHTML = "<p class='subtle'>Could not load data yet. Paste your Apps Script URL into config.js and check the backend deployment.</p>";
});
