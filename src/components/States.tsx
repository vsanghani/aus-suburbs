import type { ReactNode } from "react";
import { ApiError } from "../api/client";

export function LoadingState({ label = "Fetching the record." }: { label?: string }) {
  return (
    <p className="status-block" role="status">
      <span className="kicker">Loading</span>
      {label}
    </p>
  );
}

export function EmptyState({
  kicker = "Empty",
  title,
  body,
  children,
}: {
  kicker?: string;
  title: string;
  body: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty">
      <p className="kicker">{kicker}</p>
      <p className="empty-title">{title}</p>
      <p>{body}</p>
      {children}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const detail =
    error instanceof ApiError ? error.detail : "This page hit a problem in the browser.";
  return (
    <div className="notice" role="alert">
      <p className="kicker">Problem</p>
      <p>{detail}</p>
      {onRetry ? (
        <button type="button" className="button-solid" onClick={onRetry}>
          Try again
        </button>
      ) : null}
    </div>
  );
}

export function DatasetNotice({
  connected,
  notice,
  emptyTitle,
  emptyBody,
}: {
  connected: boolean;
  notice: string;
  emptyTitle: string;
  emptyBody: string;
}) {
  if (!connected) {
    return <EmptyState kicker="Not connected" title="No dataset is connected" body={notice} />;
  }
  return <EmptyState title={emptyTitle} body={emptyBody} />;
}
