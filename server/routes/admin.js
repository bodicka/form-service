import { randomBytes } from "node:crypto";
import { Router } from "express";
import { nanoid } from "nanoid";
import { readStore, updateStore } from "../storage.js";
import { validateAnswers, validateFormInput } from "../validation.js";
import { fail } from "./shared.js";

const router = Router();
const sessions = new Set();

function admin(req, res, next) {
  const token = req.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token || !sessions.has(token))
    return fail(res, 401, "UNAUTHORIZED", "Войдите в админку");
  next();
}

router.post("/admin/login", (req, res) => {
  const password = process.env.ADMIN_PASSWORD || "admin";
  if (req.body?.password !== password)
    return fail(res, 401, "INVALID_PASSWORD", "Неверный пароль");
  const token = randomBytes(32).toString("hex");
  sessions.add(token);
  res.json({ token });
});

router.get("/admin/forms", admin, async (_req, res) => {
  const db = await readStore();
  res.json(
    db.forms.map((form) => ({
      ...form,
      responseCount: db.responses.filter(
        (response) => response.formId === form.id,
      ).length,
    })),
  );
});

router.post("/admin/forms", admin, async (req, res) => {
  const { data, error } = validateFormInput(req.body);
  if (error) return fail(res, 400, "VALIDATION_ERROR", error);
  const now = new Date().toISOString();
  const form = {
    id: nanoid(12),
    title: data.title,
    description: data.description,
    fields: data.fields,
    status: "draft",
    slug: null,
    createdAt: now,
    updatedAt: now,
  };
  await updateStore((db) => db.forms.push(form));
  res.status(201).json(form);
});

router.get("/admin/forms/:id", admin, async (req, res) => {
  const db = await readStore();
  const form = db.forms.find((item) => item.id === req.params.id);
  if (!form) return fail(res, 404, "FORM_NOT_FOUND", "Форма не найдена");
  res.json(form);
});

router.put("/admin/forms/:id", admin, async (req, res) => {
  const { data, error } = validateFormInput(req.body);
  if (error) return fail(res, 400, "VALIDATION_ERROR", error);
  let result;
  await updateStore((db) => {
    const index = db.forms.findIndex((item) => item.id === req.params.id);
    if (index < 0) return;
    const previous = db.forms[index];
    result = {
      ...previous,
      title: data.title,
      description: data.description,
      fields: data.fields,
      updatedAt: new Date().toISOString(),
    };
    db.forms[index] = result;
  });
  if (!result) return fail(res, 404, "FORM_NOT_FOUND", "Форма не найдена");
  res.json(result);
});

router.delete("/admin/forms/:id", admin, async (req, res) => {
  let found = false;
  await updateStore((db) => {
    found = db.forms.some((item) => item.id === req.params.id);
    db.forms = db.forms.filter((item) => item.id !== req.params.id);
    db.responses = db.responses.filter((item) => item.formId !== req.params.id);
    db.events = db.events.filter((item) => item.formId !== req.params.id);
  });
  if (!found) return fail(res, 404, "FORM_NOT_FOUND", "Форма не найдена");
  res.status(204).end();
});

router.post("/admin/forms/:id/publish", admin, async (req, res) => {
  let result;
  await updateStore((db) => {
    const form = db.forms.find((item) => item.id === req.params.id);
    if (!form) return;
    if (!form.fields.length) return;
    form.status = "published";
    form.slug = form.slug || nanoid(10);
    form.updatedAt = new Date().toISOString();
    result = form;
  });
  if (!result) {
    const db = await readStore();
    if (!db.forms.some((item) => item.id === req.params.id))
      return fail(res, 404, "FORM_NOT_FOUND", "Форма не найдена");
    return fail(
      res,
      400,
      "EMPTY_FORM",
      "Добавьте хотя бы одно поле перед публикацией",
    );
  }
  res.json(result);
});

router.post("/admin/forms/:id/unpublish", admin, async (req, res) => {
  let result;
  await updateStore((db) => {
    result = db.forms.find((item) => item.id === req.params.id);
    if (result) {
      result.status = "draft";
      result.updatedAt = new Date().toISOString();
    }
  });
  if (!result) return fail(res, 404, "FORM_NOT_FOUND", "Форма не найдена");
  res.json(result);
});

router.get("/admin/forms/:id/responses", admin, async (req, res) => {
  const db = await readStore();
  if (!db.forms.some((form) => form.id === req.params.id))
    return fail(res, 404, "FORM_NOT_FOUND", "Форма не найдена");
  res.json(
    db.responses.filter((response) => response.formId === req.params.id),
  );
});

router.get("/admin/forms/:id/responses.csv", admin, async (req, res) => {
  const db = await readStore();
  const form = db.forms.find((item) => item.id === req.params.id);
  if (!form) return fail(res, 404, "FORM_NOT_FOUND", "Форма не найдена");
  const quote = (value) => {
    const safe = String(value ?? "").replace(/"/g, '""');
    return `"${/^[\s]*[=+\-@]/.test(safe) ? `'${safe}` : safe}"`;
  };
  const rows = [["Отправлено", ...form.fields.map((field) => field.label)]];
  for (const response of db.responses.filter(
    (item) => item.formId === form.id,
  )) {
    rows.push([
      response.submittedAt,
      ...form.fields.map((field) => {
        const value = response.answers[field.id];
        return Array.isArray(value) ? value.join(", ") : value;
      }),
    ]);
  }
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="responses-${form.id}.csv"`,
  );
  res.send(`\uFEFF${rows.map((row) => row.map(quote).join(",")).join("\r\n")}`);
});

router.get("/admin/forms/:id/analytics", admin, async (req, res) => {
  const db = await readStore();
  const form = db.forms.find((item) => item.id === req.params.id);
  if (!form) return fail(res, 404, "FORM_NOT_FOUND", "Форма не найдена");
  const events = db.events.filter((item) => item.formId === form.id);
  const count = (type) =>
    new Set(
      events.filter((item) => item.type === type).map((item) => item.sessionId),
    ).size;
  const views = count("view");
  const starts = count("start");
  const submittedIds = new Set(
    db.responses
      .filter((item) => item.formId === form.id)
      .map((item) => item.sessionId),
  );
  const startedIds = new Set(
    events
      .filter((item) => item.type === "start")
      .map((item) => item.sessionId),
  );
  const lastFieldBySession = new Map();
  for (const event of events
    .filter((item) => ["field_focus", "field_complete"].includes(item.type))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))) {
    if (event.fieldId) lastFieldBySession.set(event.sessionId, event.fieldId);
  }
  const abandoned = new Map();
  for (const [sessionId, fieldId] of lastFieldBySession) {
    if (startedIds.has(sessionId) && !submittedIds.has(sessionId))
      abandoned.set(fieldId, (abandoned.get(fieldId) || 0) + 1);
  }
  const abandonedCount = [...abandoned.values()].reduce(
    (total, value) => total + value,
    0,
  );
  res.json({
    views,
    starts,
    submissions: submittedIds.size,
    startRate: views ? Math.round((starts / views) * 100) : 0,
    conversion: views ? Math.round((submittedIds.size / views) * 100) : 0,
    fields: form.fields.map((field) => ({
      id: field.id,
      label: field.label,
      abandoned: abandoned.get(field.id) || 0,
      dropoffPercent: abandonedCount
        ? Math.round(((abandoned.get(field.id) || 0) / abandonedCount) * 100)
        : 0,
    })),
  });
});

export default router;
