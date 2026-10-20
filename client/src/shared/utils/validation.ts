import type { FormField } from "../api";

export function nonempty(value: string | string[] | undefined): boolean {
  return Array.isArray(value) ? value.length > 0 : Boolean(value?.trim());
}

export function validateField(
  field: FormField,
  value: string | string[],
): string {
  if (!nonempty(value)) return field.required ? "Это обязательное поле" : "";
  if (typeof value !== "string") return "";
  if (field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
    return "Проверьте формат email";
  if (field.type === "phone" && !/^\+?[\d\s().-]{7,20}$/.test(value))
    return "Проверьте формат номера телефона";
  if (field.type === "url") {
    try {
      const url = new URL(value);
      if (!["http:", "https:"].includes(url.protocol))
        return "Введите ссылку, начинающуюся с http:// или https://";
    } catch {
      return "Введите корректную ссылку";
    }
  }
  if (field.type === "number" && !Number.isFinite(Number(value)))
    return "Введите число";
  if (field.type === "date") {
    const date = new Date(`${value}T00:00:00Z`);
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
      Number.isNaN(date.getTime()) ||
      date.toISOString().slice(0, 10) !== value
    )
      return "Введите корректную дату";
  }
  return "";
}
