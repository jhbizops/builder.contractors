import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
} from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { User } from "@/types";
import { toast } from "@/hooks/use-toast";
import {
  fetchCurrentUser,
  loginUser as loginRequest,
  logoutUser as logoutRequest,
  registerUser as registerRequest,
  type RegisterPayload,
} from "@/api/auth";

const SESSION_QUERY_KEY = ["/api/auth/me"] as const;

type AuthenticatedUser = Pick<User, "id" | "email">;

type RegisterOptions = Pick<RegisterPayload, "country" | "region" | "locale" | "currency" | "languages">;

interface AuthContextType {
  currentUser: AuthenticatedUser | null;
  userData: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    role: User["role"],
    options?: RegisterOptions,
  ) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export { AuthContext };

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "An unexpected error occurred.";
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const { data: sessionUser, isLoading } = useQuery({
    queryKey: SESSION_QUERY_KEY,
    queryFn: fetchCurrentUser,
    staleTime: Infinity,
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: loginRequest,
  });

  const registerMutation = useMutation({
    mutationFn: registerRequest,
  });

  const logoutMutation = useMutation({
    mutationFn: logoutRequest,
  });

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const user = await loginMutation.mutateAsync({ email, password });
        queryClient.setQueryData(SESSION_QUERY_KEY, user);
        toast({
          title: "Success",
          description: "Successfully signed in",
        });
      } catch (error) {
        const message = extractErrorMessage(error);
        toast({
          title: "Error",
          description: message,
          variant: "destructive",
        });
        throw error;
      }
    },
    [loginMutation, queryClient],
  );

  const register = useCallback(
    async (email: string, password: string, role: User["role"], options?: RegisterOptions) => {
      const payload: RegisterPayload = {
        email,
        password,
        role,
        country: options?.country,
        region: options?.region,
        locale: options?.locale,
        currency: options?.currency,
        languages: options?.languages,
      };

      try {
        const user = await registerMutation.mutateAsync(payload);
        queryClient.setQueryData(SESSION_QUERY_KEY, user);
        toast({
          title: "Success",
          description: "Account created successfully. Waiting for admin approval.",
        });
      } catch (error) {
        const message = extractErrorMessage(error);
        toast({
          title: "Error",
          description: message,
          variant: "destructive",
        });
        throw error;
      }
    },
    [queryClient, registerMutation],
  );

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
      queryClient.setQueryData(SESSION_QUERY_KEY, null);
      toast({
        title: "Success",
        description: "Successfully signed out",
      });
    } catch (error) {
      const message = extractErrorMessage(error);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      throw error;
    }
  }, [logoutMutation, queryClient]);

  const currentUser = useMemo<AuthenticatedUser | null>(() => {
    if (!sessionUser) {
      return null;
    }
    return { id: sessionUser.id, email: sessionUser.email };
  }, [sessionUser]);

  const value = useMemo<AuthContextType>(
    () => ({
      currentUser,
      userData: sessionUser ?? null,
      loading: isLoading,
      login,
      register,
      logout,
    }),
    [currentUser, isLoading, login, logout, register, sessionUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
