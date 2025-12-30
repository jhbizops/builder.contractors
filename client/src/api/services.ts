import { z } from "zod";
import type { Service } from "@/types";
import { apiRequest } from "@/lib/queryClient";

const serviceSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullish(),
  unit: z.string(),
  basePrice: z.number(),
  imageUrl: z.string().nullish(),
  active: z.boolean(),
});

export const servicesQueryKey = ["services"] as const;

export async function fetchServices(): Promise<Service[]> {
  const res = await apiRequest("GET", "/api/services");
  const json = await res.json();
  const parsed = z.object({ services: z.array(serviceSchema) }).parse(json);
  return parsed.services.map(mapService);
}

export async function createService(payload: Omit<Service, "id">): Promise<Service> {
  const res = await apiRequest("POST", "/api/services", payload);
  const json = await res.json();
  const parsed = z.object({ service: serviceSchema }).parse(json);
  return mapService(parsed.service);
}

export async function updateService(id: string, updates: Partial<Service>): Promise<Service> {
  const res = await apiRequest("PATCH", `/api/services/${id}`, updates);
  const json = await res.json();
  const parsed = z.object({ service: serviceSchema }).parse(json);
  return mapService(parsed.service);
}

function mapService(service: z.infer<typeof serviceSchema>): Service {
  return {
    ...service,
    description: service.description ?? undefined,
    imageUrl: service.imageUrl ?? undefined,
  };
}
