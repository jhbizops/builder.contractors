import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CloudUpload, Download, Trash2, FileText, User, Circle, Eye } from 'lucide-react';
import { Lead, LeadFile } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { useGlobalization } from '@/contexts/GlobalizationContext';
import { addLeadActivity, addLeadComment, fetchLeadActivity, fetchLeadComments, leadsQueryKey } from '@/api/leads';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  isPreviewableImage,
  isPreviewablePdf,
  MAX_FILE_SIZE_BYTES,
  readFileAsLeadFile,
  scanFileForThreats,
} from '@/lib/fileUpload';

interface LeadModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (leadData: Partial<Lead>) => Promise<void>;
}

const LeadModal: React.FC<LeadModalProps> = ({ lead, isOpen, onClose, onSave }) => {
  const [status, setStatus] = useState(lead?.status || 'new');
  const [comment, setComment] = useState('');
  const [uploading, setUploading] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [previewFile, setPreviewFile] = useState<LeadFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { userData } = useAuth();
  const { formatDateTime } = useGlobalization();
  const queryClient = useQueryClient();
  const commentsQueryKey = lead ? [...leadsQueryKey, lead.id, 'comments'] : leadsQueryKey;
  const activityQueryKey = lead ? [...leadsQueryKey, lead.id, 'activity'] : leadsQueryKey;

  const { data: comments = [] } = useQuery({
    enabled: Boolean(lead),
    queryKey: commentsQueryKey,
    queryFn: () => fetchLeadComments(lead!.id),
  });

  const { data: logs = [] } = useQuery({
    enabled: Boolean(lead),
    queryKey: activityQueryKey,
    queryFn: () => fetchLeadActivity(lead!.id),
  });

  const addCommentMutation = useMutation({
    mutationFn: ({ leadId, body }: { leadId: string; body: string }) => addLeadComment(leadId, body),
    onMutate: async ({ leadId, body }) => {
      await queryClient.cancelQueries({ queryKey: commentsQueryKey });
      const previous = queryClient.getQueryData<typeof comments>(commentsQueryKey) ?? [];
      const optimistic = {
        id: `temp_comment_${crypto.randomUUID()}`,
        leadId,
        body,
        author: userData?.email ?? 'You',
        timestamp: new Date(),
      };
      queryClient.setQueryData(commentsQueryKey, [...previous, optimistic]);
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(commentsQueryKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: commentsQueryKey });
    },
  });

  const addActivityMutation = useMutation({
    mutationFn: ({ leadId, action, details }: { leadId: string; action: string; details?: Record<string, unknown> }) =>
      addLeadActivity(leadId, action, details ?? {}),
    onMutate: async ({ leadId, action }) => {
      await queryClient.cancelQueries({ queryKey: activityQueryKey });
      const previous = queryClient.getQueryData<typeof logs>(activityQueryKey) ?? [];
      const optimistic = {
        id: `temp_activity_${crypto.randomUUID()}`,
        leadId,
        jobId: null,
        action,
        performedBy: userData?.email ?? 'You',
        details: {},
        timestamp: new Date(),
      };
      queryClient.setQueryData(activityQueryKey, [...previous, optimistic]);
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(activityQueryKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: activityQueryKey });
    },
  });

  const handleStatusChange = async (newStatus: string) => {
    if (!lead || !userData) return;
    
    setStatus(newStatus as 'new' | 'in_progress' | 'completed' | 'on_hold');
    
    // Log the status change
    await addActivityMutation.mutateAsync({
      leadId: lead.id,
      action: `Status changed from "${lead.status}" to "${newStatus}"`,
    });
  };

  const handleFiles = async (fileList: FileList | File[]) => {
    if (!lead) return;

    const incomingFiles = Array.from(fileList);
    if (!incomingFiles.length) return;

    setUploading(true);

    try {
      const safeFiles: File[] = [];

      for (const file of incomingFiles) {
        const scanResult = await scanFileForThreats(file);

        if (scanResult.status === 'blocked') {
          toast({
            title: 'Upload blocked',
            description: scanResult.reason || 'File failed virus scan',
            variant: 'destructive',
          });
          continue;
        }

        safeFiles.push(file);
      }

      if (!safeFiles.length) {
        return;
      }

      const uploadedFiles = await Promise.all(safeFiles.map(readFileAsLeadFile));
      const updatedFiles = [...lead.files, ...uploadedFiles];

      await onSave({ files: updatedFiles, updatedAt: new Date(), updatedBy: userData?.email || 'Unknown' });

      await addActivityMutation.mutateAsync({
        leadId: lead.id,
        action: `${uploadedFiles.length} file(s) uploaded`,
      });

      toast({
        title: 'Success',
        description: `${uploadedFiles.length} file(s) uploaded successfully`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload files',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    await handleFiles(files);
  };

  const handleFileDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingFile(false);

    if (!event.dataTransfer.files.length) return;

    await handleFiles(event.dataTransfer.files);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingFile(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingFile(false);
  };

  const handleDeleteFile = async (file: LeadFile) => {
    if (!lead) return;

    try {
      const updatedFiles = lead.files.filter((existingFile) => existingFile.id !== file.id);
      await onSave({ files: updatedFiles, updatedAt: new Date(), updatedBy: userData?.email || 'Unknown' });

      await addActivityMutation.mutateAsync({
        leadId: lead.id,
        action: `File deleted: "${file.name}"`,
      });

      toast({
        title: 'Success',
        description: 'File deleted successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete file',
        variant: 'destructive',
      });
    }
  };

  const handleAddComment = async () => {
    if (!comment.trim() || !lead || !userData) return;
    
    try {
      await addCommentMutation.mutateAsync({ leadId: lead.id, body: comment });

      setComment('');
      toast({
        title: "Success",
        description: "Comment added successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    if (!lead) return;

    try {
      await onSave({
        status,
        updatedBy: userData?.email || 'Unknown',
        updatedAt: new Date(),
      });
      onClose();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update lead',
        variant: 'destructive',
      });
    }
  };

  const handleDownloadFile = (file: LeadFile) => {
    if (typeof window === 'undefined') {
      return;
    }

    const link = document.createElement('a');
    link.href = file.dataUrl;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatFileSize = (size: number) => {
    if (size >= 1024 * 1024) {
      return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    }
    if (size >= 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    }
    return `${size} B`;
  };

  if (!lead) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {lead.clientName}
          </DialogTitle>
          {lead.location && (
            <p className="text-slate-600">{lead.location}</p>
          )}
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Status Update Section */}
          <div>
            <Label htmlFor="status" className="text-sm font-medium text-slate-700 mb-2 block">
              Status
            </Label>
            <Select value={status} onValueChange={handleStatusChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* File Upload Section */}
          <div>
            <Label className="text-sm font-medium text-slate-700 mb-2 block">Files</Label>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                isDraggingFile ? 'border-primary bg-primary/5' : 'border-slate-300 hover:border-primary'
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleFileDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              role="button"
              tabIndex={0}
              aria-label="Upload files"
              aria-busy={uploading}
              data-testid="file-dropzone"
            >
              <CloudUpload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
              <p className="text-slate-600">
                Drag and drop files here, or <span className="text-primary font-medium">browse</span>
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Supports: PDF, DOC, JPG, PNG (Max {(MAX_FILE_SIZE_BYTES / (1024 * 1024)).toFixed(0)}MB)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {/* Existing Files */}
            {lead.files.length > 0 && (
              <div className="mt-4 space-y-2">
                {lead.files.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-red-500" />
                      <div>
                        <span className="block text-sm font-medium text-slate-900">{file.name}</span>
                        <span className="block text-xs text-slate-500">
                          {formatFileSize(file.size)} ·
                          {' '}
                          {formatDateTime(file.uploadedAt, {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPreviewFile(file)}
                        className="text-slate-400 hover:text-primary p-1"
                        aria-label={`Preview ${file.name}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownloadFile(file)}
                        className="text-slate-400 hover:text-primary p-1"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteFile(file)}
                        className="text-slate-400 hover:text-red-500 p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
              ))}
            </div>
          )}

          {previewFile && (
            <div className="mt-4" data-testid="file-preview">
              <Label className="text-sm font-medium text-slate-700 mb-2 block">File preview</Label>
              <Card className="border border-slate-200">
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{previewFile.name}</p>
                      <p className="text-xs text-slate-500">{formatFileSize(previewFile.size)}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setPreviewFile(null)}>
                      Close
                    </Button>
                  </div>
                  {isPreviewableImage(previewFile.mimeType) && (
                    <img
                      src={previewFile.dataUrl}
                      alt={`Preview of ${previewFile.name}`}
                      className="max-h-72 w-full object-contain rounded"
                    />
                  )}
                  {isPreviewablePdf(previewFile.mimeType) && (
                    <iframe
                      src={previewFile.dataUrl}
                      title={`Preview of ${previewFile.name}`}
                      className="w-full h-72 rounded border border-slate-200"
                    />
                  )}
                  {!isPreviewableImage(previewFile.mimeType) &&
                    !isPreviewablePdf(previewFile.mimeType) && (
                      <p className="text-sm text-slate-600">Preview not available for this file type.</p>
                    )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>

          {/* Comments Section */}
          <div>
            <Label className="text-sm font-medium text-slate-700 mb-4 block">
              Comments & Updates
            </Label>

            {/* Add Comment */}
            <div className="mb-4">
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment..."
                rows={3}
                className="mb-2"
              />
              <div className="flex justify-end">
                <Button onClick={handleAddComment} disabled={!comment.trim()}>
                  Post Comment
                </Button>
              </div>
            </div>

            {/* Comments List */}
            <div className="space-y-4">
              {comments.map((comment) => (
                <Card key={comment.id} className="border border-slate-200">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-sm font-medium text-slate-900">
                          {comment.author}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500">
                        {formatDateTime(comment.timestamp, {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-slate-700 text-sm">{comment.body}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Activity Log */}
          <div>
            <Label className="text-sm font-medium text-slate-700 mb-4 block">
              Activity Log
            </Label>
            <div className="space-y-2">
              {logs.map((log) => (
                <div key={log.id} className="flex items-center space-x-3 text-sm text-slate-600">
                  <Circle className="h-2 w-2 text-primary fill-current" />
                  <span>{log.action}</span>
                  <span className="text-slate-400">by</span>
                  <span>{log.performedBy}</span>
                  <span className="text-slate-400">
                    {formatDateTime(log.timestamp ?? new Date(), {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export { LeadModal };
export default LeadModal;
