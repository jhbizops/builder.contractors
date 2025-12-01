import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit } from 'lucide-react';
import { Service } from '@/types';
import { useCollection } from '@/hooks/useCollection';
import { useGlobalization } from '@/contexts/GlobalizationContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const serviceSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  unit: z.string().min(1, 'Unit is required'),
  basePrice: z.number().min(0, 'Base price must be positive'),
  active: z.boolean(),
});

type ServiceFormData = z.infer<typeof serviceSchema>;

export const ServiceManagement: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const { data: services, loading, add, update } = useCollection<Service>('services');
  const { formatDualCurrency, settings } = useGlobalization();
  const measurementLabel = useMemo(() => {
    switch (settings.measurementSystem) {
      case 'metric':
        return 'Metric';
      case 'imperial':
        return 'Imperial';
      default:
        return 'US customary';
    }
  }, [settings.measurementSystem]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      active: true,
    },
  });

  const watchedActive = watch('active');

  const onSubmit = async (data: ServiceFormData) => {
    try {
      if (editingService) {
        await update(editingService.id, data);
      } else {
        await add(data);
      }
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving service:', error);
    }
  };

  const handleAddService = () => {
    setEditingService(null);
    reset({
      name: '',
      description: '',
      unit: '',
      basePrice: 0,
      active: true,
    });
    setIsDialogOpen(true);
  };

  const handleEditService = (service: Service) => {
    setEditingService(service);
    reset({
      name: service.name,
      description: service.description || '',
      unit: service.unit,
      basePrice: service.basePrice,
      active: service.active,
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingService(null);
    reset();
  };

  const getUnitLabel = (unit: string) => {
    switch (unit) {
      case 'sq_ft':
        return 'square foot (imperial)';
      case 'sq_m':
        return 'square meter (metric)';
      case 'hour':
        return 'hour';
      case 'day':
        return 'day';
      case 'linear_ft':
        return 'linear foot (imperial)';
      case 'linear_m':
        return 'linear meter (metric)';
      case 'project':
      default:
        return 'project';
    }
  };

  const formatPrice = (price: number, unit: string) => {
    const humanUnit = getUnitLabel(unit);
    return `${formatDualCurrency(price)} per ${humanUnit}`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Service Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Service Management</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Prices shown in {settings.currency} · {measurementLabel} units
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleAddService} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Service
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingService ? 'Edit Service' : 'Add New Service'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="name">Service Name</Label>
                  <Input
                    id="name"
                    {...register('name')}
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    {...register('description')}
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="unit">Unit</Label>
                  <Select onValueChange={(value) => setValue('unit', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="project">Project</SelectItem>
                      <SelectItem value="sq_ft">Square Foot</SelectItem>
                      <SelectItem value="sq_m">Square Meter</SelectItem>
                      <SelectItem value="hour">Hour</SelectItem>
                      <SelectItem value="day">Day</SelectItem>
                      <SelectItem value="linear_ft">Linear Foot</SelectItem>
                      <SelectItem value="linear_m">Linear Meter</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.unit && (
                    <p className="text-sm text-red-500 mt-1">{errors.unit.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="basePrice">Base Price</Label>
                  <Input
                    id="basePrice"
                    type="number"
                    step="0.01"
                    {...register('basePrice', { valueAsNumber: true })}
                    className={errors.basePrice ? 'border-red-500' : ''}
                  />
                  {errors.basePrice && (
                    <p className="text-sm text-red-500 mt-1">{errors.basePrice.message}</p>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={watchedActive}
                    onCheckedChange={(checked) => setValue('active', checked)}
                  />
                  <Label>Active</Label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <Button type="button" variant="outline" onClick={handleCloseDialog}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingService ? 'Update' : 'Create'} Service
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {services.length === 0 ? (
          <p className="text-slate-500 text-center py-4">No services configured</p>
        ) : (
          <div className="space-y-3">
            {services.map((service) => (
              <div key={service.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium text-slate-900">{service.name}</p>
                  <p className="text-sm text-slate-600">
                    Base: {formatPrice(service.basePrice, service.unit)}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={service.active ? 'default' : 'secondary'}>
                    {service.active ? 'Active' : 'Inactive'}
                  </Badge>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleEditService(service)}
                    className="text-slate-400 hover:text-primary p-1"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
