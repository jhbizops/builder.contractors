import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '@/lib/firebase';
import { User } from '@/types';
import { toast } from '@/hooks/use-toast';
import {
  clearLocalAuthStore,
  isLocalAuthAvailable,
  loadLocalSession,
  loginLocalUser,
  logoutLocalUser,
  registerLocalUser,
} from '@/lib/localAuth';

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

const isLocalAuthEnabled = !isFirebaseConfigured && isLocalAuthAvailable;

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
    if (isFirebaseConfigured && auth) {
      try {
        await signInWithEmailAndPassword(auth, email, password);
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
      return;
    }

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

  const register = useCallback(async (email: string, password: string, role: string) => {
    if (isFirebaseConfigured && auth && db) {
      try {
        const { user } = await createUserWithEmailAndPassword(auth, email, password);

        const userProfile: Omit<User, 'id'> = {
          email,
          role: role as User['role'],
          approved: false,
          createdAt: new Date(),
        };

        await setDoc(doc(db, 'users', user.uid), userProfile);

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
      return;
    }

    if (!isLocalAuthEnabled) {
      toast({
        title: 'Authentication unavailable',
        description: 'Authentication services are not configured.',
        variant: 'destructive',
      });
      throw new Error('Authentication services are not configured.');
    }

    try {
      const user = await registerLocalUser(email, password, role as User['role']);
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
    if (isFirebaseConfigured && auth) {
      try {
        await signOut(auth);
        setUserData(null);
        toast({
          title: 'Success',
          description: 'Successfully signed out',
        });
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
        throw error;
      }
      return;
    }

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
    if (isFirebaseConfigured && auth && db) {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        setCurrentUser(user ? { id: user.uid, email: user.email ?? '' } : null);

        if (user) {
          try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
              const data = userDoc.data();
              setUserData({
                id: user.uid,
                email: data.email,
                role: data.role,
                approved: data.approved,
                createdAt: data.createdAt?.toDate() || new Date(),
              });
            }
          } catch (error) {
            console.error('Error fetching user data:', error);
          }
        } else {
          setUserData(null);
        }

        setLoading(false);
      });

      return unsubscribe;
    }

    if (isLocalAuthEnabled) {
      const sessionUser = loadLocalSession();
      if (sessionUser) {
        setCurrentUser({ id: sessionUser.id, email: sessionUser.email });
        setUserData(sessionUser);
      } else {
        clearLocalAuthStore();
      }
      setLoading(false);
      return () => undefined;
    }

    setLoading(false);
    return () => undefined;
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
