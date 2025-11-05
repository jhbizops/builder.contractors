import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { User } from '@/types';
import { toast } from '@/hooks/use-toast';
import {
  clearLocalAuthStore,
  isLocalAuthAvailable,
  loadLocalSession,
  loginLocalUser,
  logoutLocalUser,
  registerLocalUser,
  type RegisterLocalUserOptions,
} from '@/lib/localAuth';
import { syncAllUsersToCollection, syncUserToCollection } from '@/lib/userCollectionSync';

type AuthenticatedUser = Pick<User, 'id' | 'email'>;

interface AuthContextType {
  currentUser: AuthenticatedUser | null;
  userData: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    role: string,
    options?: RegisterLocalUserOptions,
  ) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export { AuthContext };

const isLocalAuthEnabled = isLocalAuthAvailable;

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AuthenticatedUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const login = useCallback(async (email: string, password: string) => {
    if (!isLocalAuthEnabled) {
      toast({
        title: 'Authentication unavailable',
        description: 'Authentication services are not configured.',
        variant: 'destructive',
      });
      throw new Error('Authentication services are not configured.');
    }

    try {
      const user = await loginLocalUser(email, password);
      await syncUserToCollection(user);
      setCurrentUser({ id: user.id, email: user.email });
      setUserData(user);
      toast({
        title: 'Success',
        description: 'Successfully signed in',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  }, []);

  const register = useCallback(async (
    email: string,
    password: string,
    role: string,
    options?: RegisterLocalUserOptions,
  ) => {
    if (!isLocalAuthEnabled) {
      toast({
        title: 'Authentication unavailable',
        description: 'Authentication services are not configured.',
        variant: 'destructive',
      });
      throw new Error('Authentication services are not configured.');
    }

    try {
      const user = await registerLocalUser(email, password, role as User['role'], options);
      await syncUserToCollection(user);
      setCurrentUser({ id: user.id, email: user.email });
      setUserData(user);
      toast({
        title: 'Success',
        description: 'Account created successfully. Waiting for admin approval.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    if (!isLocalAuthEnabled) {
      toast({
        title: 'Authentication unavailable',
        description: 'Authentication services are not configured.',
        variant: 'destructive',
      });
      throw new Error('Authentication services are not configured.');
    }

    logoutLocalUser();
    setCurrentUser(null);
    setUserData(null);
    toast({
      title: 'Success',
      description: 'Successfully signed out',
    });
  }, []);

  useEffect(() => {
    if (!isLocalAuthEnabled) {
      setLoading(false);
      return () => undefined;
    }

    let active = true;

    (async () => {
      try {
        await syncAllUsersToCollection();
      } catch (error) {
        console.error('Failed to synchronise users collection', error);
      }

      if (!active) {
        return;
      }

      const sessionUser = loadLocalSession();
      if (sessionUser) {
        setCurrentUser({ id: sessionUser.id, email: sessionUser.email });
        setUserData(sessionUser);
        try {
          await syncUserToCollection(sessionUser);
        } catch (error) {
          console.error('Failed to sync session user to collection', error);
        }
      } else {
        clearLocalAuthStore();
      }

      if (active) {
        setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      currentUser,
      userData,
      loading,
      login,
      register,
      logout,
    }),
    [currentUser, loading, logout, login, register, userData],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
