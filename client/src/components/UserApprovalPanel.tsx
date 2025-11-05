import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import { User } from '@/types';
import { useCollectionQuery } from '@/hooks/useCollection';
import { toast } from '@/hooks/use-toast';
import { updateUserApprovalAndSync } from '@/lib/userCollectionSync';

export const UserApprovalPanel: React.FC = () => {
  const { data: pendingUsers, loading } = useCollectionQuery<User>('users', (user) => !user.approved);

  const handleApproval = async (userId: string, approved: boolean) => {
    try {
      await updateUserApprovalAndSync(userId, approved);
      toast({
        title: 'User updated',
        description: approved
          ? 'The user has been approved successfully.'
          : 'The user has been marked as pending approval.',
      });
    } catch (error) {
      console.error('Error updating user approval:', error);
      const description =
        error instanceof Error ? error.message : 'Failed to update user approval status.';
      toast({
        title: 'Error',
        description,
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending User Approvals</CardTitle>
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
        <CardTitle>Pending User Approvals</CardTitle>
      </CardHeader>
      <CardContent>
        {pendingUsers.length === 0 ? (
          <p className="text-slate-500 text-center py-4">No pending approvals</p>
        ) : (
          <div className="space-y-4">
            {pendingUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                <div>
                  <p className="font-medium text-slate-900">{user.email}</p>
                  <p className="text-sm text-slate-600">
                    Role: <span className="font-medium capitalize">{user.role}</span>
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    onClick={() => handleApproval(user.id, true)}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleApproval(user.id, false)}
                  >
                    <X className="h-4 w-4" />
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
