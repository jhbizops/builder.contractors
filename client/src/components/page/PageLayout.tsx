import type { ReactNode } from "react";
import { PageHeader } from "./PageHeader";

type PageLayoutProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  stats?: ReactNode;
  children: ReactNode;
};

export function PageLayout({
  title,
  description,
  actions,
  stats,
  children,
}: PageLayoutProps) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} actions={actions} />
      {stats && <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{stats}</div>}
      {children}
    </div>
  );
}
