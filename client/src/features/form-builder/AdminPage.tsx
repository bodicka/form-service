import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import * as Checkbox from "@radix-ui/react-checkbox";
import * as Dialog from "@radix-ui/react-dialog";
import * as Select from "@radix-ui/react-select";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUpRight,
  Check,
  ChevronDown,
  Copy,
  GripVertical,
  Plus,
  Save,
  Send,
  Trash2,
  X,
} from "lucide-react";
import {
  api,
  ApiError,
  save,
  update,
  type FieldType,
  type Form,
  type FormField,
} from "../../shared/api";
import { useBuilderStore } from "./builderStore";
import { useAuthStore } from "../auth/authStore";

const types: { value: FieldType; label: string }[] = [
  { value: "text", label: "Короткий текст" },
  { value: "textarea", label: "Длинный текст" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Телефон" },
  { value: "number", label: "Число" },
  { value: "radio", label: "Один вариант" },
  { value: "select", label: "Выпадающий список" },
  { value: "checkbox", label: "Несколько вариантов" },
  { value: "date", label: "Дата" },
  { value: "url", label: "Ссылка" },
];
const createField = (type: FieldType = "text"): FormField => ({
  id: crypto.randomUUID(),
  type,
  label: "Новый вопрос",
  description: "",
  placeholder: "",
  required: false,
  options: ["Вариант 1", "Вариант 2"],
});

function Login() {
  const setToken = useAuthStore((state) => state.setToken);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await api<{ token: string }>("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({ password }),
      });
      setToken(result.token);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось войти");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="login-wrap">
      <form className="login-card" onSubmit={submit}>
        <div className="brand-mark">f.</div>
        <p className="eyebrow">ПРОСТЫЕ ФОРМЫ · ЧЕСТНАЯ АНАЛИТИКА</p>
        <h1>Войти в рабочее пространство</h1>
        <p className="muted">
          Введите пароль менеджера, чтобы управлять формами и ответами.
        </p>
        <label className="label" htmlFor="password">
          Пароль
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Пароль администратора"
          autoFocus
        />
        <button className="button primary full" disabled={busy}>
          {busy ? "Входим…" : "Войти"}
          <ArrowDown size={16} />
        </button>
        {error && <div className="error-box">{error}</div>}
        <div className="login-hint">
          Пароль по умолчанию: <code>admin</code>
        </div>
      </form>
    </main>
  );
}

export function AdminGate({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((state) => state.token);
  return token ? children : <Login />;
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const logout = useAuthStore((state) => state.logout);
  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="wordmark" to="/admin">
          <span className="brand-mark small">f.</span>
          <span>форма</span>
        </Link>
        <div className="top-actions">
          <span className="avatar">М</span>
          <button className="text-button" onClick={logout}>
            Выйти
          </button>
        </div>
      </header>
      {children}
    </div>
  );
}

export function FormsList() {
  const [forms, setForms] = useState<Form[]>([]);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");
  const navigate = useNavigate();
  async function load() {
    try {
      setForms(await api<Form[]>("/api/admin/forms"));
      setError("");
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Не удалось загрузить формы",
      );
    }
  }
  useEffect(() => {
    void load();
  }, []);
  async function create() {
    try {
      const form = await save({
        title: "Новая форма",
        description: "",
        fields: [],
      });
      navigate(`/admin/forms/${form.id}`);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Не удалось создать форму",
      );
    }
  }
  async function copy(slug: string) {
    await navigator.clipboard.writeText(`${window.location.origin}/f/${slug}`);
    setCopied(slug);
    window.setTimeout(() => setCopied(""), 1800);
  }
  return (
    <main className="page-wrap">
      <div className="page-heading">
        <div>
          <p className="eyebrow">РАБОЧЕЕ ПРОСТРАНСТВО</p>
          <h1>Ваши формы</h1>
          <p className="muted">
            Собирайте отклики и находите, где теряется интерес.
          </p>
        </div>
        <button className="button primary" onClick={() => void create()}>
          <Plus size={17} />
          Создать форму
        </button>
      </div>
      {error && <div className="error-box">{error}</div>}
      <div className="forms-toolbar">
        <span className="section-label">
          ВСЕ ФОРМЫ <b>{forms.length}</b>
        </span>
        <span className="muted small-text">Обновлено только что</span>
      </div>
      {forms.length ? (
        <div className="form-list">
          {forms.map((form) => (
            <article className="form-row" key={form.id}>
              <div className="form-icon">
                <span>✳</span>
              </div>
              <div className="form-main">
                <Link to={`/admin/forms/${form.id}`} className="form-title">
                  {form.title}
                </Link>
                <div className="form-meta">
                  <span className={`status-pill ${form.status}`}>
                    {form.status === "published" ? "Опубликована" : "Черновик"}
                  </span>
                  <span>·</span>
                  <span>{form.responseCount || 0} ответов</span>
                  <span>·</span>
                  <span>
                    {new Date(
                      form.updatedAt || form.createdAt || Date.now(),
                    ).toLocaleDateString("ru-RU")}
                  </span>
                </div>
              </div>
              <div className="form-actions">
                <Link
                  className="button subtle"
                  to={`/admin/forms/${form.id}/responses`}
                >
                  Ответы{" "}
                  <span className="count">{form.responseCount || 0}</span>
                </Link>
                <Link
                  className="icon-button"
                  title="Аналитика"
                  aria-label="Аналитика"
                  to={`/admin/forms/${form.id}/analytics`}
                >
                  <ArrowUpRight size={17} />
                </Link>
                {form.status === "published" && form.slug && (
                  <button
                    className="icon-button"
                    title="Копировать ссылку"
                    aria-label="Копировать ссылку"
                    onClick={() => void copy(form.slug!)}
                  >
                    {copied === form.slug ? (
                      <Check size={17} />
                    ) : (
                      <Copy size={16} />
                    )}
                  </button>
                )}
                <Link className="button outline" to={`/admin/forms/${form.id}`}>
                  Редактировать
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        !error && (
          <div className="empty-card">
            <div className="empty-symbol">✳</div>
            <h2>Пока нет форм</h2>
            <p>Создайте первую форму и поделитесь ссылкой со студентами.</p>
            <button className="button primary" onClick={() => void create()}>
              <Plus size={16} />
              Создать форму
            </button>
          </div>
        )
      )}
    </main>
  );
}

function FieldCard({
  field,
  index,
  count,
  onChange,
  onDelete,
  onDuplicate,
  onMove,
}: {
  field: FormField;
  index: number;
  count: number;
  onChange: (field: FormField) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMove: (direction: number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.55 : 1,
  };
  const hasOptions = ["radio", "select", "checkbox"].includes(field.type);
  return (
    <section className="field-card" ref={setNodeRef} style={style}>
      <div className="field-top">
        <button
          className="drag-handle"
          aria-label="Перетащить поле"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={18} />
        </button>
        <span className="field-number">
          Вопрос {String(index + 1).padStart(2, "0")}
        </span>
        <div className="field-tools">
          <button
            className="icon-button tiny"
            title="Дублировать"
            onClick={onDuplicate}
          >
            <Copy size={14} />
          </button>
          <button
            className="icon-button tiny danger"
            title="Удалить"
            onClick={onDelete}
          >
            <Trash2 size={15} />
          </button>
          <button
            className="icon-button tiny"
            title="Выше"
            disabled={index === 0}
            onClick={() => onMove(-1)}
          >
            <ArrowUpRight className="rotate-up" size={14} />
          </button>
          <button
            className="icon-button tiny"
            title="Ниже"
            disabled={index === count - 1}
            onClick={() => onMove(1)}
          >
            <ArrowDown size={14} />
          </button>
        </div>
      </div>
      <div className="field-form-grid">
        <label className="label">
          Название вопроса
          <input
            value={field.label}
            onChange={(event) =>
              onChange({ ...field, label: event.target.value })
            }
          />
        </label>
        <label className="label">
          Тип поля
          <Select.Root
            value={field.type}
            onValueChange={(value) =>
              onChange({ ...field, type: value as FieldType })
            }
          >
            <Select.Trigger className="select-trigger">
              <Select.Value />
              <Select.Icon>
                <ChevronDown size={15} />
              </Select.Icon>
            </Select.Trigger>
            <Select.Portal>
              <Select.Content className="select-content" position="popper">
                <Select.Viewport>
                  {types.map((item) => (
                    <Select.Item
                      className="select-item"
                      value={item.value}
                      key={item.value}
                    >
                      <Select.ItemText>{item.label}</Select.ItemText>
                    </Select.Item>
                  ))}
                </Select.Viewport>
              </Select.Content>
            </Select.Portal>
          </Select.Root>
        </label>
      </div>
      <div className="field-form-grid secondary-grid">
        <label className="label">
          Подсказка
          <textarea
            rows={2}
            value={field.description}
            onChange={(event) =>
              onChange({ ...field, description: event.target.value })
            }
            placeholder="Необязательное пояснение к вопросу"
          />
        </label>
        <label className="label">
          Текст в поле
          <input
            value={field.placeholder}
            onChange={(event) =>
              onChange({ ...field, placeholder: event.target.value })
            }
            placeholder="Например, ваш ответ"
          />
        </label>
      </div>
      {hasOptions && (
        <label className="label options-label">
          Варианты ответа
          <textarea
            rows={3}
            value={field.options.join("\n")}
            onChange={(event) =>
              onChange({ ...field, options: event.target.value.split("\n") })
            }
            placeholder="Каждый вариант — с новой строки"
          />
        </label>
      )}
      <label className="required-toggle">
        <Checkbox.Root
          className="checkbox"
          checked={field.required}
          onCheckedChange={(checked) =>
            onChange({ ...field, required: checked === true })
          }
        >
          <Checkbox.Indicator>
            <Check size={13} />
          </Checkbox.Indicator>
        </Checkbox.Root>
        <span>Обязательный вопрос</span>
        <span className="required-note">
          Студент не сможет отправить форму без ответа
        </span>
      </label>
    </section>
  );
}

function Preview({
  title,
  description,
  fields,
}: {
  title: string;
  description: string;
  fields: FormField[];
}) {
  return (
    <div className="preview-outer">
      <div className="preview-label">
        <span className="live-dot" />
        ПРЕДПРОСМОТР
      </div>
      <div className="preview-card">
        <div className="preview-brand">ФОРМА · ОТКЛИК</div>
        <h2>{title || "Название формы"}</h2>
        {description && <p>{description}</p>}
        {fields.length ? (
          fields.map((field) => (
            <div className="preview-field" key={field.id}>
              <label>
                {field.label}
                {field.required && <i>*</i>}
              </label>
              {field.description && <small>{field.description}</small>}
              {["radio", "checkbox"].includes(field.type) ? (
                field.options.filter(Boolean).map((option) => (
                  <div className="preview-choice" key={option}>
                    <span />
                    {option}
                  </div>
                ))
              ) : field.type === "textarea" ? (
                <div className="preview-textarea">
                  {field.placeholder || "Ваш ответ"}
                </div>
              ) : field.type === "select" ? (
                <div className="preview-input">
                  {field.placeholder || "Выберите вариант"}　⌄
                </div>
              ) : (
                <div className="preview-input">
                  {field.placeholder || "Ваш ответ"}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="preview-empty">
            Добавьте вопросы, чтобы увидеть форму.
          </div>
        )}
        <div className="preview-submit">Отправить отклик →</div>
        <div className="preview-foot">
          Ваши ответы сохраняются автоматически
        </div>
      </div>
      <p className="preview-caption">Так форму увидят студенты</p>
    </div>
  );
}

export function FormEditor() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const title = useBuilderStore((state) => state.title);
  const setTitle = useBuilderStore((state) => state.setTitle);
  const description = useBuilderStore((state) => state.description);
  const setDescription = useBuilderStore((state) => state.setDescription);
  const fields = useBuilderStore((state) => state.fields);
  const setFields = useBuilderStore((state) => state.setFields);
  const [form, setForm] = useState<Form | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    let active = true;
    api<Form>(`/api/admin/forms/${id}`)
      .then((loaded) => {
        if (!active) return;
        setForm(loaded);
        setTitle(loaded.title);
        setDescription(loaded.description);
        setFields(loaded.fields);
      })
      .catch((caught: unknown) => {
        if (active)
          setError(
            caught instanceof Error ? caught.message : "Форма не найдена",
          );
      });
    return () => {
      active = false;
    };
  }, [id, setDescription, setFields, setTitle]);

  function move(index: number, direction: number) {
    const next = [...fields];
    const target = index + direction;
    if (target >= 0 && target < next.length) {
      [next[index], next[target]] = [next[target], next[index]];
      setFields(next);
    }
  }
  async function persist(publish = false) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const payload = { title: title.trim(), description, fields };
      const saved = form ? await update(form.id, payload) : await save(payload);
      let result = saved;
      if (publish)
        result = await api<Form>(`/api/admin/forms/${saved.id}/publish`, {
          method: "POST",
        });
      setForm(result);
      setTitle(result.title);
      setDescription(result.description);
      setFields(result.fields);
      setNotice(
        publish
          ? `Опубликовано: ${window.location.origin}/f/${result.slug}`
          : "Изменения сохранены",
      );
      if (!form) navigate(`/admin/forms/${result.id}`, { replace: true });
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : caught instanceof Error
            ? caught.message
            : "Не удалось сохранить форму",
      );
    } finally {
      setBusy(false);
    }
  }
  async function copyLink() {
    if (!form?.slug) return;
    await navigator.clipboard.writeText(
      `${window.location.origin}/f/${form.slug}`,
    );
    setNotice("Ссылка скопирована");
  }
  async function remove() {
    try {
      await api(`/api/admin/forms/${id}`, { method: "DELETE" });
      navigate("/admin");
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Не удалось удалить форму",
      );
    }
  }
  function onDragEnd(event: DragEndEvent) {
    if (!event.over || event.active.id === event.over.id) return;
    const oldIndex = fields.findIndex((field) => field.id === event.active.id);
    const newIndex = fields.findIndex((field) => field.id === event.over?.id);
    setFields(arrayMove(fields, oldIndex, newIndex));
  }
  if (error && !form)
    return (
      <main className="page-wrap">
        <Link to="/admin" className="back-link">
          <ArrowLeft size={16} />
          Все формы
        </Link>
        <div className="error-box">{error}</div>
      </main>
    );
  if (!form)
    return <main className="page-wrap loading">Загружаем конструктор…</main>;
  return (
    <main className="page-wrap editor-page">
      <Link to="/admin" className="back-link">
        <ArrowLeft size={16} />
        Все формы
      </Link>
      <div className="editor-heading">
        <div>
          <p className="eyebrow">КОНСТРУКТОР ФОРМЫ</p>
          <h1>Редактирование</h1>
        </div>
        <div className="editor-actions">
          <button
            className="button outline"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 size={15} />
            Удалить
          </button>
          <button
            className="button subtle"
            onClick={() => void persist()}
            disabled={busy}
          >
            <Save size={15} />
            Сохранить
          </button>
          <button
            className="button primary"
            onClick={() => void persist(form.status !== "published")}
            disabled={busy}
          >
            <Send size={15} />
            {busy
              ? "Сохраняем…"
              : form.status === "published"
                ? "Сохранить"
                : "Опубликовать"}
          </button>
        </div>
      </div>
      {(notice || error) && (
        <div className={error ? "error-box" : "success-box"}>
          {error || (
            <>
              {notice}
              {form.status === "published" && form.slug && (
                <button className="inline-copy" onClick={() => void copyLink()}>
                  <Copy size={14} />
                  Копировать ссылку
                </button>
              )}
            </>
          )}
        </div>
      )}
      <nav className="subnav">
        <Link className="active" to={`/admin/forms/${id}`}>
          Конструктор
        </Link>
        <Link to={`/admin/forms/${id}/responses`}>Ответы</Link>
        <Link to={`/admin/forms/${id}/analytics`}>Аналитика</Link>
        {form.status === "published" && (
          <span className="status-pill published">Опубликована</span>
        )}
      </nav>
      <div className="editor-layout">
        <section className="builder-column">
          <div className="builder-card">
            <div className="builder-card-head">
              <div>
                <span className="step-mark">01</span>
                <h2>О форме</h2>
              </div>
              <span className="muted small-text">Основная информация</span>
            </div>
            <label className="label">
              Название формы
              <input
                className="title-input"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Например, отклик на стажировку"
              />
            </label>
            <label className="label description-input">
              Описание
              <textarea
                rows={3}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Расскажите студентам о возможности и о том, что важно указать"
              />
            </label>
          </div>
          <div className="builder-section-head">
            <div>
              <span className="step-mark">02</span>
              <h2>Вопросы</h2>
              <span className="count">{fields.length}</span>
            </div>
            <span className="muted small-text">
              Перетаскивайте, чтобы изменить порядок
            </span>
          </div>
          <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext
              items={fields.map((field) => field.id)}
              strategy={verticalListSortingStrategy}
            >
              {fields.map((field, index) => (
                <FieldCard
                  key={field.id}
                  field={field}
                  index={index}
                  count={fields.length}
                  onChange={(next) =>
                    setFields(
                      fields.map((item) =>
                        item.id === field.id ? next : item,
                      ),
                    )
                  }
                  onDelete={() =>
                    setFields(fields.filter((item) => item.id !== field.id))
                  }
                  onDuplicate={() =>
                    setFields([
                      ...fields.slice(0, index + 1),
                      {
                        ...field,
                        id: crypto.randomUUID(),
                        label: `${field.label} (копия)`,
                      },
                      ...fields.slice(index + 1),
                    ])
                  }
                  onMove={(direction) => move(index, direction)}
                />
              ))}
            </SortableContext>
          </DndContext>
          <button
            className="add-field"
            onClick={() => setFields([...fields, createField()])}
          >
            <span>
              <Plus size={18} />
            </span>
            <div>
              <b>Добавить вопрос</b>
              <small>Короткий текст, выбор, дата и другое</small>
            </div>
            <Plus className="add-end" size={18} />
          </button>
          <div className="builder-bottom">
            <span className="muted small-text">
              Изменения пока не опубликованы автоматически.
            </span>
            <button
              className="button primary"
              onClick={() => void persist()}
              disabled={busy}
            >
              <Save size={15} />
              Сохранить
            </button>
          </div>
        </section>
        <aside className="preview-column">
          <Preview title={title} description={description} fields={fields} />
        </aside>
      </div>
      <Dialog.Root open={confirmDelete} onOpenChange={setConfirmDelete}>
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay" />
          <Dialog.Content className="dialog-card">
            <Dialog.Close className="dialog-close" aria-label="Закрыть">
              <X size={18} />
            </Dialog.Close>
            <div className="dialog-icon">
              <Trash2 size={20} />
            </div>
            <Dialog.Title>Удалить форму?</Dialog.Title>
            <Dialog.Description>
              Форма и все собранные ответы будут удалены без возможности
              восстановления.
            </Dialog.Description>
            <div className="dialog-actions">
              <Dialog.Close className="button outline">Отмена</Dialog.Close>
              <button
                className="button danger-button"
                onClick={() => void remove()}
              >
                Удалить форму
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </main>
  );
}
