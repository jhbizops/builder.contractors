import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Lead } from '@/types';
import { parseLead, serialiseLead, type LeadApi } from './transformers';

const queryKey = ['/api/leads'];

type CreateLeadInput = Omit<Lead, 'id'>;
type UpdateLeadInput = { id: string; updates: Partial<Omit<Lead, 'id'>> };

export function useLeads() {
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery<Lead[]>({
    queryKey,
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/leads');
      const payload = (await res.json()) as LeadApi[];
      return payload.map(parseLead);
    },
  });

  const createMutation = useMutation({
    mutationFn: async (input: CreateLeadInput) => {
      const res = await apiRequest('POST', '/api/leads', serialiseLead(input));
      const payload = (await res.json()) as LeadApi;
      return parseLead(payload);
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Lead[]>(queryKey) ?? [];
      const optimistic: Lead = {
        ...input,
        id: `optimistic-${crypto.randomUUID()}`,
      };
      queryClient.setQueryData<Lead[]>(queryKey, [...previous, optimistic]);
      return { previous, optimisticId: optimistic.id };
    },
    onError: (_err, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSuccess: (result, _input, context) => {
      queryClient.setQueryData<Lead[]>(queryKey, (current = []) =>
        current.map((lead) => (lead.id === context?.optimisticId ? result : lead)),
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: UpdateLeadInput) => {
      const res = await apiRequest('PATCH', `/api/leads/${id}`, serialiseLead(updates));
      const payload = (await res.json()) as LeadApi;
      return parseLead(payload);
    },
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Lead[]>(queryKey) ?? [];
      queryClient.setQueryData<Lead[]>(queryKey, (current = []) =>
        current.map((lead) => (lead.id === id ? { ...lead, ...updates } : lead)),
      );
      return { previous };
    },
    onError: (_err, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSuccess: (result) => {
      queryClient.setQueryData<Lead[]>(queryKey, (current = []) =>
        current.map((lead) => (lead.id === result.id ? result : lead)),
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/leads/${id}`);
      return id;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Lead[]>(queryKey) ?? [];
      queryClient.setQueryData<Lead[]>(queryKey, previous.filter((lead) => lead.id !== id));
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    data: data ?? [],
    loading: isLoading,
    error: isError ? error : null,
    createLead: createMutation.mutateAsync,
    updateLead: updateMutation.mutateAsync,
    deleteLead: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
