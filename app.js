const CONFIG = window.APP_CONFIG || {};

const MANDATORY_ELECTIVES = ["aci", "drl"];

const TYPE_COLORS = {
  webinar: "#DBEAFE",
  quiz: "#FEF3C7",
  assignment: "#DCFCE7",
  midsem_exam: "#FECACA",
  endsem_exam: "#E9D5FF",
  default: "#E5E7EB"
};

const state = {
  bootstrap: null,
  deadlines: [],

  selection: {
    elective1: localStorage.getItem("selectedElective1") || "",
    elective2: localStorage.getItem("selectedElective2") || ""
  },

  filters: {
    semester: CONFIG.defaultSemester || "2",
    type: CONFIG.defaultType || "All"
  },

  view: "list",

  calendarMonthOffset: 0
};

const el = (id) => document.getElementById(id);

function qs(params) {
  return new URLSearchParams(params).toString();
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

  const found = settings.find(
    (s) => String(s.key).trim() === String(key).trim()
  );

  return found?.value ?? fallback;

}

function getLinksMap() {

  const links = state.bootstrap?.links || [];

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

function getAllowedElectives() {

  return [
    ...MANDATORY_ELECTIVES,
    state.selection.elective1,
    state.selection.elective2
  ]
  .filter(Boolean)
  .map((x) => String(x).toLowerCase());

}

function filteredDeadlines() {

  const allowedElectives = getAllowedElectives();

  return state.deadlines.filter((row) => {

    const semesterOk =
      String(row.semester) === String(state.filters.semester);

    const electiveId =
      String(row.elective || row.elective_id || "")
        .toLowerCase();

    const electiveOk =
      allowedElectives.includes(electiveId) ||
      electiveId === "common" ||
      electiveId === "all";

    const typeOk =
      state.filters.type === "All" ||
      String(row.type).toLowerCase() ===
      String(state.filters.type).toLowerCase();

    return semesterOk && electiveOk && typeOk;

  });

}

function eventLabel(item) {

  const subject =
    item.subject ||
    item.elective ||
    item.elective_id ||
    "General";

  const type = item.type || "";

  const title = item.title || "";

  return `${subject} · ${type} · ${title}`;

}

function renderList(items) {

  if (!items.length) {
    return `
      <p class="subtle">
        No deadlines found.
      </p>
    `;
  }

  return `
    <div class="card-list">

      ${items.map((item) => {

        const color =
          TYPE_COLORS[item.type] ||
          TYPE_COLORS.default;

        return `
          <div
            class="item"
            style="border-left: 8px solid ${color}"
          >

            <h3>
              ${eventLabel(item)}
            </h3>

            <div class="meta">
              Semester ${item.semester || ""}
            </div>

            <div>
              ${item.details || ""}
            </div>

            <div class="meta">
              ${item.start_date || item.start_display || ""}
              ${item.end_date ? ` → ${item.end_date}` : ""}
            </div>

          </div>
        `;

      }).join("")}

    </div>
  `;

}

function renderTable(items) {

  if (!items.length) {
    return `
      <p class="subtle">
        No deadlines found.
      </p>
    `;
  }

  return `
    <div class="table-wrap">

      <table>

        <thead>
          <tr>
            <th>Event</th>
            <th>Semester</th>
            <th>Start</th>
            <th>End</th>
            <th>Details</th>
          </tr>
        </thead>

        <tbody>

          ${items.map((item) => `

            <tr>

              <td>
                ${eventLabel(item)}
              </td>

              <td>
                ${item.semester || ""}
              </td>

              <td>
                ${item.start_date || item.start_display || ""}
              </td>

              <td>
                ${item.end_date || item.end_display || ""}
              </td>

              <td>
                ${item.details || ""}
              </td>

            </tr>

          `).join("")}

        </tbody>

      </table>

    </div>
  `;

}

function getCalendarDate(item) {

  return (
    item.start_date ||
    item.date ||
    item.start_display ||
    item.end_display ||
    ""
  );

}

function renderCalendar(items) {

  const baseDate = new Date();

  const currentMonthDate =
    new Date(
      baseDate.getFullYear(),
      baseDate.getMonth() + state.calendarMonthOffset,
      1
    );

  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();

  const monthName =
    currentMonthDate.toLocaleString("default", {
      month: "long",
      year: "numeric"
    });

  const firstDay =
    new Date(year, month, 1).getDay();

  const daysInMonth =
    new Date(year, month + 1, 0).getDate();

  const todayIso =
    new Date().toISOString().slice(0, 10);

  const headings =
    ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]
      .map((d) => `<div class="day-head">${d}</div>`)
      .join("");

  let cells = [];

  for (let i = 0; i < firstDay; i++) {
    cells.push(`<div class="day empty"></div>`);
  }

  for (let d = 1; d <= daysInMonth; d++) {

    const dateObj =
      new Date(year, month, d);

    const iso =
      dateObj.toISOString().slice(0, 10);

    const isToday =
      iso === todayIso;

    const dayItems = items.filter((item) => {

      const dt = getCalendarDate(item);

      return String(dt).startsWith(iso);

    });

    cells.push(`

      <div class="day ${isToday ? "today" : ""}">

        <div class="day-num">
          ${d}
          ${isToday ? "<span class='today-tag'>Today</span>" : ""}
        </div>

        ${dayItems.map((it) => {

          const color =
            TYPE_COLORS[it.type] ||
            TYPE_COLORS.default;

          return `
            <div
              class="badge"
              style="background:${color}"
            >
              ${eventLabel(it)}
            </div>
          `;

        }).join("")}

      </div>

    `);

  }

  return `

    <div class="calendar-controls">

      <button id="prevMonthBtn">
        ← Prev
      </button>

      <div class="calendar-title">
        ${monthName}
      </div>

      <button id="nextMonthBtn">
        Next →
      </button>

    </div>

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
    getSetting("top_banner_title", "No banner");

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

function showElectiveSelection() {

  const electives =
    state.bootstrap?.electives || [];

  const available =
    electives.filter((e) => {

      const id =
        String(e.elective_id || "")
          .toLowerCase();

      return !MANDATORY_ELECTIVES.includes(id);

    });

  document.body.innerHTML = `

    <div class="shell">

      <section class="panel">

        <h1>
          Select your 2 electives
        </h1>

        <p class="subtle">
          ACI and DRL are mandatory for everyone and will always be shown.
        </p>

        <div class="row">

          <div>

            <label>
              Elective 1
            </label>

            <select id="elective1Select">

              <option value="">
                Select elective
              </option>

              ${available.map((e) => `
                <option value="${e.elective_id}">
                  ${e.short_name} — ${e.full_name}
                </option>
              `).join("")}

            </select>

          </div>

          <div>

            <label>
              Elective 2
            </label>

            <select id="elective2Select">

              <option value="">
                Select elective
              </option>

              ${available.map((e) => `
                <option value="${e.elective_id}">
                  ${e.short_name} — ${e.full_name}
                </option>
              `).join("")}

            </select>

          </div>

        </div>

        <br>

        <button id="saveElectivesBtn">
          Continue
        </button>

      </section>

    </div>

  `;

  el("saveElectivesBtn")
    .addEventListener("click", () => {

      const e1 =
        el("elective1Select").value;

      const e2 =
        el("elective2Select").value;

      if (!e1 || !e2) {
        alert("Please select both electives.");
        return;
      }

      if (e1 === e2) {
        alert("Choose two different electives.");
        return;
      }

      localStorage.setItem(
        "selectedElective1",
        e1
      );

      localStorage.setItem(
        "selectedElective2",
        e2
      );

      location.reload();

    });

}

function render() {

  const items =
    filteredDeadlines();

  const root =
    el("viewRoot");

  if (state.view === "table") {

    root.innerHTML =
      renderTable(items);

  } else if (state.view === "calendar") {

    root.innerHTML =
      renderCalendar(items);

    const prevBtn =
      document.getElementById("prevMonthBtn");

    const nextBtn =
      document.getElementById("nextMonthBtn");

    if (prevBtn) {

      prevBtn.addEventListener("click", () => {

        state.calendarMonthOffset--;

        render();

      });

    }

    if (nextBtn) {

      nextBtn.addEventListener("click", () => {

        state.calendarMonthOffset++;

        render();

      });

    }

  } else {

    root.innerHTML =
      renderList(items);

  }

}

async function init() {

  console.log("Loading bootstrap...");

  const bootstrapResponse =
    await fetchJSON("", {
      action: "bootstrap"
    });

  state.bootstrap =
    bootstrapResponse;

  console.log("Loading deadlines...");

  const deadlinesResponse =
    await fetchJSON("", {
      action: "deadlines"
    });

  state.deadlines =
    (deadlinesResponse.deadlines || [])
      .map((d) => ({
        ...d,

        elective:
          String(
            d.elective ||
            d.elective_id ||
            ""
          ).toLowerCase(),

        type:
          String(d.type || "")
            .toLowerCase()
      }));

  if (
    !state.selection.elective1 ||
    !state.selection.elective2
  ) {

    showElectiveSelection();

    return;

  }

  const types = [
    "All",
    ...unique(
      state.deadlines.map((d) => d.type)
    )
  ];

  setOptions(
    el("typeSelect"),
    types,
    state.filters.type
  );

  el("typeSelect")
    .addEventListener("change", (e) => {

      state.filters.type =
        e.target.value;

      render();

    });

  document.querySelectorAll(".tab")
    .forEach((btn) => {

      btn.addEventListener("click", () => {

        document
          .querySelectorAll(".tab")
          .forEach((b) =>
            b.classList.remove("active")
          );

        btn.classList.add("active");

        state.view =
          btn.dataset.view;

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

  const root =
    document.getElementById("viewRoot");

  if (root) {

    root.innerHTML = `
      <p class="subtle">
        Could not load data.
        <br><br>
        Check:
        <br>
        • config.js API URL
        <br>
        • Apps Script deployment
        <br>
        • browser console
      </p>
    `;

  }

});
