import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

type DeliveryCreative = {
  id: string;
  adId: string;
  format: string;
  headline: string | null;
  body: string | null;
  assetUrl: string;
  callToAction: string | null;
  metadata: Record<string, unknown>;
};

type DeliveryResponse = {
  creatives: DeliveryCreative[];
};

type AdSlotProps = {
  trade?: string;
  region?: string;
  className?: string;
};

export function AdSlot({ trade, region, className }: AdSlotProps) {
  const deliveryUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (trade) params.set("trade", trade);
    if (region) params.set("region", region);
    const query = params.toString();
    return query ? `/api/ads/delivery?${query}` : "/api/ads/delivery";
  }, [trade, region]);

  const { data } = useQuery<DeliveryResponse>({
    queryKey: [deliveryUrl],
  });

  if (!data?.creatives.length) {
    return null;
  }

  const creative = data.creatives[0];

  return (
    <div
      className={cn(
        "rounded-lg border border-slate-200 bg-white p-4 shadow-sm",
        className,
      )}
      data-testid="ad-slot"
    >
      <img
        src={creative.assetUrl}
        alt={creative.headline ?? "Sponsored"}
        className="mb-3 w-full rounded-md object-cover"
      />
      {creative.headline ? (
        <p className="text-sm font-semibold text-slate-900">
          {creative.headline}
        </p>
      ) : null}
      {creative.body ? (
        <p className="mt-1 text-sm text-slate-600">{creative.body}</p>
      ) : null}
      {creative.callToAction ? (
        <span className="mt-2 inline-flex text-xs font-semibold uppercase tracking-wide text-indigo-600">
          {creative.callToAction}
        </span>
      ) : null}
    </div>
  );
}
