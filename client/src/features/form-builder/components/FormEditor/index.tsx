import { useParams, Link } from "react-router-dom";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { ArrowLeft, Copy, Plus, Save, Send, Trash2 } from "lucide-react";
import { createField } from "../../constants/fieldTypes";
import { FieldCard } from "./FieldCard";
import { Preview } from "./Preview";
import { DeleteDialog } from "./DeleteDialog";
import { useFormEditor } from "../../hooks/useFormEditor";

export function FormEditor() {
  const { id = "" } = useParams();
  const {
    form,
    busy,
    notice,
    error,
    confirmDelete,
    setConfirmDelete,
    title,
    description,
    fields,
    setTitle,
    setDescription,
    setFields,
    move,
    persist,
    copyLink,
    remove,
    onDragEnd,
  } = useFormEditor(id);

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
      <DeleteDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        onConfirm={remove}
      />
    </main>
  );
}
