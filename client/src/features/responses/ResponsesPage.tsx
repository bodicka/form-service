import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Download, Inbox } from "lucide-react";
import { api, download, type Form, type FormResponse } from "../../shared/api";

export default function ResponsesPage() {
  const { id = "" } = useParams();
  const [form, setForm] = useState<Form | null>(null);
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);
  useEffect(() => {
    let active = true;
    Promise.all([
      api<Form>(`/api/admin/forms/${id}`),
      api<FormResponse[]>(`/api/admin/forms/${id}/responses`),
    ])
      .then(([loadedForm, loadedResponses]) => {
        if (active) {
          setForm(loadedForm);
          setResponses(loadedResponses);
        }
      })
      .catch((caught: unknown) => {
        if (active)
          setError(
            caught instanceof Error
              ? caught.message
              : "Не удалось загрузить ответы",
          );
      });
    return () => {
      active = false;
    };
  }, [id]);
  async function exportCsv() {
    setDownloading(true);
    setError("");
    try {
      await download(
        `/api/admin/forms/${id}/responses.csv`,
        `responses-${id}.csv`,
      );
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Не удалось скачать CSV",
      );
    } finally {
      setDownloading(false);
    }
  }
  return (
    <main className="page-wrap">
      <Link to={`/admin/forms/${id}`} className="back-link">
        <ArrowLeft size={16} />
        Конструктор
      </Link>
      <div className="section-heading">
        <div>
          <p className="eyebrow">ОТКЛИКИ · {form?.title || "ФОРМА"}</p>
          <h1>
            Ответы <span className="heading-count">{responses.length}</span>
          </h1>
          <p className="muted">Ответы студентов в порядке поступления.</p>
        </div>
        <button
          className="button outline"
          onClick={() => void exportCsv()}
          disabled={!responses.length || downloading}
        >
          <Download size={16} />
          {downloading ? "Готовим CSV…" : "Экспорт CSV"}
        </button>
      </div>
      {error && <div className="error-box">{error}</div>}
      {!responses.length && !error ? (
        <div className="empty-card compact-empty">
          <div className="empty-symbol">
            <Inbox size={25} />
          </div>
          <h2>Ответов пока нет</h2>
          <p>После отправки формы ответы появятся здесь.</p>
        </div>
      ) : (
        form && (
          <div className="table-wrap">
            <table className="responses-table">
              <thead>
                <tr>
                  <th>№</th>
                  <th>Отправлено</th>
                  {form.fields.map((field) => (
                    <th key={field.id}>{field.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {responses.map((response, index) => (
                  <tr key={response.id}>
                    <td className="row-index">
                      {String(index + 1).padStart(2, "0")}
                    </td>
                    <td className="date-cell">
                      {new Date(response.submittedAt).toLocaleString("ru-RU", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </td>
                    {form.fields.map((field) => {
                      const value = response.answers[field.id];
                      return (
                        <td key={field.id}>
                          {Array.isArray(value)
                            ? value.join(", ")
                            : value || <span className="empty-value">—</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </main>
  );
}

export function AnalyticsPage() {
  const { id = "" } = useParams();
  const [form, setForm] = useState<Form | null>(null);
  const [analytics, setAnalytics] = useState<
    import("../../shared/api").Analytics | null
  >(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    Promise.all([
      api<Form>(`/api/admin/forms/${id}`),
      api<import("../../shared/api").Analytics>(
        `/api/admin/forms/${id}/analytics`,
      ),
    ])
      .then(([loadedForm, data]) => {
        if (active) {
          setForm(loadedForm);
          setAnalytics(data);
        }
      })
      .catch((caught: unknown) => {
        if (active)
          setError(
            caught instanceof Error
              ? caught.message
              : "Не удалось загрузить аналитику",
          );
      });
    return () => {
      active = false;
    };
  }, [id]);
  return (
    <main className="page-wrap">
      <Link to={`/admin/forms/${id}`} className="back-link">
        <ArrowLeft size={16} />
        Конструктор
      </Link>
      <div className="section-heading">
        <div>
          <p className="eyebrow">АНАЛИТИКА · {form?.title || "ФОРМА"}</p>
          <h1>Путь студента</h1>
          <p className="muted">Понимайте, где отклик перестаёт быть лёгким.</p>
        </div>
        <span className={`status-pill ${form?.status || "draft"}`}>
          {form?.status === "published"
            ? "Сбор ответов включён"
            : "Форма не опубликована"}
        </span>
      </div>
      {error && <div className="error-box">{error}</div>}
      {analytics && (
        <>
          <div className="funnel-grid">
            <div className="metric-card">
              <span>Открыли форму</span>
              <strong>{analytics.views}</strong>
              <small>Уникальные посетители</small>
            </div>
            <div className="metric-card">
              <span>Начали заполнять</span>
              <strong>{analytics.starts}</strong>
              <small>
                <b>{analytics.startRate}%</b> от просмотров
              </small>
            </div>
            <div className="metric-card featured-metric">
              <span>Отправили</span>
              <strong>{analytics.submissions}</strong>
              <small>
                <b>{analytics.conversion}%</b> конверсия из просмотра
              </small>
            </div>
          </div>
          <section className="analytics-card">
            <div className="analytics-heading">
              <div>
                <p className="eyebrow">МЕСТО ВОЗМОЖНОГО ОТВАЛА</p>
                <h2>На каком вопросе остановились</h2>
              </div>
              <span className="muted small-text">
                Последнее взаимодействие в незавершённых сессиях
              </span>
            </div>
            {analytics.fields.length ? (
              <div className="dropoff-list">
                {analytics.fields.map((field) => (
                  <div className="dropoff-row" key={field.id}>
                    <span className="dropoff-name">{field.label}</span>
                    <div className="dropoff-track">
                      <span style={{ width: `${field.dropoffPercent}%` }} />
                    </div>
                    <b>{field.abandoned}</b>
                  </div>
                ))}
              </div>
            ) : (
              <div className="inline-empty">
                Добавьте вопросы и поделитесь формой — здесь появятся первые
                данные.
              </div>
            )}
            <p className="analytics-note">
              Показатели анонимны и помогают улучшать форму, не отслеживая
              личности студентов.
            </p>
          </section>
          <div className="funnel-steps">
            <div>
              <span className="funnel-node">01</span>
              <div>
                <b>Открыли</b>
                <small>{analytics.views} уникальных сессий</small>
              </div>
            </div>
            <span className="funnel-line" />
            <div>
              <span className="funnel-node">02</span>
              <div>
                <b>Начали</b>
                <small>{analytics.starts} сессий</small>
              </div>
            </div>
            <span className="funnel-line" />
            <div>
              <span className="funnel-node success-node">03</span>
              <div>
                <b>Отправили</b>
                <small>{analytics.submissions} ответов</small>
              </div>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
