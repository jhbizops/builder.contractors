import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Navigation } from "@/components/Navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserApprovalPanel } from "@/components/UserApprovalPanel";
import { ServiceManagement } from "@/components/ServiceManagement";
import { LeadCard } from "@/components/LeadCard";
import { LeadModal } from "@/components/modals/LeadModal";
import { Plus, Download, Users, Handshake, Clock, TrendingUp } from "lucide-react";
import { Lead } from "@/types";
import { useGlobalization } from "@/contexts/GlobalizationContext";
import { USERS_QUERY_KEY, fetchUsers } from "@/api/users";
import { fetchLeads, leadsQueryKey, updateLead } from "@/api/leads";

export default function AdminDashboard() {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const queryClient = useQueryClient();
  const { data: leads = [] } = useQuery({
    queryKey: leadsQueryKey,
    queryFn: fetchLeads,
  });
  const updateLeadMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Lead> }) => updateLead(id, updates),
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: leadsQueryKey });
      const previous = queryClient.getQueryData<Lead[]>(leadsQueryKey) ?? [];
      queryClient.setQueryData<Lead[]>(leadsQueryKey, (current = []) =>
        current.map((lead) => (lead.id === id ? { ...lead, ...updates, updatedAt: new Date() } : lead)),
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(leadsQueryKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: leadsQueryKey });
    },
  });
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: USERS_QUERY_KEY,
    queryFn: fetchUsers,
  });
  const { formatDualCurrency, formatNumber } = useGlobalization();

  const stats = useMemo(
    () => ({
      totalUsers: users.length,
      activeLeads: leads.filter((lead) => lead.status === "in_progress").length,
      pendingApprovals: users.filter((user) => !user.approved).length,
      monthlyRevenue: 24800,
    }),
    [leads, users],
  );

  const handleViewLead = (lead: Lead) => {
    setSelectedLead(lead);
  };

  const handleEditLead = (lead: Lead) => {
    setSelectedLead(lead);
  };

  const handleDeleteLead = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this lead?")) {
      // Would implement delete functionality
    }
  };

  const handleSaveLead = async (leadData: Partial<Lead>) => {
    if (!selectedLead) return;

    try {
      await updateLeadMutation.mutateAsync({ id: selectedLead.id, updates: leadData });
      setSelectedLead(null);
    } catch (error) {
      console.error("Error updating lead:", error);
    }
  };

  const recentLeads = leads.slice(0, 5);

  return (
    <ProtectedRoute requiredRole={["admin"]}>
      <div className="min-h-screen bg-slate-50">
        <Navigation />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Admin Dashboard</h2>
                <p className="text-slate-600 mt-1">Manage users, leads, and platform settings</p>
              </div>
              <div className="flex space-x-3">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Lead
                </Button>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-primary/10 rounded-md flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-slate-600">Total Users</p>
                    <p className="text-2xl font-bold text-slate-900">{formatNumber(stats.totalUsers)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                      <Handshake className="h-5 w-5 text-green-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-slate-600">Active Leads</p>
                    <p className="text-2xl font-bold text-slate-900">{formatNumber(stats.activeLeads)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-100 rounded-md flex items-center justify-center">
                      <Clock className="h-5 w-5 text-yellow-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-slate-600">Pending Approvals</p>
                    <p className="text-2xl font-bold text-slate-900">{formatNumber(stats.pendingApprovals)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-slate-600">Monthly Revenue</p>
                    <p className="text-2xl font-bold text-slate-900">{formatDualCurrency(stats.monthlyRevenue)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Leads</CardTitle>
                </CardHeader>
                <CardContent>
                  {recentLeads.length === 0 ? (
                    <p className="text-slate-500 text-center py-8">No leads found</p>
                  ) : (
                    <div className="space-y-4">
                      {recentLeads.map((lead) => (
                        <LeadCard
                          key={lead.id}
                          lead={lead}
                          onView={handleViewLead}
                          onEdit={handleEditLead}
                          onDelete={handleDeleteLead}
                        />
                      ))}
                    </div>
                  )}

                  <div className="pt-4 border-t border-slate-200 mt-6">
                    <button className="text-primary text-sm font-medium hover:text-blue-700">
                      View all leads →
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              {usersLoading ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Pending User Approvals</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-500 text-center py-4">Loading users…</p>
                  </CardContent>
                </Card>
              ) : (
                <UserApprovalPanel />
              )}
              <ServiceManagement />
            </div>
          </div>
        </div>

        <LeadModal
          lead={selectedLead}
          isOpen={!!selectedLead}
          onClose={() => setSelectedLead(null)}
          onSave={handleSaveLead}
        />
      </div>
    </ProtectedRoute>
  );
}
