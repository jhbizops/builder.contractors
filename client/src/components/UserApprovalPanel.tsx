import React, { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import type { User } from "@/types";
import { toast } from "@/hooks/use-toast";
import { USERS_QUERY_KEY, fetchUsers, updateUserApproval } from "@/api/users";

export const UserApprovalPanel: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: users, isLoading } = useQuery({
    queryKey: USERS_QUERY_KEY,
    queryFn: fetchUsers,
  });

  const mutation = useMutation({
    mutationFn: ({ id, approved }: { id: string; approved: boolean }) =>
      updateUserApproval(id, approved),
    onSuccess: (updatedUser) => {
      queryClient.setQueryData<User[] | undefined>(USERS_QUERY_KEY, (existing) => {
        if (!existing) {
          return [updatedUser];
        }

        return existing.map((user) => (user.id === updatedUser.id ? updatedUser : user));
      });
    },
  });

  const pendingUsers = useMemo(() => {
    return (users ?? []).filter((user) => !user.approved);
  }, [users]);

  const handleApproval = async (userId: string, approved: boolean) => {
    try {
      const user = await mutation.mutateAsync({ id: userId, approved });
      toast({
        title: "User updated",
        description: approved
          ? `${user.email} has been approved.`
          : `${user.email} has been marked as pending approval.`,
      });
    } catch (error) {
      const description =
        error instanceof Error ? error.message : "Failed to update user approval status.";
      toast({
        title: "Error",
        description,
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
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
              <div
                key={user.id}
                className="flex items-center justify-between p-3 border border-slate-200 rounded-lg"
              >
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
                    disabled={mutation.isPending}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleApproval(user.id, false)}
                    disabled={mutation.isPending}
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
