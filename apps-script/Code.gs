function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || "bootstrap";
  const payload = route_(action, e ? e.parameter : {});
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const body = e && e.postData && e.postData.contents ? JSON.parse(e.postData.contents) : {};
  const action = body.action || "noop";
  const payload = route_(action, body);
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function route_(action, params) {
  switch (action) {
    case "bootstrap":
      return getBootstrap_();
    case "deadlines":
      return { ok: true, items: getDeadlines_() };
    case "announcements":
      return { ok: true, items: getAnnouncements_() };
    case "saveDeadline":
      return saveDeadline_(params);
    default:
      return { ok: true, message: "No action" };
  }
}
