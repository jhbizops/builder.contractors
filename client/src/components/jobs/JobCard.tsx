import React from "react";
import type { Job } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const statusStyles: Record<string, string> = {
  open: "bg-emerald-100 text-emerald-700",
  in_progress: "bg-blue-100 text-blue-700",
  completed: "bg-slate-100 text-slate-700",
  on_hold: "bg-amber-100 text-amber-700",
  cancelled: "bg-rose-100 text-rose-700",
};

interface JobCardProps {
  job: Job;
  canClaim: boolean;
  canCollaborate: boolean;
  disabledReason?: string | null;
  onClaim?: (job: Job) => void;
  onRequestCollaboration?: (job: Job) => void;
  isClaiming?: boolean;
  isRequesting?: boolean;
}

export function JobCard({
  job,
  canClaim,
  canCollaborate,
  disabledReason,
  onClaim,
  onRequestCollaboration,
  isClaiming,
  isRequesting,
}: JobCardProps) {
  return (
    <Card className="h-full border border-slate-200">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{job.title}</CardTitle>
            <p className="text-sm text-slate-600">
              {job.trade ? `${job.trade} • ` : ""}
              {job.region ?? "Unspecified region"}
            </p>
          </div>
          <Badge className={statusStyles[job.status] ?? "bg-slate-100 text-slate-700"}>
            {job.status.replace("_", " ")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {job.description && <p className="text-sm text-slate-700">{job.description}</p>}
        <div className="flex items-center justify-between text-xs text-slate-600">
          <span>Owner: {job.ownerId}</span>
          <span>Assignee: {job.assigneeId ?? "Unassigned"}</span>
        </div>
        {disabledReason && (
          <p className="text-xs text-amber-700" role="status">
            {disabledReason}
          </p>
        )}
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => onClaim?.(job)}
            disabled={!canClaim || job.assigneeId !== null || isClaiming}
          >
            {isClaiming ? "Claiming..." : "Claim"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onRequestCollaboration?.(job)}
            disabled={!canCollaborate || isRequesting}
          >
            {isRequesting ? "Requesting..." : "Request collaboration"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
