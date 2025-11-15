import type {
  IStorage,
  LeadStatus,
  StoredLead,
  StoredService,
} from "../storage";

export interface AdminMetrics {
  totalUsers: number;
  approvedUsers: number;
  pendingApprovals: number;
  totalLeads: number;
  leadsByStatus: Record<LeadStatus, number>;
  monthlyLeadVolume: number;
  monthlyRevenue: number;
  averageDealSize: number;
  serviceCount: number;
  activeServiceCount: number;
}

const LEAD_STATUSES: readonly LeadStatus[] = [
  "new",
  "in_progress",
  "completed",
  "on_hold",
];

function ensureDate(value: Date | string | number | undefined): Date {
  if (!value) {
    return new Date(0);
  }

  if (value instanceof Date) {
    return value;
  }

  return new Date(value);
}

function isSameMonth(candidate: Date, reference: Date): boolean {
  return (
    candidate.getUTCFullYear() === reference.getUTCFullYear() &&
    candidate.getUTCMonth() === reference.getUTCMonth()
  );
}

function sumEstimatedValues(leads: StoredLead[]): number {
  return leads.reduce((total, lead) => total + (lead.estimatedValue ?? 0), 0);
}

function averageServicePrice(services: StoredService[]): number {
  if (services.length === 0) {
    return 0;
  }

  const total = services.reduce((sum, service) => sum + service.basePrice, 0);
  return total / services.length;
}

export async function calculateAdminMetrics(
  storage: IStorage,
  referenceDate: Date = new Date(),
): Promise<AdminMetrics> {
  const [users, leads, services] = await Promise.all([
    storage.listUsers(),
    storage.listLeads(),
    storage.listServices(),
  ]);

  const approvedUsers = users.filter((user) => user.approved).length;
  const pendingApprovals = users.length - approvedUsers;

  const leadsByStatus: Record<LeadStatus, number> = LEAD_STATUSES.reduce(
    (accumulator, status) => ({ ...accumulator, [status]: 0 }),
    {} as Record<LeadStatus, number>,
  );

  for (const lead of leads) {
    leadsByStatus[lead.status] = (leadsByStatus[lead.status] ?? 0) + 1;
  }

  const monthlyLeadVolume = leads.filter((lead) =>
    isSameMonth(ensureDate(lead.createdAt), referenceDate),
  ).length;

  const completedThisMonth = leads.filter(
    (lead) =>
      lead.status === "completed" &&
      isSameMonth(ensureDate(lead.updatedAt), referenceDate),
  );

  let monthlyRevenue = sumEstimatedValues(completedThisMonth);

  if (monthlyRevenue === 0 && completedThisMonth.length > 0) {
    const estimatedRevenue =
      averageServicePrice(services) * completedThisMonth.length;
    monthlyRevenue = Math.round(estimatedRevenue);
  }

  const averageDealSize =
    completedThisMonth.length === 0
      ? 0
      : monthlyRevenue / completedThisMonth.length;

  return {
    totalUsers: users.length,
    approvedUsers,
    pendingApprovals,
    totalLeads: leads.length,
    leadsByStatus,
    monthlyLeadVolume,
    monthlyRevenue,
    averageDealSize,
    serviceCount: services.length,
    activeServiceCount: services.filter((service) => service.active).length,
  };
}
