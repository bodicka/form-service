import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import api from "./routes.js";
import { initializeStore } from "./storage.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
await initializeStore();

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api", api);
app.use("/api", (_req, res) =>
  res
    .status(404)
    .json({ error: { code: "NOT_FOUND", message: "API-маршрут не найден" } }),
);
app.use(express.static(path.join(root, "client", "dist")));
app.get("/{*path}", (_req, res) =>
  res.sendFile(path.join(root, "client", "dist", "index.html")),
);
app.use((error, _req, res, _next) => {
  console.error(error);
  const status =
    Number.isInteger(error.status) && error.status >= 400 && error.status < 500
      ? error.status
      : 500;
  const code = status === 400 ? "INVALID_JSON" : "INTERNAL_ERROR";
  const message =
    status === 400
      ? "Проверьте формат JSON-запроса"
      : "Внутренняя ошибка сервера";
  res.status(status).json({ error: { code, message } });
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () =>
  console.log(`Сервис форм доступен: http://localhost:${port}`),
);
