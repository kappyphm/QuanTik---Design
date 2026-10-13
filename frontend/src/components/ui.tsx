"use client";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
export function PageHeading({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {children && <div className="heading-actions">{children}</div>}
    </div>
  );
}
export function Panel({
  title,
  action,
  children,
  className = "",
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel ${className}`}>
      <div className="panel-heading">
        <h2>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
export function Modal({
  title,
  onClose,
  children,
  className = "",
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const previous = document.activeElement;
    if (!el.open) el.showModal();
    return () => {
      if (el.open) el.close();
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`info-dialog ${className}`}
      aria-labelledby={titleId}
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          const bounds = event.currentTarget.getBoundingClientRect();
          if (
            event.clientX < bounds.left ||
            event.clientX > bounds.right ||
            event.clientY < bounds.top ||
            event.clientY > bounds.bottom
          )
            onClose();
        }
      }}
    >
      <header>
        <h2 id={titleId}>{title}</h2>
        <button
          autoFocus
          className="icon-button"
          onClick={onClose}
          aria-label="Đóng"
        >
          <X size={20} />
        </button>
      </header>
      {children}
    </dialog>
  );
}
export function EmptyState({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <h3>{title}</h3>
      {children && <p>{children}</p>}
    </div>
  );
}
