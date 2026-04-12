import { useGetCurrentUser } from "@workspace/api-client-react";

export function useAuth() {
  const { data: user, isLoading, error } = useGetCurrentUser({
    query: {
      retry: 2,
      staleTime: 1000 * 60 * 60, // 1 hour
      gcTime: 1000 * 60 * 60 * 24, // 24 hours  
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    }
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    role: user?.role,
    error
  };
}
