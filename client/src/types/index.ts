export interface User {
  id: string;
  email: string;
  role: 'sales' | 'builder' | 'admin' | 'dual';
  country?: string;
  region?: string;
  approved: boolean;
  createdAt: Date;
}

export interface LeadFile {
  id: string;
  name: string;
  dataUrl: string;
  uploadedAt: Date;
}

export interface Lead {
  id: string;
  partnerId: string;
  clientName: string;
  status: 'new' | 'in_progress' | 'completed' | 'on_hold';
  location?: string;
  country?: string;
  region?: string;
  notes: string[];
  files: LeadFile[];
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
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

export interface ActivityLog {
  id: string;
  leadId?: string;
  action: string;
  performedBy: string;
  timestamp: Date;
}

export interface CustomPricing {
  id: string;
  userId: string;
  serviceId: string;
  price: number;
  notes?: string;
}
