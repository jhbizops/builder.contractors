import { Lead } from "@/types";

export type LeadStats = {
  totalLeads: number;
  activeLeads: number;
  completedLeads: number;
  newLeads: number;
};

export function filterLeadsByStatusAndRegion(
  leads: Lead[],
  statusFilter: string,
  regionFilter: string,
): Lead[] {
  return leads.filter((lead) => {
    if (statusFilter !== "all" && lead.status !== statusFilter) return false;
    if (regionFilter !== "all" && lead.region !== regionFilter) return false;
    return true;
  });
}

export function calculateLeadStats(leads: Lead[]): LeadStats {
  return {
    totalLeads: leads.length,
    activeLeads: leads.filter((lead) => lead.status === "in_progress").length,
    completedLeads: leads.filter((lead) => lead.status === "completed").length,
    newLeads: leads.filter((lead) => lead.status === "new").length,
  };
}
