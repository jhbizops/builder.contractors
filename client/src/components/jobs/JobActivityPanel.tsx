import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import {
  fetchJobActivity,
  createJobActivity,
  inviteToJob,
  type CreateJobActivityPayload,
} from "@/api/jobs";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import type { ActivityLog, JobAttachment } from "@/types";

interface JobActivityPanelProps {
  jobId: string;
  canCollaborate: boolean;
  canInvite: boolean;
  disabledReason?: string | null;
}

function buildAttachment(name?: string, url?: string): JobAttachment | undefined {
  if (!name) return undefined;
  return { name, url: url || undefined };
}

export function JobActivityPanel({ jobId, canCollaborate, canInvite, disabledReason }: JobActivityPanelProps) {
  const queryClient = useQueryClient();
  const [note, setNote] = useState("");
  const [attachmentName, setAttachmentName] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [inviteEmails, setInviteEmails] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");

  const { data: activity = [], isPending } = useQuery({
    queryKey: ["job-activity", jobId],
    queryFn: () => fetchJobActivity(jobId),
    enabled: Boolean(jobId),
  });

  const createActivity = useMutation({
    mutationFn: (payload: CreateJobActivityPayload) => createJobActivity(jobId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-activity", jobId] });
      setNote("");
      setAttachmentName("");
      setAttachmentUrl("");
      toast({ title: "Saved", description: "Your update was posted." });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Failed to post update";
      toast({ title: "Error", description: message, variant: "destructive" });
    },
  });

  const inviteMutation = useMutation({
    mutationFn: ({ emails, message }: { emails: string[]; message?: string }) =>
      inviteToJob(jobId, { emails, message }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-activity", jobId] });
      setInviteEmails("");
      setInviteMessage("");
      toast({ title: "Invites sent", description: "Your collaborators were invited." });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Failed to send invites";
      toast({ title: "Error", description: message, variant: "destructive" });
    },
  });

  const hasAttachment = useMemo(() => attachmentName.trim().length > 0, [attachmentName]);
  const parsedInviteEmails = useMemo(
    () =>
      inviteEmails
        .split(/[,\s]+/)
        .map((value) => value.trim())
        .filter((value) => value.length > 0),
    [inviteEmails],
  );
  const canSubmitInvites = canInvite && parsedInviteEmails.length > 0 && !inviteMutation.isPending;

  const submitUpdate = (kind: CreateJobActivityPayload["kind"]) => {
    if (!note.trim() || !canCollaborate) return;
    const attachment = buildAttachment(attachmentName.trim(), attachmentUrl.trim());
    createActivity.mutate({
      note: note.trim(),
      kind,
      attachments: attachment ? [attachment] : undefined,
    });
  };

  const submitInvites = () => {
    if (!canSubmitInvites) return;
    inviteMutation.mutate({
      emails: parsedInviteEmails,
      message: inviteMessage.trim() ? inviteMessage.trim() : undefined,
    });
  };

  return (
    <Card className="border border-slate-200">
      <CardContent className="space-y-4 pt-4">
        <div className="space-y-2">
          <Label htmlFor={`invite-emails-${jobId}`}>Invite collaborators</Label>
          {!canInvite && disabledReason && (
            <p className="text-xs text-amber-600" role="status">
              {disabledReason}
            </p>
          )}
          <Input
            id={`invite-emails-${jobId}`}
            placeholder="Add emails separated by commas or spaces"
            value={inviteEmails}
            onChange={(event) => setInviteEmails(event.target.value)}
            disabled={!canInvite}
          />
          <Textarea
            id={`invite-message-${jobId}`}
            placeholder="Optional message"
            value={inviteMessage}
            onChange={(event) => setInviteMessage(event.target.value)}
            rows={2}
            disabled={!canInvite}
          />
          <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
            <span>{parsedInviteEmails.length} email(s) ready</span>
            <Button size="sm" onClick={submitInvites} disabled={!canSubmitInvites}>
              {inviteMutation.isPending ? "Sending..." : "Send invites"}
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`note-${jobId}`}>Comments & files</Label>
          {!canCollaborate && disabledReason && (
            <p className="text-xs text-amber-600" role="status">
              {disabledReason}
            </p>
          )}
          <Textarea
            id={`note-${jobId}`}
            placeholder="Add a status update or request"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={3}
            disabled={!canCollaborate}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label htmlFor={`attachment-name-${jobId}`}>Attachment name (optional)</Label>
              <Input
                id={`attachment-name-${jobId}`}
                value={attachmentName}
                onChange={(event) => setAttachmentName(event.target.value)}
                disabled={!canCollaborate}
              />
            </div>
            <div>
              <Label htmlFor={`attachment-url-${jobId}`}>Link</Label>
              <Input
                id={`attachment-url-${jobId}`}
                placeholder="https://..."
                value={attachmentUrl}
                onChange={(event) => setAttachmentUrl(event.target.value)}
                disabled={!canCollaborate}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => submitUpdate("collaboration_request")}
              disabled={!note.trim() || !canCollaborate || createActivity.isPending}
            >
              Request collaboration
            </Button>
            <Button
              size="sm"
              onClick={() => submitUpdate("comment")}
              disabled={!note.trim() || !canCollaborate || createActivity.isPending}
            >
              Post comment
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {isPending ? (
            <p className="text-sm text-slate-500">Loading activity...</p>
          ) : activity.length === 0 ? (
            <p className="text-sm text-slate-500">No activity yet.</p>
          ) : (
            activity.map((log: ActivityLog) => (
              <div key={log.id} className="border border-slate-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{log.action}</Badge>
                    <span className="text-sm text-slate-700">by {log.performedBy}</span>
                  </div>
                  <span className="text-xs text-slate-500">
                    {log.timestamp
                      ? formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })
                      : "Just now"}
                  </span>
                </div>
                {log.details?.note && (
                  <p className="text-sm text-slate-800 mt-2">{String(log.details.note)}</p>
                )}
                {Array.isArray(log.details?.attachments) && log.details.attachments.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {log.details.attachments.map((attachment) => (
                      <li key={`${log.id}-${attachment.name}`} className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-slate-800">{attachment.name}</span>
                        {attachment.url && (
                          <a
                            href={attachment.url}
                            className="text-blue-600 hover:underline"
                            target="_blank"
                            rel="noreferrer"
                          >
                            Open
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                {log.details?.from && log.details?.to && (
                  <p className="text-xs text-slate-500 mt-2">
                    Status changed from {String(log.details.from)} to {String(log.details.to)}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
        {hasAttachment && attachmentUrl.trim() === "" && (
          <p className="text-xs text-slate-500">
            Attachment name saved without a link. Include a URL to share a file or folder.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
