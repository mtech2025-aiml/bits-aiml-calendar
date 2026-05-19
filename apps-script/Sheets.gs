const SHEET_NAMES = {
  settings: "Settings",
  electives: "Electives",
  deadlines: "Deadlines",
  announcements: "Announcements",
  admins: "Admins",
  links: "Links",
};

function ss_() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function sheet_(name) {
  const sh = ss_().getSheetByName(name);
  if (!sh) throw new Error(`Missing sheet: ${name}`);
  return sh;
}

function valuesToObjects_(sheetName) {
  const sh = sheet_(sheetName);
  const values = sh.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0].map(String);
  return values.slice(1).map((row) => {
    const obj = {};
    headers.forEach((h, i) => obj[String(h).trim().toLowerCase()] = row[i]);
    return obj;
  });
}

function getBootstrap_() {
  const settings = valuesToObjects_(SHEET_NAMES.settings);
  const links = valuesToObjects_(SHEET_NAMES.links);
  const bannerRow = valuesToObjects_(SHEET_NAMES.announcements).find((r) => String(r.visible).toLowerCase() === "true") || {};
  const linkMap = {};
  links.forEach((r) => linkMap[String(r.category || r.label || "").toLowerCase()] = r.url || "");
  return {
    ok: true,
    settings: settings[0] || {},
    banner: {
      title: bannerRow.title || bannerRow.subject || "No banner yet",
      message: bannerRow.message || bannerRow.details || "",
    },
    links: {
      taxila: linkMap.taxila || "",
      drive: linkMap.drive || "",
      exam: linkMap.exam || "",
    }
  };
}

function getDeadlines_() {
  return valuesToObjects_(SHEET_NAMES.deadlines).filter((r) => String(r.visible).toLowerCase() !== "false");
}

function getAnnouncements_() {
  return valuesToObjects_(SHEET_NAMES.announcements).filter((r) => String(r.visible).toLowerCase() !== "false");
}
