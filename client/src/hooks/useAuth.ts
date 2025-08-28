import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    staleTime: 0, // Always fetch fresh data
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const response = await fetch("/api/auth/user", {
        credentials: 'include' // Ensure cookies are sent
      });
      if (response.status === 401) {
        return null; // Not authenticated, return null instead of throwing
      }
      if (!response.ok) {
        throw new Error("Failed to fetch user");
      }
      return response.json();
    },
  });

  // Explicitly handle the loading state and null user
  const isAuthenticated = !isLoading && !!user && !error;
  
  return {
    user,
    isLoading,
    isAuthenticated,
  };
}
