import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { User } from '@/types';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

type AuthenticatedUser = Pick<User, 'id' | 'email'>;

interface AuthContextType {
  currentUser: AuthenticatedUser | null;
  userData: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, role: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export { AuthContext };

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface RawUser {
  id: string;
  email: string;
  role: User['role'];
  country: string | null;
  region: string | null;
  approved: boolean;
  createdAt: string;
}

function parseUser(raw: RawUser): User {
  return {
    id: raw.id,
    email: raw.email,
    role: raw.role,
    country: raw.country ?? undefined,
    region: raw.region ?? undefined,
    approved: raw.approved,
    createdAt: new Date(raw.createdAt),
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AuthenticatedUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const res = await apiRequest('POST', '/api/auth/login', { email, password });
        const data = (await res.json()) as RawUser;
        const user = parseUser(data);
        setCurrentUser({ id: user.id, email: user.email });
        setUserData(user);
        await queryClient.invalidateQueries();
        toast({
          title: 'Success',
          description: 'Successfully signed in',
        });
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to sign in',
          variant: 'destructive',
        });
        throw error;
      }
    },
    [queryClient],
  );

  const register = useCallback(
    async (email: string, password: string, role: string) => {
      try {
        const res = await apiRequest('POST', '/api/auth/register', {
          email,
          password,
          role,
        });
        const data = (await res.json()) as RawUser;
        const user = parseUser(data);
        setCurrentUser({ id: user.id, email: user.email });
        setUserData(user);
        await queryClient.invalidateQueries();
        toast({
          title: 'Success',
          description: 'Account created successfully. Waiting for admin approval.',
        });
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to register account',
          variant: 'destructive',
        });
        throw error;
      }
    },
    [queryClient],
  );

  const logout = useCallback(async () => {
    try {
      await apiRequest('POST', '/api/auth/logout');
      setCurrentUser(null);
      setUserData(null);
      queryClient.clear();
      toast({
        title: 'Success',
        description: 'Successfully signed out',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to sign out',
        variant: 'destructive',
      });
      throw error;
    }
  }, [queryClient]);

  useEffect(() => {
    let active = true;

    const fetchSession = async () => {
      try {
        const res = await fetch('/api/auth/session', { credentials: 'include' });
        if (!res.ok) {
          return;
        }

        const data = (await res.json()) as RawUser;
        if (!active) {
          return;
        }

        const user = parseUser(data);
        setCurrentUser({ id: user.id, email: user.email });
        setUserData(user);
      } catch (error) {
        console.error('Failed to load session', error);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchSession();

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
    [currentUser, userData, loading, login, register, logout],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
