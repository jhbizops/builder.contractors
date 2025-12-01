import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useGlobalization } from '@/contexts/GlobalizationContext';

export const GlobalizationRoleSync: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userData } = useAuth();
  const { setUserRole } = useGlobalization();

  useEffect(() => {
    if (userData?.role) {
      setUserRole(userData.role);
    } else {
      setUserRole(null);
    }
  }, [userData?.role, setUserRole]);

  return <>{children}</>;
};
