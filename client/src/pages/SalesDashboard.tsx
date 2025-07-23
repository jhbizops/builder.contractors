import React, { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LeadCard } from '@/components/LeadCard';
import { LeadModal } from '@/components/modals/LeadModal';
import { Plus, Download, Filter, Users, Handshake, Clock, TrendingUp } from 'lucide-react';
import { Lead } from '@/types';
import { useFirestore } from '@/hooks/useFirestore';
import { useAuth } from '@/contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const leadSchema = z.object({
  clientName: z.string().min(1, 'Client name is required'),
  location: z.string().optional(),
  status: z.string().default('new'),
});

type LeadFormData = z.infer<typeof leadSchema>;

export default function SalesDashboard() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { userData } = useAuth();
  const { data: leads, loading, add, update, remove } = useFirestore<Lead>('leads');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
  });

  const filteredLeads = leads.filter(lead => {
    if (statusFilter === 'all') return true;
    return lead.status === statusFilter;
  });

  const stats = {
    totalLeads: leads.length,
    activeLeads: leads.filter(l => l.status === 'in_progress').length,
    completedLeads: leads.filter(l => l.status === 'completed').length,
    newLeads: leads.filter(l => l.status === 'new').length,
  };

  const onSubmit = async (data: LeadFormData) => {
    if (!userData) return;
    
    try {
      await add({
        ...data,
        status: data.status as 'new' | 'in_progress' | 'completed' | 'on_hold',
        partnerId: userData.id,
        createdBy: userData.email,
        notes: [],
        files: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      setIsAddDialogOpen(false);
      reset();
    } catch (error) {
      console.error('Error creating lead:', error);
    }
  };

  const handleViewLead = (lead: Lead) => {
    setSelectedLead(lead);
  };

  const handleEditLead = (lead: Lead) => {
    setSelectedLead(lead);
  };

  const handleDeleteLead = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this lead?')) {
      try {
        await remove(id);
      } catch (error) {
        console.error('Error deleting lead:', error);
      }
    }
  };

  const handleSaveLead = async (leadData: Partial<Lead>) => {
    if (!selectedLead) return;
    
    try {
      await update(selectedLead.id, leadData);
      setSelectedLead(null);
    } catch (error) {
      console.error('Error updating lead:', error);
    }
  };

  return (
    <ProtectedRoute requiredRole={['sales', 'dual']}>
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Dashboard Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Sales Dashboard</h2>
                <p className="text-slate-600 mt-1">Manage your leads and track sales progress</p>
              </div>
              <div className="flex space-x-3">
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add New Lead
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Lead</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                      <div>
                        <Label htmlFor="clientName">Client Name</Label>
                        <Input
                          id="clientName"
                          {...register('clientName')}
                          className={errors.clientName ? 'border-red-500' : ''}
                        />
                        {errors.clientName && (
                          <p className="text-sm text-red-500 mt-1">{errors.clientName.message}</p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          {...register('location')}
                          placeholder="City, State"
                        />
                      </div>

                      <div className="flex justify-end space-x-3 pt-4">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsAddDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit">Create Lead</Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
                
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
              </div>
            </div>
          </div>

          {/* Dashboard Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-primary/10 rounded-md flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-slate-600">Total Leads</p>
                    <p className="text-2xl font-bold text-slate-900">{stats.totalLeads}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-100 rounded-md flex items-center justify-center">
                      <Handshake className="h-5 w-5 text-yellow-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-slate-600">Active Leads</p>
                    <p className="text-2xl font-bold text-slate-900">{stats.activeLeads}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-slate-600">Completed</p>
                    <p className="text-2xl font-bold text-slate-900">{stats.completedLeads}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                      <Clock className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-slate-600">New Leads</p>
                    <p className="text-2xl font-bold text-slate-900">{stats.newLeads}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Lead Management */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Recent Leads</CardTitle>
                <div className="flex space-x-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="on_hold">On Hold</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="sm">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : filteredLeads.length === 0 ? (
                <p className="text-slate-500 text-center py-8">No leads found</p>
              ) : (
                <div className="space-y-4">
                  {filteredLeads.map((lead) => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      onView={handleViewLead}
                      onEdit={handleEditLead}
                      onDelete={handleDeleteLead}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Lead Detail Modal */}
        <LeadModal
          lead={selectedLead}
          isOpen={!!selectedLead}
          onClose={() => setSelectedLead(null)}
          onSave={handleSaveLead}
        />
      </div>
    </ProtectedRoute>
  );
}
