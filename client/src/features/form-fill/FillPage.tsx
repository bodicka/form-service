import { useParams } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import type { FormField } from "../../shared/api";
import { ErrorBox } from "../../shared/components/ErrorBox";
import { LoadingSpinner } from "../../shared/components/LoadingSpinner";
import { useFormFill } from "./hooks/useFormFill";

export default function FillPage() {
  const { slug = "" } = useParams();
  const {
    form,
    loading,
    error,
    submitted,
    busy,
    answers,
    restored,
    completed,
    requiredFields,
    progress,
    setValue,
    focusField,
    blurField,
    fieldError,
    submit,
  } = useFormFill(slug);

  function control(field: FormField) {
    const value = answers[field.id];
    const textValue = typeof value === "string" ? value : "";
    const errorMessage = fieldError(field);
    const common = {
      id: field.id,
      name: field.id,
      placeholder: field.placeholder,
      "aria-invalid": Boolean(errorMessage),
      "aria-describedby": `${field.id}-help${errorMessage ? ` ${field.id}-error` : ""}`,
      onFocus: () => focusField(field),
      onBlur: () => blurField(field),
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

  if (loading)
    return (
      <main className="student-page">
        <LoadingSpinner label="Загружаем форму…" />
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
            {error && <ErrorBox>{error}</ErrorBox>}
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
