import React, { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Edit, Trash2, User, Calendar, Paperclip } from 'lucide-react';
import { Lead } from '@/types';
import { useGlobalization } from '@/contexts/GlobalizationContext';

interface LeadCardProps {
  lead: Lead;
  onView: (lead: Lead) => void;
  onEdit: (lead: Lead) => void;
  onDelete: (id: string) => void;
}

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'new':
      return 'bg-blue-100 text-blue-800';
    case 'in_progress':
      return 'bg-yellow-100 text-yellow-800';
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'on_hold':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const getStatusLabel = (status: string) => {
  switch (status) {
    case 'new':
      return 'New';
    case 'in_progress':
      return 'In Progress';
    case 'completed':
      return 'Completed';
    case 'on_hold':
      return 'On Hold';
    default:
      return status;
  }
};

export const LeadCard = memo<LeadCardProps>(function LeadCard({ lead, onView, onEdit, onDelete }) {
  const { formatDateTime } = useGlobalization();

  return (
    <Card className="border border-slate-200 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h4 className="font-medium text-slate-900">{lead.clientName}</h4>
            {lead.location && (
              <p className="text-sm text-slate-600">{lead.location}</p>
            )}
          </div>
          <Badge className={getStatusColor(lead.status)}>
            {getStatusLabel(lead.status)}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm text-slate-500">
            <span className="flex items-center">
              <User className="h-3 w-3 mr-1" />
              {lead.createdBy}
            </span>
            <span className="flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              {formatDateTime(lead.createdAt, { month: 'short', day: 'numeric' })}
            </span>
            <span className="flex items-center">
              <Paperclip className="h-3 w-3 mr-1" />
              {lead.files.length} files
            </span>
          </div>
          
          <div className="flex space-x-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onView(lead)}
              className="text-slate-400 hover:text-primary p-1"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onEdit(lead)}
              className="text-slate-400 hover:text-primary p-1"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onDelete(lead.id)}
              className="text-slate-400 hover:text-red-500 p-1"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
