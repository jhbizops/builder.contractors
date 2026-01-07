export interface PlanQuota {
  leads: number;
  seats: number;
  storageGb?: number;
  workspaces?: number;
}

export interface BillingPlan {
  id: string;
  name: string;
  description?: string;
  interval: string;
  priceCents: number;
  currency: string;
  entitlements: string[];
  quotas: PlanQuota;
  isDefault: boolean;
  providerPriceId: string | null;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: string;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  provider: string;
  providerCustomerId: string | null;
  providerSubscriptionId: string | null;
  metadata: Record<string, string>;
}

export interface User {
  id: string;
  email: string;
  role: 'sales' | 'builder' | 'admin' | 'super_admin' | 'dual';
  country?: string;
  region?: string;
  locale?: string;
  currency?: string;
  languages?: string[];
  approved: boolean;
  createdAt: Date;
  plan: BillingPlan;
  subscription: Subscription | null;
  entitlements: string[];
  quotas: PlanQuota;
}

export interface Lead {
  id: string;
  partnerId: string;
  clientName: string;
  status: 'new' | 'in_progress' | 'completed' | 'on_hold';
  location?: string | null;
  country?: string | null;
  region?: string | null;
  notes: string[];
  files: LeadFile[];
  createdBy: string;
  updatedBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface LeadFile {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  dataUrl: string;
  uploadedAt: Date;
}

export interface LeadComment {
  id: string;
  leadId: string;
  body: string;
  author: string;
  timestamp: Date;
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  unit: string;
  basePrice: number;
  imageUrl?: string;
  active: boolean;
}

export interface JobAttachment {
  name: string;
  url?: string;
  kind?: string;
}

export interface JobActivityDetails {
  note?: string;
  attachments?: JobAttachment[];
  from?: string;
  to?: string;
  kind?: string;
}

export interface ActivityLog {
  id: string;
  leadId?: string | null;
  jobId?: string | null;
  action: string;
  performedBy: string;
  details?: JobActivityDetails & Record<string, unknown>;
  timestamp: Date | null;
}

export interface CustomPricing {
  id: string;
  userId: string;
  serviceId: string;
  price: number;
  notes?: string;
}

export type ExportJobStatus = 'queued' | 'processing' | 'completed' | 'failed';

export interface ExportJob {
  id: string;
  status: ExportJobStatus;
  filters: Record<string, unknown>;
  fileUrl?: string | null;
  createdBy: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}
