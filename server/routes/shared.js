export function fail(res, status, code, message, fields) {
  return res
    .status(status)
    .json({ error: { code, message, ...(fields ? { fields } : {}) } });
}
