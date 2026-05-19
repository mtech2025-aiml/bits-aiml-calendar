function isAdmin_(email) {
  if (!email) return false;
  const rows = valuesToObjects_(SHEET_NAMES.admins);
  return rows.some((r) =>
    String(r.email).toLowerCase() === String(email).toLowerCase() &&
    String(r.active).toLowerCase() !== "false"
  );
}

function saveDeadline_(payload) {
  return { ok: true, message: "Stub: connect write logic after admin auth is added." };
}
