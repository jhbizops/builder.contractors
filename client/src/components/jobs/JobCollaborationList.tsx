import React from "react";
import type { Job } from "@shared/schema";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { JobActivityPanel } from "./JobActivityPanel";

const statusLabels: Record<string, string> = {
  open: "Open",
  in_progress: "In progress",
  completed: "Completed",
  on_hold: "On hold",
  cancelled: "Cancelled",
};

interface JobCollaborationListProps {
  jobs: Job[];
  isLoading?: boolean;
  canManage: boolean;
  permissionReason?: string | null;
  currentUserId?: string;
  onStatusChange: (jobId: string, status: Job["status"]) => Promise<void>;
  onAssignToMe: (job: Job, assigneeId: string | null) => Promise<void>;
  canAssign?: (job: Job) => boolean;
}

export function JobCollaborationList({
  jobs,
  isLoading,
  canManage,
  permissionReason,
  currentUserId,
  onStatusChange,
  onAssignToMe,
  canAssign,
}: JobCollaborationListProps) {
  if (isLoading) {
    return <p className="text-sm text-slate-500">Loading jobs...</p>;
  }

  if (jobs.length === 0) {
    return <p className="text-sm text-slate-500">No jobs yet.</p>;
  }

  return (
    <Accordion type="multiple" className="space-y-3">
      {jobs.map((job) => {
        const isAssignedToUser = job.assigneeId === currentUserId;
        const allowAssignment = canAssign ? canAssign(job) : canManage;
        return (
          <AccordionItem key={job.id} value={job.id} className="border border-slate-200 rounded-lg px-3">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3 text-left">
                <div>
                  <p className="text-sm font-medium text-slate-900">{job.title}</p>
                  <p className="text-xs text-slate-600">
                    {job.trade} • {job.region ?? "Region TBD"}
                  </p>
                </div>
                <Badge variant="secondary">{statusLabels[job.status] ?? job.status}</Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pb-4">
              <div className="flex flex-wrap gap-3 items-center">
                <Select
                  value={job.status}
                  onValueChange={(value) => onStatusChange(job.id, value as Job["status"])}
                  disabled={!canManage}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant={isAssignedToUser ? "outline" : "default"}
                  size="sm"
                  onClick={() => onAssignToMe(job, isAssignedToUser ? null : currentUserId ?? null)}
                  disabled={!allowAssignment}
                >
                  {isAssignedToUser ? "Unassign" : "Assign to me"}
                </Button>
                {!canManage && permissionReason && (
                  <p className="text-xs text-amber-700">{permissionReason}</p>
                )}
              </div>
              <JobActivityPanel jobId={job.id} canCollaborate={canManage} disabledReason={permissionReason} />
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
