import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { api, type Analytics, type Form } from "../../shared/api";
import { ErrorBox } from "../../shared/components/ErrorBox";
import { useAsyncData } from "../../shared/hooks/useAsyncData";

type AnalyticsData = {
  form: Form;
  analytics: Analytics;
};

export function AnalyticsPage() {
  const { id = "" } = useParams();
  const { data, error } = useAsyncData<AnalyticsData>(
    () =>
      Promise.all([
        api<Form>(`/api/admin/forms/${id}`),
        api<Analytics>(`/api/admin/forms/${id}/analytics`),
      ]).then(([form, analytics]) => ({ form, analytics })),
    [id],
    "Не удалось загрузить аналитику",
  );
  const form = data?.form ?? null;
  const analytics = data?.analytics ?? null;

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
      {error && <ErrorBox>{error}</ErrorBox>}
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
