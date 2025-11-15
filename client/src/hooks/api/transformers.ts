import { ActivityLog, Lead, LeadComment, LeadFile, Service } from '@/types';

export type LeadFileApi = Omit<LeadFile, 'uploadedAt'> & { uploadedAt: string };
export type LeadApi = Omit<Lead, 'createdAt' | 'updatedAt' | 'files'> & {
  createdAt: string;
  updatedAt: string;
  files: LeadFileApi[];
};
export type LeadCommentApi = Omit<LeadComment, 'timestamp'> & { timestamp: string };
export type ActivityLogApi = Omit<ActivityLog, 'timestamp'> & { timestamp: string };

export function parseLeadFile(api: LeadFileApi): LeadFile {
  return {
    ...api,
    uploadedAt: new Date(api.uploadedAt),
  };
}

export function serialiseLeadFile(file: LeadFile): LeadFileApi {
  return {
    ...file,
    uploadedAt: file.uploadedAt instanceof Date ? file.uploadedAt.toISOString() : file.uploadedAt,
  };
}

export function parseLead(api: LeadApi): Lead {
  return {
    ...api,
    files: (api.files ?? []).map(parseLeadFile),
    notes: api.notes ?? [],
    createdAt: new Date(api.createdAt),
    updatedAt: new Date(api.updatedAt),
  };
}

export function serialiseLead(input: Partial<Lead>): Partial<LeadApi> {
  const { createdAt, updatedAt, files, ...rest } = input;
  const payload: Partial<LeadApi> = { ...rest };

  if (createdAt) {
    payload.createdAt = createdAt instanceof Date ? createdAt.toISOString() : createdAt;
  }

  if (updatedAt) {
    payload.updatedAt = updatedAt instanceof Date ? updatedAt.toISOString() : updatedAt;
  }

  if (files) {
    payload.files = files.map(serialiseLeadFile);
  }

  return payload;
}

export function parseLeadComment(api: LeadCommentApi): LeadComment {
  return {
    ...api,
    timestamp: new Date(api.timestamp),
  };
}

export function serialiseLeadComment(
  input: Pick<LeadComment, 'leadId' | 'body' | 'author' | 'timestamp' | 'id'>,
): LeadCommentApi {
  return {
    ...input,
    timestamp: input.timestamp instanceof Date ? input.timestamp.toISOString() : input.timestamp,
  };
}

export function parseActivityLog(api: ActivityLogApi): ActivityLog {
  return {
    ...api,
    timestamp: new Date(api.timestamp),
  };
}

export function serialiseActivityLog(
  input: Pick<ActivityLog, 'action' | 'leadId' | 'performedBy' | 'timestamp' | 'id'>,
): ActivityLogApi {
  return {
    ...input,
    timestamp: input.timestamp instanceof Date ? input.timestamp.toISOString() : input.timestamp,
  };
}

export function parseService(api: Service): Service {
  return {
    ...api,
    active: api.active ?? true,
  };
}
