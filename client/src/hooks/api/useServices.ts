import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Service } from '@/types';
import { parseService } from './transformers';

const queryKey = ['/api/services'];

type CreateServiceInput = Omit<Service, 'id'>;
type UpdateServiceInput = { id: string; updates: Partial<Omit<Service, 'id'>> };

export function useServices() {
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery<Service[]>({
    queryKey,
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/services');
      const payload = (await res.json()) as Service[];
      return payload.map(parseService);
    },
  });

  const createMutation = useMutation({
    mutationFn: async (input: CreateServiceInput) => {
      const res = await apiRequest('POST', '/api/services', input);
      const payload = (await res.json()) as Service;
      return parseService(payload);
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Service[]>(queryKey) ?? [];
      const optimistic: Service = { ...input, id: `optimistic-${crypto.randomUUID()}` };
      queryClient.setQueryData<Service[]>(queryKey, [...previous, optimistic]);
      return { previous, optimisticId: optimistic.id };
    },
    onError: (_err, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSuccess: (result, _input, context) => {
      queryClient.setQueryData<Service[]>(queryKey, (current = []) =>
        current.map((service) => (service.id === context?.optimisticId ? result : service)),
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: UpdateServiceInput) => {
      const res = await apiRequest('PATCH', `/api/services/${id}`, updates);
      const payload = (await res.json()) as Service;
      return parseService(payload);
    },
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Service[]>(queryKey) ?? [];
      queryClient.setQueryData<Service[]>(queryKey, (current = []) =>
        current.map((service) => (service.id === id ? { ...service, ...updates } : service)),
      );
      return { previous };
    },
    onError: (_err, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSuccess: (result) => {
      queryClient.setQueryData<Service[]>(queryKey, (current = []) =>
        current.map((service) => (service.id === result.id ? result : service)),
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/services/${id}`);
      return id;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Service[]>(queryKey) ?? [];
      queryClient.setQueryData<Service[]>(queryKey, previous.filter((service) => service.id !== id));
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
    createService: createMutation.mutateAsync,
    updateService: updateMutation.mutateAsync,
    deleteService: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
