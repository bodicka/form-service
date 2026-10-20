import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { api, ApiError, type Form, type FormField } from "../../../shared/api";
import { getSessionId } from "../../../shared/utils/session";
import { nonempty, validateField } from "../../../shared/utils/validation";
import { useFillStore } from "../fillStore";

type TrackingType =
  | "view"
  | "start"
  | "field_focus"
  | "field_complete"
  | "submit";

export function useFormFill(slug: string) {
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
  const replaceDraft = useFillStore((state) => state.replaceDraft);
  const clearDraft = useFillStore((state) => state.clearDraft);
  const answers = drafts[slug] || {};
  const requiredFields = form?.fields.filter((field) => field.required) || [];
  const completed = requiredFields.filter((field) =>
    nonempty(answers[field.id]),
  ).length;
  const progress = requiredFields.length
    ? Math.round((completed / requiredFields.length) * 100)
    : 100;

  const track = useCallback(
    (type: TrackingType, fieldId?: string) => {
      return api(`/api/public/forms/${encodeURIComponent(slug)}/events`, {
        method: "POST",
        body: JSON.stringify({
          type,
          sessionId: getSessionId(),
          ...(fieldId ? { fieldId } : {}),
        }),
      }).catch((caught: unknown) => {
        console.warn("Analytics event was not recorded", caught);
      });
    },
    [slug],
  );

  const interact = useCallback(() => {
    if (!started.current) {
      started.current = true;
      void track("start");
    }
  }, [track]);

  useEffect(() => {
    let active = true;
    started.current = false;
    setRestored(false);
    setLoading(true);
    setError("");
    setForm(null);
    setSubmitted(false);
    setServerErrors({});
    setTouched({});
    api<Form>(`/api/public/forms/${encodeURIComponent(slug)}`)
      .then((data) => {
        if (!active) return;
        const currentDraft = useFillStore.getState().drafts[slug] || {};
        const fieldIds = new Set(data.fields.map((field) => field.id));
        const validAnswers = Object.fromEntries(
          Object.entries(currentDraft).filter(([fieldId]) =>
            fieldIds.has(fieldId),
          ),
        );
        if (
          Object.keys(validAnswers).length !== Object.keys(currentDraft).length
        )
          replaceDraft(slug, validAnswers);
        setRestored(Object.keys(validAnswers).length > 0);
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
  }, [slug, track, replaceDraft]);

  const setValue = useCallback(
    (field: FormField, value: string | string[]) => {
      interact();
      setAnswer(slug, field.id, value);
      setServerErrors((current) => ({ ...current, [field.id]: "" }));
    },
    [interact, setAnswer, slug],
  );

  const focusField = useCallback(
    (field: FormField) => {
      interact();
      void track("field_focus", field.id);
    },
    [interact, track],
  );

  const blurField = useCallback(
    (field: FormField) => {
      setTouched((current) => ({ ...current, [field.id]: true }));
      if (
        nonempty(answers[field.id]) &&
        !validateField(field, answers[field.id] || "")
      )
        void track("field_complete", field.id);
    },
    [answers, track],
  );

  const fieldError = useCallback(
    (field: FormField) => {
      const value = answers[field.id];
      return (
        serverErrors[field.id] ||
        (touched[field.id] ? validateField(field, value || "") : "")
      );
    },
    [answers, serverErrors, touched],
  );

  const focusFirstError = useCallback(
    (errors: Record<string, string>) => {
      const fieldId = Object.keys(errors).find(
        (key) =>
          key !== "_form" && form?.fields.some((field) => field.id === key),
      );
      if (!fieldId) return;
      const element =
        document.getElementById(fieldId) ??
        document.getElementsByName(fieldId)[0];
      element?.focus();
    },
    [form],
  );

  const submit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!form) return;
      const fieldIds = new Set(form.fields.map((field) => field.id));
      const cleanAnswers = Object.fromEntries(
        Object.entries(answers).filter(([fieldId]) => fieldIds.has(fieldId)),
      );
      if (
        Object.keys(cleanAnswers).length !== Object.keys(answers).length
      )
        replaceDraft(slug, cleanAnswers);
      const nextErrors: Record<string, string> = {};
      setTouched(
        Object.fromEntries(form.fields.map((field) => [field.id, true])),
      );
      for (const field of form.fields) {
        const message = validateField(field, cleanAnswers[field.id] || "");
        if (message) nextErrors[field.id] = message;
      }
      setServerErrors(nextErrors);
      if (Object.keys(nextErrors).length) {
        focusFirstError(nextErrors);
        return;
      }
      setBusy(true);
      try {
        await api(`/api/public/forms/${encodeURIComponent(slug)}/responses`, {
          method: "POST",
          body: JSON.stringify({
            answers: cleanAnswers,
            sessionId: getSessionId(),
          }),
        });
        void track("submit");
        clearDraft(slug);
        setSubmitted(true);
      } catch (caught) {
        if (caught instanceof ApiError && caught.fields) {
          setServerErrors(caught.fields);
          focusFirstError(caught.fields);
        } else
          setError(
            caught instanceof Error
              ? caught.message
              : "Не удалось отправить форму",
          );
      } finally {
        setBusy(false);
      }
    },
    [answers, clearDraft, focusFirstError, form, replaceDraft, slug, track],
  );

  return {
    form,
    loading,
    error,
    submitted,
    busy,
    answers,
    serverErrors,
    touched,
    restored,
    completed,
    requiredFields,
    progress,
    setValue,
    focusField,
    blurField,
    fieldError,
    submit,
  };
}
