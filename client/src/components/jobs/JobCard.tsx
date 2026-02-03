import React from "react";
import type { Job } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { deriveJobNextStep, deriveJobReadiness } from "@/lib/jobs";

const statusStyles: Record<string, string> = {
  open: "bg-emerald-100 text-emerald-700",
  in_progress: "bg-blue-100 text-blue-700",
  completed: "bg-slate-100 text-slate-700",
  on_hold: "bg-amber-100 text-amber-700",
  cancelled: "bg-rose-100 text-rose-700",
};

interface JobCardProps {
  job: Job;
  currentUserId?: string;
  canClaim: boolean;
  canCollaborate: boolean;
  canManageStatus?: boolean;
  disabledReason?: string | null;
  onClaim?: (job: Job) => void;
  onRequestCollaboration?: (job: Job) => void;
  onStartJob?: (job: Job) => void;
  onCompleteJob?: (job: Job) => void;
  isClaiming?: boolean;
  isRequesting?: boolean;
  isUpdatingStatus?: boolean;
}

export function JobCard({
  job,
  currentUserId,
  canClaim,
  canCollaborate,
  canManageStatus,
  disabledReason,
  onClaim,
  onRequestCollaboration,
  onStartJob,
  onCompleteJob,
  isClaiming,
  isRequesting,
  isUpdatingStatus,
}: JobCardProps) {
  const readiness = deriveJobReadiness(job);
  const nextStep = deriveJobNextStep(job, currentUserId);
  const isOwner = Boolean(currentUserId && job.ownerId === currentUserId);
  const isAssignee = Boolean(currentUserId && job.assigneeId === currentUserId);
  const ownerLabel = isOwner ? "You" : job.ownerId;
  const assigneeLabel = job.assigneeId ? (isAssignee ? "You" : job.assigneeId) : "Open allocation";
  const canUpdateStatus = Boolean(canManageStatus && (isOwner || isAssignee));
  const showStartAction = canUpdateStatus && job.status === "open" && Boolean(job.assigneeId);
  const showCompleteAction = canUpdateStatus && job.status === "in_progress";
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
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
          <span className="font-medium text-slate-700">Allocation readiness</span>
          <Badge className={readiness.isReady ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}>
            {readiness.isReady ? "Ready to allocate" : `Needs ${readiness.missing.length} detail`}
          </Badge>
          <span>{readiness.score}% complete</span>
        </div>
        {!readiness.isReady && (
          <p className="text-xs text-slate-500">Add: {readiness.missing.join(", ")}.</p>
        )}
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs text-slate-600">
          <p className="font-medium text-slate-700">Next step: {nextStep.label}</p>
          <p>{nextStep.description}</p>
        </div>
        <div className="flex items-center justify-between text-xs text-slate-600">
          <span>Owner: {ownerLabel}</span>
          <span>{job.assigneeId ? `Assigned to ${assigneeLabel}` : "Open allocation"}</span>
        </div>
        {disabledReason && (
          <p className="text-xs text-amber-700" role="status">
            {disabledReason}
          </p>
        )}
        <div className="flex gap-2">
          {showStartAction && (
            <Button size="sm" onClick={() => onStartJob?.(job)} disabled={isUpdatingStatus}>
              {isUpdatingStatus ? "Starting..." : "Start job"}
            </Button>
          )}
          {showCompleteAction && (
            <Button size="sm" onClick={() => onCompleteJob?.(job)} disabled={isUpdatingStatus}>
              {isUpdatingStatus ? "Updating..." : "Mark complete"}
            </Button>
          )}
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
