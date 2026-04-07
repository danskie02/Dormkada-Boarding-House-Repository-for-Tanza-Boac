import { useGetCurrentUser } from "@workspace/api-client-react";

export function useAuth() {
  const { data: user, isLoading, error } = useGetCurrentUser({
    query: {
      retry: false,
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
