export function formatDate(value: string | number | Date): string {
  return new Date(value).toLocaleDateString("ru-RU");
}

export function formatDateTime(value: string | number | Date): string {
  return new Date(value).toLocaleString("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
