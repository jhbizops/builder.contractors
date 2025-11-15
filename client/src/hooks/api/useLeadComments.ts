import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { LeadComment } from '@/types';
import { parseLeadComment, type LeadCommentApi } from './transformers';

function getQueryKey(leadId: string | null) {
  return ['/api/lead-comments', leadId ?? 'all'];
}

export function useLeadComments(leadId: string | null) {
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery<LeadComment[]>({
    queryKey: getQueryKey(leadId),
    enabled: Boolean(leadId),
    queryFn: async () => {
      if (!leadId) {
        return [];
      }
      const res = await apiRequest(
        'GET',
        `/api/lead-comments?leadId=${encodeURIComponent(leadId)}`,
      );
      const payload = (await res.json()) as LeadCommentApi[];
      return payload.map(parseLeadComment);
    },
  });

  const createMutation = useMutation({
    mutationFn: async (input: Omit<LeadComment, 'id'>) => {
      const res = await apiRequest('POST', '/api/lead-comments', {
        leadId: input.leadId,
        body: input.body,
        author: input.author,
        timestamp:
          input.timestamp instanceof Date ? input.timestamp.toISOString() : input.timestamp,
      });
      const payload = (await res.json()) as LeadCommentApi;
      return parseLeadComment(payload);
    },
    onMutate: async (input) => {
      if (!leadId) {
        return null;
      }
      await queryClient.cancelQueries({ queryKey: getQueryKey(leadId) });
      const previous = queryClient.getQueryData<LeadComment[]>(getQueryKey(leadId)) ?? [];
      const optimistic: LeadComment = {
        ...input,
        id: `optimistic-${crypto.randomUUID()}`,
      };
      queryClient.setQueryData<LeadComment[]>(getQueryKey(leadId), [...previous, optimistic]);
      return { previous, optimisticId: optimistic.id };
    },
    onError: (_err, _input, context) => {
      if (context?.previous && leadId) {
        queryClient.setQueryData<LeadComment[]>(getQueryKey(leadId), context.previous);
      }
    },
    onSuccess: (result, _input, context) => {
      if (leadId && context?.optimisticId) {
        queryClient.setQueryData<LeadComment[]>(getQueryKey(leadId), (current = []) =>
          current.map((comment) => (comment.id === context.optimisticId ? result : comment)),
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
    addComment: createMutation.mutateAsync,
  };
}
