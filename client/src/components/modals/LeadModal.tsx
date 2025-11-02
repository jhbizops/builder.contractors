import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CloudUpload, Download, Trash2, FileText, User, Circle } from 'lucide-react';
import { Lead, LeadComment, ActivityLog, LeadFile } from '@/types';
import { useFirestore, useFirestoreQuery } from '@/hooks/useFirestore';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { useGlobalization } from '@/contexts/GlobalizationContext';

interface LeadModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (leadData: Partial<Lead>) => void;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function createFileId() {
  return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 10);
}

export const LeadModal: React.FC<LeadModalProps> = ({ lead, isOpen, onClose, onSave }) => {
  const [status, setStatus] = useState(lead?.status || 'new');
  const [comment, setComment] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { userData } = useAuth();
  const { formatDateTime } = useGlobalization();
  
  const { add: addComment } = useFirestore<LeadComment>('lead_comments');
  const { add: addLog } = useFirestore<ActivityLog>('activity_logs');
  const { data: comments } = useFirestoreQuery<LeadComment>('lead_comments',
    lead ? { leadId: lead.id } : undefined,
  );
  const { data: logs } = useFirestoreQuery<ActivityLog>('activity_logs',
    lead ? { leadId: lead.id } : undefined,
  );

  const handleStatusChange = async (newStatus: string) => {
    if (!lead || !userData) return;
    
    setStatus(newStatus as 'new' | 'in_progress' | 'completed' | 'on_hold');
    
    // Log the status change
    await addLog({
      leadId: lead.id,
      action: `Status changed from "${lead.status}" to "${newStatus}"`,
      performedBy: userData.email,
      timestamp: new Date(),
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !lead) return;

    setUploading(true);

    try {
      const uploadedFiles: LeadFile[] = await Promise.all(
        Array.from(files).map(async (file) => ({
          id: createFileId(),
          name: file.name,
          dataUrl: await readFileAsDataUrl(file),
          uploadedAt: new Date(),
        })),
      );

      const updatedFiles = [...lead.files, ...uploadedFiles];
      onSave({ files: updatedFiles });

      await addLog({
        leadId: lead.id,
        action: `${uploadedFiles.length} file(s) uploaded`,
        performedBy: userData?.email || 'Unknown',
        timestamp: new Date(),
      });

      toast({
        title: "Success",
        description: `${uploadedFiles.length} file(s) uploaded successfully`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to upload files",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleDeleteFile = async (file: LeadFile) => {
    if (!lead) return;

    try {
      const updatedFiles = lead.files.filter((item) => item.id !== file.id);
      onSave({ files: updatedFiles });

      await addLog({
        leadId: lead.id,
        action: `File deleted: "${file.name}"`,
        performedBy: userData?.email || 'Unknown',
        timestamp: new Date(),
      });

      toast({
        title: "Success",
        description: "File deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete file",
        variant: "destructive",
      });
    }
  };

  const handleAddComment = async () => {
    if (!comment.trim() || !lead || !userData) return;
    
    try {
      await addComment({
        leadId: lead.id,
        body: comment,
        author: userData.email,
        timestamp: new Date(),
      });
      
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

  const handleSave = () => {
    if (!lead) return;
    
    onSave({
      status,
      updatedBy: userData?.email || 'Unknown',
    });
    
    onClose();
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
              className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <CloudUpload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
              <p className="text-slate-600">
                Drag and drop files here, or <span className="text-primary font-medium">browse</span>
              </p>
              <p className="text-sm text-slate-500 mt-1">Supports: PDF, DOC, JPG, PNG (Max 10MB)</p>
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
                <div key={file.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-slate-50 rounded-lg gap-2">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-red-500" />
                    <div>
                      <span className="text-sm font-medium block">{file.name}</span>
                      <span className="text-xs text-slate-500">Uploaded {formatDateTime(file.uploadedAt)}</span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="sm" className="text-slate-400 hover:text-primary p-1" asChild>
                      <a href={file.dataUrl} download={file.name} target="_blank" rel="noreferrer">
                        <Download className="h-4 w-4" />
                      </a>
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
                    {formatDateTime(log.timestamp, {
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
