import { Navigation } from "@/components/Navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ReportsPage() {
  return (
    <ProtectedRoute requiredEntitlement="reports.export">
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Premium reports</h1>
            <p className="text-slate-600">Exports and analytics are included with paid plans.</p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Activity exports</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-700">
              <p>Generate CSV exports for leads, services, and audit trails.</p>
              <p>Webhook notifications are sent to Stripe during billing events.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
