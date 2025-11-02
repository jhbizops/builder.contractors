import { useEffect } from 'react';
import { Redirect } from 'wouter';

export default function ClearSession() {
  useEffect(() => {
    // Clear all authentication related items from localStorage
    localStorage.removeItem('bc_local_auth_session_v1');
    localStorage.removeItem('bc_local_auth_current_user');
    
    // Force reload to clear any cached data
    window.location.href = '/login';
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p>Clearing session...</p>
      </div>
    </div>
  );
}