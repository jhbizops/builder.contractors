import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { ActivityLog } from '@/types';
import { parseActivityLog, type ActivityLogApi } from './transformers';

function getQueryKey(leadId: string | null) {
  return ['/api/activity-logs', leadId ?? 'all'];
}

export function useActivityLogs(leadId: string | null) {
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery<ActivityLog[]>({
    queryKey: getQueryKey(leadId),
    enabled: Boolean(leadId),
    queryFn: async () => {
      if (!leadId) {
        return [];
      }
      const res = await apiRequest(
        'GET',
        `/api/activity-logs?leadId=${encodeURIComponent(leadId)}`,
      );
      const payload = (await res.json()) as ActivityLogApi[];
      return payload.map(parseActivityLog);
    },
  });

  const createMutation = useMutation({
    mutationFn: async (input: Omit<ActivityLog, 'id'>) => {
      const res = await apiRequest('POST', '/api/activity-logs', {
        leadId: input.leadId,
        action: input.action,
        performedBy: input.performedBy,
        timestamp:
          input.timestamp instanceof Date ? input.timestamp.toISOString() : input.timestamp,
      });
      const payload = (await res.json()) as ActivityLogApi;
      return parseActivityLog(payload);
    },
    onMutate: async (input) => {
      if (!leadId) {
        return null;
      }
      await queryClient.cancelQueries({ queryKey: getQueryKey(leadId) });
      const previous = queryClient.getQueryData<ActivityLog[]>(getQueryKey(leadId)) ?? [];
      const optimistic: ActivityLog = {
        ...input,
        id: `optimistic-${crypto.randomUUID()}`,
      };
      queryClient.setQueryData<ActivityLog[]>(getQueryKey(leadId), [...previous, optimistic]);
      return { previous, optimisticId: optimistic.id };
    },
    onError: (_err, _input, context) => {
      if (context?.previous && leadId) {
        queryClient.setQueryData<ActivityLog[]>(getQueryKey(leadId), context.previous);
      }
    },
    onSuccess: (result, _input, context) => {
      if (leadId && context?.optimisticId) {
        queryClient.setQueryData<ActivityLog[]>(getQueryKey(leadId), (current = []) =>
          current.map((log) => (log.id === context.optimisticId ? result : log)),
        );
      }
    },
    onSettled: () => {
      if (leadId) {
        queryClient.invalidateQueries({ queryKey: getQueryKey(leadId) });
      }
    },
  });

  return {
    data: data ?? [],
    loading: isLoading,
    error: isError ? error : null,
    addLog: createMutation.mutateAsync,
  };
}
