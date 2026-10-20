import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Download, Inbox } from "lucide-react";
import { api, download, type Form, type FormResponse } from "../../shared/api";
import { EmptyState } from "../../shared/components/EmptyState";
import { ErrorBox } from "../../shared/components/ErrorBox";
import { LoadingSpinner } from "../../shared/components/LoadingSpinner";
import { useAsyncData } from "../../shared/hooks/useAsyncData";
import { formatDateTime } from "../../shared/utils/formatDate";

type ResponsesData = {
  form: Form;
  responses: FormResponse[];
};

export default function ResponsesPage() {
  const { id = "" } = useParams();
  const {
    data,
    error: loadError,
    loading,
  } = useAsyncData<ResponsesData>(
    () =>
      Promise.all([
        api<Form>(`/api/admin/forms/${id}`),
        api<FormResponse[]>(`/api/admin/forms/${id}/responses`),
      ]).then(([form, responses]) => ({ form, responses })),
    [id],
    "Не удалось загрузить ответы",
  );
  const [exportError, setExportError] = useState("");
  const [downloading, setDownloading] = useState(false);
  const form = data?.form ?? null;
  const responses = data?.responses ?? [];
  const error = exportError || loadError;

  async function exportCsv() {
    setDownloading(true);
    setExportError("");
    try {
      await download(
        `/api/admin/forms/${id}/responses.csv`,
        `responses-${id}.csv`,
      );
    } catch (caught) {
      setExportError(
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
      {error && <ErrorBox>{error}</ErrorBox>}
      {loading ? (
        <LoadingSpinner label="Загружаем ответы…" />
      ) : !responses.length && !error ? (
        <EmptyState
          className="compact-empty"
          icon={<Inbox size={25} />}
          title="Ответов пока нет"
          description="После отправки формы ответы появятся здесь."
        />
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
                      {formatDateTime(response.submittedAt)}
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
