import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

interface EntitlementGateProps {
  entitlement: string;
  children: React.ReactNode;
  fallbackText?: string;
}

export function EntitlementGate({ entitlement, children, fallbackText }: EntitlementGateProps) {
  const { userData } = useAuth();

  if (userData?.entitlements.includes(entitlement)) {
    return <>{children}</>;
  }

  return (
    <Card className="bg-slate-50 border-dashed">
      <CardContent className="flex items-start gap-3 pt-4">
        <AlertCircle className="h-5 w-5 text-blue-500" />
        <div>
          <p className="text-sm font-medium text-slate-900">Upgrade to unlock</p>
          <p className="text-sm text-slate-600">
            {fallbackText ?? "This feature is available on paid plans. Manage billing to upgrade."}
          </p>
          <a
            href="/dashboard/billing"
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            View plans
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
