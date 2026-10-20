import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description?: ReactNode;
  icon?: ReactNode;
  className?: string;
  children?: ReactNode;
};

export function EmptyState({
  title,
  description,
  icon,
  className,
  children,
}: EmptyStateProps) {
  return (
    <div className={`empty-card${className ? ` ${className}` : ""}`}>
      {icon && <div className="empty-symbol">{icon}</div>}
      <h2>{title}</h2>
      {description && <p>{description}</p>}
      {children}
    </div>
  );
}
