import { z } from "zod";

const OPTION_TYPES = new Set(["radio", "select", "checkbox"]);

const FieldSchema = z.object({
  id: z
    .string()
    .trim()
    .min(1, "Укажите ID поля")
    .max(100, "Слишком длинный ID поля")
    .regex(/^[A-Za-z0-9_-]+$/, "Некорректный ID поля"),
  type: z.enum([
    "text",
    "textarea",
    "email",
    "phone",
    "number",
    "radio",
    "select",
    "checkbox",
    "date",
    "url",
  ]),
  label: z
    .string()
    .trim()
    .min(1, "Укажите название вопроса")
    .max(300, "Название вопроса слишком длинное"),
  description: z.string().max(2000, "Подсказка к вопросу слишком длинная"),
  placeholder: z.string().max(300, "Текст в поле слишком длинный"),
  required: z.boolean(),
  options: z
    .array(z.string().max(300, "Вариант ответа слишком длинный"))
    .max(50, "Слишком много вариантов ответа"),
});

const FormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Укажите название формы")
    .max(160, "Название формы слишком длинное"),
  description: z.string().max(5000, "Описание формы слишком длинное"),
  fields: z
    .array(FieldSchema)
    .min(1, "Добавьте хотя бы один вопрос")
    .max(50, "В форме может быть не более 50 полей"),
});

const AnswersSchema = z.record(
  z.string(),
  z.union([z.string(), z.array(z.string())]),
);
const SessionIdSchema = z
  .string()
  .trim()
  .min(1, "Некорректная сессия")
  .max(100, "Некорректная сессия");

function normalizeOptions(options) {
  return [...new Set(options.map((option) => option.trim()).filter(Boolean))];
}

function normalizeForm(input) {
  return {
    title: input.title.trim(),
    description: input.description,
    fields: input.fields.map((field) => ({
      ...field,
      id: field.id.trim(),
      label: field.label.trim(),
      options: normalizeOptions(field.options),
    })),
  };
}

export function validateFormInput(input) {
  const parsed = FormSchema.safeParse(input);
  if (!parsed.success)
    return {
      error: parsed.error.issues[0]?.message || "Проверьте данные формы",
    };
  const data = normalizeForm(parsed.data);
  const ids = new Set();
  for (const field of data.fields) {
    if (ids.has(field.id))
      return { error: "У каждого поля должен быть уникальный ID" };
    ids.add(field.id);
    if (OPTION_TYPES.has(field.type) && !field.options.length)
      return { error: `Добавьте варианты для поля «${field.label}»` };
  }
  return { data };
}

export function normalizeSessionId(value) {
  const parsed = SessionIdSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function validateAnswers(form, answers) {
  const fields = {};
  const parsed = AnswersSchema.safeParse(answers);
  if (!parsed.success) {
    fields._form = "Ответы должны содержать текстовые значения";
    return fields;
  }
  const values = parsed.data;
  const known = new Set(form.fields.map((field) => field.id));
  for (const key of Object.keys(values)) {
    if (!known.has(key)) fields[key] = "Неизвестное поле";
  }
  for (const field of form.fields) {
    const value = values[field.id];
    const empty =
      value === undefined ||
      value === "" ||
      (Array.isArray(value) && value.length === 0);
    if (field.required && empty) {
      fields[field.id] = "Заполните это поле";
      continue;
    }
    if (empty) continue;
    const invalid = (message) => {
      fields[field.id] = message;
    };
    if (field.type === "checkbox") {
      if (
        !Array.isArray(value) ||
        value.some((entry) => !field.options.includes(entry))
      )
        invalid("Выберите допустимые варианты");
      continue;
    }
    if (typeof value !== "string") {
      invalid("Введите текстовое значение");
      continue;
    }
    if (
      ["radio", "select"].includes(field.type) &&
      !field.options.includes(value)
    )
      invalid("Выберите допустимый вариант");
    if (field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
      invalid("Введите корректный email");
    if (field.type === "phone" && !/^\+?[\d\s().-]{7,20}$/.test(value))
      invalid("Введите корректный номер телефона");
    if (field.type === "url") {
      try {
        const url = new URL(value);
        if (!["http:", "https:"].includes(url.protocol))
          invalid("Введите корректную ссылку");
      } catch {
        invalid("Введите корректную ссылку");
      }
    }
    if (field.type === "number" && !Number.isFinite(Number(value)))
      invalid("Введите число");
    if (field.type === "date") {
      const date = new Date(`${value}T00:00:00Z`);
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
        Number.isNaN(date.getTime()) ||
        date.toISOString().slice(0, 10) !== value
      )
        invalid("Введите корректную дату");
    }
    if (value.length > 10000) invalid("Ответ слишком длинный");
  }
  return fields;
}
