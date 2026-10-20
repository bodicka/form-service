import { Router } from "express";
import { nanoid } from "nanoid";
import { readStore, updateStore } from "../storage.js";
import { normalizeSessionId, validateAnswers } from "../validation.js";
import { fail } from "./shared.js";

const router = Router();
const eventTypes = new Set([
  "view",
  "start",
  "field_focus",
  "field_complete",
  "submit",
]);

function publicForm(form) {
  const { id, title, description, fields, status, slug } = form;
  return { id, title, description, fields, status, slug };
}

router.get("/public/forms/:slug", async (req, res) => {
  const db = await readStore();
  const form = db.forms.find((item) => item.slug === req.params.slug);
  if (!form) return fail(res, 404, "FORM_NOT_FOUND", "Форма не найдена");
  if (form.status !== "published")
    return fail(res, 410, "FORM_CLOSED", "Форма закрыта");
  res.json(publicForm(form));
});

router.post("/public/forms/:slug/responses", async (req, res) => {
  const db = await readStore();
  const form = db.forms.find((item) => item.slug === req.params.slug);
  if (!form) return fail(res, 404, "FORM_NOT_FOUND", "Форма не найдена");
  if (form.status !== "published")
    return fail(res, 410, "FORM_CLOSED", "Форма закрыта");
  const fields = validateAnswers(form, req.body?.answers);
  if (Object.keys(fields).length)
    return fail(
      res,
      400,
      "VALIDATION_ERROR",
      "Проверьте ответы в форме",
      fields,
    );
  const sessionId = normalizeSessionId(req.body?.sessionId);
  if (!sessionId)
    return fail(res, 400, "VALIDATION_ERROR", "Некорректная сессия");
  const response = {
    id: nanoid(12),
    formId: form.id,
    sessionId,
    answers: req.body.answers,
    submittedAt: new Date().toISOString(),
  };
  await updateStore((store) => store.responses.push(response));
  res.status(201).json({ id: response.id, submittedAt: response.submittedAt });
});

router.post("/public/forms/:slug/events", async (req, res) => {
  const { type, fieldId } = req.body || {};
  const sessionId = normalizeSessionId(req.body?.sessionId);
  if (!eventTypes.has(type) || !sessionId)
    return fail(res, 400, "VALIDATION_ERROR", "Некорректное событие");
  let formFound = false;
  let invalidField = false;
  await updateStore((db) => {
    const form = db.forms.find(
      (item) => item.slug === req.params.slug && item.status === "published",
    );
    if (!form) return;
    formFound = true;
    if (
      fieldId !== undefined &&
      (typeof fieldId !== "string" ||
        !form.fields.some((field) => field.id === fieldId))
    ) {
      invalidField = true;
      return;
    }
    db.events.push({
      id: nanoid(12),
      formId: form.id,
      sessionId,
      type,
      ...(fieldId ? { fieldId } : {}),
      createdAt: new Date().toISOString(),
    });
  });
  if (invalidField)
    return fail(res, 400, "VALIDATION_ERROR", "Поле формы не найдено");
  if (!formFound) return fail(res, 404, "FORM_NOT_FOUND", "Форма не найдена");
  res.status(202).json({ accepted: true });
});

export default router;
