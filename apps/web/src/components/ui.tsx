import type { ReactNode } from "react";
import { Inbox } from "lucide-react";
import { roleBadgeClass, roleLabel } from "../utils/labels";

export function RoleBadge({ role }: { role: string }): JSX.Element {
  return <span className={roleBadgeClass(role)}>{roleLabel(role)}</span>;
}

export function SkeletonBlock({ height = 96 }: { height?: number }): JSX.Element {
  return <div className="skeleton" style={{ height }} />;
}

export function EmptyState({ title, description, action, icon }: { title: string; description?: string; action?: ReactNode; icon?: ReactNode }): JSX.Element {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon ?? <Inbox size={28} />}</div>
      <div>
        <p>{title}</p>
        {description !== undefined ? <small>{description}</small> : null}
      </div>
      {action}
    </div>
  );
}

export function RetryButton({ onRetry }: { onRetry?: () => void }): JSX.Element {
  const handleRetry = (): void => {
    if (onRetry !== undefined) {
      onRetry();
      return;
    }

    window.location.reload();
  };

  return <button type="button" className="secondary-link" onClick={handleRetry}>Reintentar</button>;
}
