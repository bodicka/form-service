import { LoaderCircle } from "lucide-react";

type LoadingSpinnerProps = {
  label?: string;
  className?: string;
  size?: number;
};

export function LoadingSpinner({
  label = "Загружаем…",
  className,
  size = 24,
}: LoadingSpinnerProps) {
  return (
    <div
      className={`student-loading${className ? ` ${className}` : ""}`}
      role="status"
      aria-live="polite"
    >
      <LoaderCircle className="spin" size={size} />
      {label}
    </div>
  );
}
