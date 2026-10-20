import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import {
  AdminGate,
  AdminShell,
  FormEditor,
  FormsList,
} from "./features/form-builder/AdminPage";
import FillPage from "./features/form-fill/FillPage";
import ResponsesPage, {
  AnalyticsPage,
} from "./features/responses/ResponsesPage";
import styles from "./App.module.css";

export default function App() {
  return (
    <BrowserRouter>
      <div className={styles.application}>
        <Routes>
          <Route path="/f/:slug" element={<FillPage />} />
          <Route
            path="/admin"
            element={
              <AdminGate>
                <AdminShell>
                  <FormsList />
                </AdminShell>
              </AdminGate>
            }
          />
          <Route
            path="/admin/forms/:id"
            element={
              <AdminGate>
                <AdminShell>
                  <FormEditor />
                </AdminShell>
              </AdminGate>
            }
          />
          <Route
            path="/admin/forms/:id/responses"
            element={
              <AdminGate>
                <AdminShell>
                  <ResponsesPage />
                </AdminShell>
              </AdminGate>
            }
          />
          <Route
            path="/admin/forms/:id/analytics"
            element={
              <AdminGate>
                <AdminShell>
                  <AnalyticsPage />
                </AdminShell>
              </AdminGate>
            }
          />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
