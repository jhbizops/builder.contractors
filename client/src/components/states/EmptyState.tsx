import type { ReactNode } from "react";
import { InboxIcon } from "lucide-react";

type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action: ReactNode;
};

export function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 text-slate-400">
        {icon ?? <InboxIcon className="h-12 w-12" />}
      </div>
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-slate-600 max-w-sm">{description}</p>
      )}
      <div className="mt-6">{action}</div>
    </div>
  );
}
