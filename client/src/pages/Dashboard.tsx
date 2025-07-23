import React from 'react';
import { Redirect } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { Navigation } from '@/components/Navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function Dashboard() {
  const { userData } = useAuth();

  // Redirect based on user role
  const getDefaultRoute = () => {
    if (!userData) return '/login';
    
    switch (userData.role) {
      case 'admin':
        return '/dashboard/admin';
      case 'sales':
        return '/dashboard/sales';
      case 'builder':
        return '/dashboard/builder';
      case 'dual':
        return '/dashboard/sales'; // Default to sales for dual users
      default:
        return '/dashboard/sales';
    }
  };

  return (
    <ProtectedRoute>
      <Redirect to={getDefaultRoute()} />
    </ProtectedRoute>
  );
}
