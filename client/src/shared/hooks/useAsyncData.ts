import { useEffect, useState } from "react";

export function useAsyncData<T>(
  loader: () => Promise<T>,
  deps: readonly unknown[],
  fallbackError = "Не удалось загрузить данные",
) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    loader()
      .then((result) => {
        if (active) setData(result);
      })
      .catch((caught: unknown) => {
        if (active)
          setError(caught instanceof Error ? caught.message : fallbackError);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, deps);

  return { data, error, loading };
}
