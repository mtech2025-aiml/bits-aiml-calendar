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

  const url =
    `${CONFIG.apiBase}${path}${path.includes("?") ? "&" : "?"}${qs(params)}`;

  const res = await fetch(url, {
    cache: "no-store"
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

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

    if (value === current) {
      opt.selected = true;
    }

    select.appendChild(opt);

  });

}

function getSetting(key, fallback = "") {

  const settings = state.bootstrap?.settings || [];

  if (!Array.isArray(settings)) {
    return fallback;
  }

  const found = settings.find(
    (s) => String(s.key).trim() === String(key).trim()
  );

  return found?.value ?? fallback;

}

function getLinksMap() {

  const links = state.bootstrap?.links || [];

  if (!Array.isArray(links)) {
    return {};
  }

  const map = {};

  links.forEach((link) => {

    const normalized =
      String(link.label || "")
        .toLowerCase()
        .replace(/\s+/g, "");

    map[normalized] = link.url;

  });

  return map;

}

function filteredDeadlines() {

  return state.deadlines.filter((row) => {

    const semesterOk =
      state.filters.semester === "All" ||
      String(row.semester) === String(state.filters.semester);

    const electiveOk =
      state.filters.elective === "All" ||
      String(row.elective) === String(state.filters.elective);

    const typeOk =
      state.filters.type === "All" ||
      String(row.type) === String(state.filters.type);

    return semesterOk && electiveOk && typeOk;

  });

}

function renderList(items) {

  if (!items.length) {
    return `
      <p class="subtle">
        No deadlines found for the selected filters.
      </p>
    `;
  }

  return `
    <div class="card-list">
      ${items.map((item) => `
        <div class="item">
          <h3>${item.title || item.subject || "Deadline"}</h3>

          <div class="meta">
            Semester ${item.semester || ""}
            •
            ${item.subject || item.elective || ""}
            •
            ${item.type || ""}
          </div>

          <div>
            ${item.details || ""}
          </div>

          <div class="meta">
            ${item.end_display || item.date || ""}
          </div>
        </div>
      `).join("")}
    </div>
  `;

}

function renderTable(items) {

  if (!items.length) {
    return `
      <p class="subtle">
        No deadlines found for the selected filters.
      </p>
    `;
  }

  return `
    <div class="table-wrap">
      <table>

        <thead>
          <tr>
            <th>Title</th>
            <th>Semester</th>
            <th>Elective</th>
            <th>Type</th>
            <th>Due</th>
            <th>Details</th>
          </tr>
        </thead>

        <tbody>

          ${items.map((item) => `
            <tr>
              <td>${item.title || item.subject || ""}</td>
              <td>${item.semester || ""}</td>
              <td>${item.subject || item.elective || ""}</td>
              <td>${item.type || ""}</td>
              <td>${item.end_display || item.date || ""}</td>
              <td>${item.details || ""}</td>
            </tr>
          `).join("")}

        </tbody>

      </table>
    </div>
  `;

}

function renderCalendar(items) {

  const today = new Date();

  const monthStart =
    new Date(today.getFullYear(), today.getMonth(), 1);

  const firstDay = monthStart.getDay();

  const daysInMonth =
    new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

  const headings =
    ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]
      .map((d) => `<div class="day-head">${d}</div>`)
      .join("");

  let cells = Array.from(
    { length: firstDay },
    () => "<div class='day'></div>"
  );

  for (let d = 1; d <= daysInMonth; d++) {

    const dateObj =
      new Date(today.getFullYear(), today.getMonth(), d);

    const dateStr =
      dateObj.toISOString().slice(0, 10);

    const dayItems = items.filter((item) => {

      const txt =
        `${item.start_display || ""} ${item.end_display || ""}`.toLowerCase();

      return txt.includes(dateObj.getDate().toString());

    });

    cells.push(`
      <div class="day">

        <div class="day-num">
          ${d}
        </div>

        ${dayItems.map((it) => `
          <div class="badge">
            ${it.type || "item"} · ${it.title || it.subject || ""}
          </div>
        `).join("")}

      </div>
    `);

  }

  return `
    <div class="calendar-grid">
      ${headings}
      ${cells.join("")}
    </div>
  `;

}

function updateProgress() {

  const done =
    Number(getSetting("current_lecture", 0));

  const total =
    Number(getSetting("total_lectures", 16));

  const percent =
    Math.min(100, Math.round((done / total) * 100));

  el("progressText").textContent =
    `${done} / ${total} lectures`;

  el("progressFill").style.width =
    `${percent}%`;

}

function updateBanner() {

  el("bannerTitle").textContent =
    getSetting("top_banner_title", "No banner yet");

  el("bannerText").textContent =
    getSetting("top_banner_message", "");

}

function updateFooterLinks() {

  const links = getLinksMap();

  if (links.taxila) {
    el("taxilaLink").href = links.taxila;
  }

  if (links.masterdrive) {
    el("driveLink").href = links.masterdrive;
  }

  if (links.examlinks) {
    el("examLink").href = links.examlinks;
  }

}

function render() {

  const items = filteredDeadlines();

  const root = el("viewRoot");

  if (state.view === "table") {

    root.innerHTML = renderTable(items);

  } else if (state.view === "calendar") {

    root.innerHTML = renderCalendar(items);

  } else {

    root.innerHTML = renderList(items);

  }

}

async function init() {

  console.log("Loading bootstrap...");

  const bootstrapResponse =
    await fetchJSON("", { action: "bootstrap" });

  console.log("Bootstrap response:", bootstrapResponse);

  state.bootstrap = bootstrapResponse;

  console.log("Loading deadlines...");

  const deadlinesResponse =
    await fetchJSON("", { action: "deadlines" });

  console.log("Deadlines response:", deadlinesResponse);

  state.deadlines =
    (deadlinesResponse.deadlines || []).map((d) => ({
      ...d,
      elective: d.elective || d.elective_id || "",
      date: d.date || d.end_display || d.start_display || ""
    }));

  console.log("Normalized deadlines:", state.deadlines);

  const semesters = [
    "All",
    ...unique(
      state.deadlines.map((d) => String(d.semester))
    )
  ];

  const electives = [
    "All",
    ...unique(
      state.deadlines.map((d) => d.elective)
    )
  ];

  const types = [
    "All",
    ...unique(
      state.deadlines.map((d) => d.type)
    )
  ];

  setOptions(
    el("semesterSelect"),
    semesters,
    state.filters.semester
  );

  setOptions(
    el("electiveSelect"),
    electives,
    state.filters.elective
  );

  setOptions(
    el("typeSelect"),
    types,
    state.filters.type
  );

  el("semesterSelect").addEventListener("change", (e) => {

    state.filters.semester = e.target.value;

    render();

  });

  el("electiveSelect").addEventListener("change", (e) => {

    state.filters.elective = e.target.value;

    render();

  });

  el("typeSelect").addEventListener("change", (e) => {

    state.filters.type = e.target.value;

    render();

  });

  document.querySelectorAll(".tab").forEach((btn) => {

    btn.addEventListener("click", () => {

      document
        .querySelectorAll(".tab")
        .forEach((b) => b.classList.remove("active"));

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

  el("viewRoot").innerHTML = `
    <p class="subtle">
      Could not load data yet.
      Check:
      <br><br>
      • config.js has correct Apps Script URL
      <br>
      • Apps Script deployment is live
      <br>
      • Browser console for errors
    </p>
  `;

});
