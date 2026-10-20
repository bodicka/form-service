import type { ReactNode } from "react";

type ErrorBoxProps = {
  children: ReactNode;
  className?: string;
};

export function ErrorBox({ children, className }: ErrorBoxProps) {
  return (
    <div className={`error-box${className ? ` ${className}` : ""}`}>
      {children}
    </div>
  );
}
