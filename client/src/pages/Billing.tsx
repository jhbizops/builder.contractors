import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Navigation } from "@/components/Navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { cancelSubscription, fetchPlans, fetchSubscription, startCheckout } from "@/api/billing";
import type { BillingPlan } from "@/types";
import { useAuth } from "@/contexts/AuthContext";

export default function BillingPage() {
  const queryClient = useQueryClient();
  const { userData } = useAuth();
  const { data: plans = [] } = useQuery({ queryKey: ["billing", "plans"], queryFn: fetchPlans });
  const subscriptionQuery = useQuery({
    queryKey: ["billing", "subscription"],
    queryFn: fetchSubscription,
    enabled: Boolean(userData),
  });

  const checkoutMutation = useMutation({
    mutationFn: async (planId: string) => {
      const baseUrl = window.location.origin;
      return startCheckout(planId, `${baseUrl}/dashboard/billing?status=success`, `${baseUrl}/dashboard/billing?status=cancel`);
    },
    onSuccess: (url) => {
      window.location.href = url;
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Unable to start checkout";
      toast({ title: "Billing", description: message, variant: "destructive" });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: cancelSubscription,
    onSuccess: () => {
      toast({ title: "Subscription", description: "Cancellation scheduled." });
      queryClient.invalidateQueries({ queryKey: ["billing", "subscription"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
    onError: () => {
      toast({ title: "Billing", description: "Unable to cancel subscription", variant: "destructive" });
    },
  });

  const currentPlanId = subscriptionQuery.data?.plan.id;
  const currentEntitlements = subscriptionQuery.data?.entitlements ?? [];

  const planLookup = useMemo(() => {
    return plans.reduce<Record<string, BillingPlan>>((acc, plan) => {
      acc[plan.id] = plan;
      return acc;
    }, {});
  }, [plans]);

  const handlePlanSelect = (planId: string) => {
    if (planId === "free") {
      cancelMutation.mutate();
      return;
    }

    if (planId === currentPlanId) {
      toast({ title: "Billing", description: "You are already on this plan." });
      return;
    }

    checkoutMutation.mutate(planId);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50">
        <Navigation />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900">Billing</h1>
            <p className="text-slate-600">Manage your plan, entitlements, and invoices.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {plans.map((plan) => (
                <Card key={plan.id} className={plan.id === currentPlanId ? "border-primary" : undefined}>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>{plan.name}</CardTitle>
                      <p className="text-sm text-slate-600">{plan.description}</p>
                    </div>
                    <Badge variant={plan.id === currentPlanId ? "default" : "secondary"}>
                      {plan.id === currentPlanId ? "Current" : plan.interval}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-3xl font-semibold text-slate-900">
                      {plan.priceCents === 0
                        ? "Free"
                        : `$${(plan.priceCents / 100).toFixed(2)}`}
                      <span className="text-base font-normal text-slate-500">/{plan.interval}</span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {plan.entitlements.map((entitlement) => (
                        <Badge key={entitlement} variant="outline">
                          {entitlement}
                        </Badge>
                      ))}
                    </div>

                    <div className="text-sm text-slate-700">
                      <p>Leads: {plan.quotas.leads.toLocaleString()}</p>
                      <p>Seats: {plan.quotas.seats.toLocaleString()}</p>
                      {plan.quotas.storageGb ? <p>Storage: {plan.quotas.storageGb} GB</p> : null}
                    </div>

                    <Button
                      disabled={checkoutMutation.isPending || cancelMutation.isPending}
                      onClick={() => handlePlanSelect(plan.id)}
                      variant={plan.id === currentPlanId ? "outline" : "default"}
                    >
                      {plan.id === currentPlanId ? "Current plan" : plan.priceCents === 0 ? "Switch to Free" : "Select"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Current subscription</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-slate-700">
                  <div className="flex items-center justify-between">
                    <span>Plan</span>
                    <strong>{planLookup[currentPlanId ?? ""]?.name ?? "Free"}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Status</span>
                    <Badge variant="secondary">{subscriptionQuery.data?.subscription?.status ?? "active"}</Badge>
                  </div>
                  <Separator />
                  <div className="space-y-1">
                    <p className="font-medium">Entitlements</p>
                    <div className="flex flex-wrap gap-2">
                      {currentEntitlements.map((item) => (
                        <Badge key={item} variant="outline">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-1">
                    <p className="font-medium">Quotas</p>
                    <p>Leads: {subscriptionQuery.data?.quotas.leads ?? 0}</p>
                    <p>Seats: {subscriptionQuery.data?.quotas.seats ?? 0}</p>
                  </div>
                  <Button
                    variant="ghost"
                    className="mt-2"
                    disabled={cancelMutation.isPending}
                    onClick={() => cancelMutation.mutate()}
                  >
                    Cancel at period end
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
