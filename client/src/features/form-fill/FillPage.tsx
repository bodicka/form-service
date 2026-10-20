import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { ArrowRight, Check, LoaderCircle } from "lucide-react";
import { api, ApiError, type Form, type FormField } from "../../shared/api";
import { useFillStore } from "./fillStore";

function sessionId() {
  const key = "form-service-session";
  let value = localStorage.getItem(key);
  if (!value) {
    value = crypto.randomUUID();
    localStorage.setItem(key, value);
  }
  return value;
}

function nonempty(value: string | string[] | undefined) {
  return Array.isArray(value) ? value.length > 0 : Boolean(value?.trim());
}

function validate(field: FormField, value: string | string[]) {
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

export default function FillPage() {
  const { slug = "" } = useParams();
  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [restored, setRestored] = useState(false);
  const started = useRef(false);
  const drafts = useFillStore((state) => state.drafts);
  const setAnswer = useFillStore((state) => state.setAnswer);
  const clearDraft = useFillStore((state) => state.clearDraft);
  const answers = drafts[slug] || {};
  const requiredFields = form?.fields.filter((field) => field.required) || [];
  const completed = requiredFields.filter((field) =>
    nonempty(answers[field.id]),
  ).length;
  const progress = requiredFields.length
    ? Math.round((completed / requiredFields.length) * 100)
    : 100;
  useEffect(() => {
    let active = true;
    started.current = false;
    setRestored(
      Object.keys(useFillStore.getState().drafts[slug] || {}).length > 0,
    );
    setLoading(true);
    setError("");
    setForm(null);
    setSubmitted(false);
    setServerErrors({});
    setTouched({});
    api<Form>(`/api/public/forms/${encodeURIComponent(slug)}`)
      .then((data) => {
        if (!active) return;
        setForm(data);
        void track("view");
      })
      .catch((caught: unknown) => {
        if (!active) return;
        if (caught instanceof ApiError && caught.code === "FORM_CLOSED")
          setError("Эта форма больше не принимает ответы.");
        else if (caught instanceof ApiError && caught.code === "FORM_NOT_FOUND")
          setError("Похоже, такой формы не существует.");
        else
          setError(
            caught instanceof Error
              ? caught.message
              : "Не удалось загрузить форму",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [slug]);

  function track(
    type: "view" | "start" | "field_focus" | "field_complete" | "submit",
    fieldId?: string,
  ) {
    return api(`/api/public/forms/${encodeURIComponent(slug)}/events`, {
      method: "POST",
      body: JSON.stringify({
        type,
        sessionId: sessionId(),
        ...(fieldId ? { fieldId } : {}),
      }),
    }).catch((caught: unknown) => {
      console.warn("Analytics event was not recorded", caught);
    });
  }
  function interact() {
    if (!started.current) {
      started.current = true;
      void track("start");
    }
  }
  function setValue(field: FormField, value: string | string[]) {
    interact();
    setAnswer(slug, field.id, value);
    setServerErrors((current) => ({ ...current, [field.id]: "" }));
  }
  function control(field: FormField) {
    const value = answers[field.id];
    const textValue = typeof value === "string" ? value : "";
    const errorMessage =
      serverErrors[field.id] ||
      (touched[field.id] ? validate(field, value || "") : "");
    const common = {
      id: field.id,
      name: field.id,
      placeholder: field.placeholder,
      "aria-invalid": Boolean(errorMessage),
      "aria-describedby": `${field.id}-help${errorMessage ? ` ${field.id}-error` : ""}`,
      onFocus: () => {
        interact();
        void track("field_focus", field.id);
      },
      onBlur: () => {
        setTouched((current) => ({ ...current, [field.id]: true }));
        if (
          nonempty(answers[field.id]) &&
          !validate(field, answers[field.id] || "")
        )
          void track("field_complete", field.id);
      },
    } as const;
    let input;
    if (field.type === "textarea") {
      input = (
        <textarea
          {...common}
          rows={4}
          value={textValue}
          onChange={(event) => setValue(field, event.target.value)}
        />
      );
    } else if (field.type === "radio") {
      input = (
        <div
          className="student-options radio-options"
          role="radiogroup"
          aria-labelledby={`${field.id}-label`}
          aria-describedby={`${field.id}-help${errorMessage ? ` ${field.id}-error` : ""}`}
          aria-invalid={Boolean(errorMessage)}
        >
          {field.options.filter(Boolean).map((option) => (
            <label className="student-option" key={option}>
              <input
                id={`${field.id}-${option}`}
                type="radio"
                name={field.id}
                checked={textValue === option}
                onFocus={common.onFocus}
                onBlur={common.onBlur}
                onChange={() => setValue(field, option)}
              />
              <span className="custom-radio" />
              {option}
            </label>
          ))}
        </div>
      );
    } else if (field.type === "select") {
      input = (
        <select
          {...common}
          value={textValue}
          required={field.required}
          onChange={(event) => setValue(field, event.target.value)}
        >
          <option value="">{field.placeholder || "Выберите вариант"}</option>
          {field.options.filter(Boolean).map((option) => (
            <option value={option} key={option}>
              {option}
            </option>
          ))}
        </select>
      );
    } else if (field.type === "checkbox") {
      const selected = Array.isArray(value) ? value : [];
      input = (
        <div
          className="student-options"
          role="group"
          aria-labelledby={`${field.id}-label`}
          aria-describedby={`${field.id}-help${errorMessage ? ` ${field.id}-error` : ""}`}
          aria-invalid={Boolean(errorMessage)}
        >
          {field.options.filter(Boolean).map((option) => (
            <label className="student-option" key={option}>
              <input
                id={`${field.id}-${option}`}
                type="checkbox"
                checked={selected.includes(option)}
                onFocus={common.onFocus}
                onBlur={common.onBlur}
                onChange={(event) =>
                  setValue(
                    field,
                    event.target.checked
                      ? [...selected, option]
                      : selected.filter((item) => item !== option),
                  )
                }
              />
              <span className="custom-check">
                <Check size={13} />
              </span>
              {option}
            </label>
          ))}
        </div>
      );
    } else {
      const inputType =
        field.type === "email" ||
        field.type === "number" ||
        field.type === "date" ||
        field.type === "url"
          ? field.type
          : field.type === "phone"
            ? "tel"
            : "text";
      input = (
        <input
          {...common}
          type={inputType}
          value={textValue}
          onChange={(event) => setValue(field, event.target.value)}
          required={field.required}
        />
      );
    }
    return (
      <div
        className={`student-field ${errorMessage ? "has-error" : ""}`}
        key={field.id}
      >
        <label
          id={`${field.id}-label`}
          className="student-label"
          htmlFor={
            ["checkbox", "radio"].includes(field.type) ? undefined : field.id
          }
        >
          {field.label}
          {field.required && <span className="asterisk"> *</span>}
        </label>
        {field.description && (
          <p className="field-description" id={`${field.id}-help`}>
            {field.description}
          </p>
        )}
        {!field.description && (
          <span id={`${field.id}-help`} className="sr-only">
            {" "}
          </span>
        )}
        {input}
        {errorMessage && (
          <p className="field-error" id={`${field.id}-error`}>
            {errorMessage}
          </p>
        )}
      </div>
    );
  }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form) return;
    const nextErrors: Record<string, string> = {};
    setTouched(
      Object.fromEntries(form.fields.map((field) => [field.id, true])),
    );
    for (const field of form.fields) {
      const message = validate(field, answers[field.id] || "");
      if (message) nextErrors[field.id] = message;
    }
    setServerErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      document.getElementById(Object.keys(nextErrors)[0])?.focus();
      return;
    }
    setBusy(true);
    try {
      await api(`/api/public/forms/${encodeURIComponent(slug)}/responses`, {
        method: "POST",
        body: JSON.stringify({ answers, sessionId: sessionId() }),
      });
      void track("submit");
      clearDraft(slug);
      setSubmitted(true);
    } catch (caught) {
      if (caught instanceof ApiError && caught.fields)
        setServerErrors(caught.fields);
      else
        setError(
          caught instanceof Error
            ? caught.message
            : "Не удалось отправить форму",
        );
    } finally {
      setBusy(false);
    }
  }

  if (loading)
    return (
      <main className="student-page">
        <div className="student-loading">
          <LoaderCircle className="spin" size={24} />
          Загружаем форму…
        </div>
      </main>
    );
  if (error)
    return (
      <main className="student-page">
        <div className="student-status">
          <span className="status-emoji">⌁</span>
          <p className="eyebrow">ФОРМА НЕДОСТУПНА</p>
          <h1>{error}</h1>
          <p>
            Проверьте ссылку или попросите организатора прислать актуальную.
          </p>
        </div>
      </main>
    );
  if (submitted)
    return (
      <main className="student-page">
        <div className="student-status thanks">
          <span className="success-check">
            <Check size={25} />
          </span>
          <p className="eyebrow">ОТВЕТ ПРИНЯТ</p>
          <h1>Спасибо за отклик!</h1>
          <p>Ваши ответы уже у организатора. Желаем удачи!</p>
        </div>
      </main>
    );
  if (!form) return null;
  return (
    <main className="student-page">
      <div className="student-container">
        <header className="student-brand">
          <span className="brand-mark small">f.</span>
          <span>Форма отклика</span>
          <span className="secure-label">СОХРАНЯЕМ ОТВЕТЫ</span>
        </header>
        <div className="student-card">
          <div className="form-cover">
            <div className="cover-kicker">
              <span className="live-dot" />
              ПРИЁМ ОТКЛИКОВ
            </div>
            <h1>{form.title}</h1>
            {form.description && <p>{form.description}</p>}
            <div className="progress-head">
              <span>Прогресс заполнения</span>
              <b>
                {completed} из {requiredFields.length} обязательных
              </b>
            </div>
            <div className="progress-track">
              <div
                className="progress-value"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          {restored && (
            <div className="restored-note">
              <Check size={15} />
              Мы восстановили ваши ответы
            </div>
          )}
          <form
            className="student-form"
            onSubmit={(event) => void submit(event)}
            noValidate
          >
            <div className="fields-stack">{form.fields.map(control)}</div>
            {error && <div className="error-box">{error}</div>}
            <div className="submit-area">
              <button className="button primary submit-button" disabled={busy}>
                {busy ? "Отправляем…" : "Отправить отклик"}
                <ArrowRight size={17} />
              </button>
              <p>Черновик сохранится автоматически, если вы вернётесь позже.</p>
            </div>
          </form>
        </div>
        <footer className="student-footer">
          Сделано в <b>форме</b> <span>·</span> Ваши данные будут переданы
          организатору
        </footer>
      </div>
    </main>
  );
}
