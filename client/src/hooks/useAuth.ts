import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false, // Don't retry auth failures
    staleTime: 300000, // Cache auth state for 5 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      try {
        const response = await fetch(`${window.location.origin}/api/auth/user`, {
          credentials: 'include', // Ensure cookies are sent
          cache: 'no-cache', // Prevent browser caching issues
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        if (response.status === 401) {
          return null; // Not authenticated, return null instead of throwing
        }
        if (!response.ok) {
          console.error('🔐 Auth request failed:', response.status);
          throw new Error("Failed to fetch user");
        }
        const userData = await response.json();
        return userData;
      } catch (error) {
        console.error('🔐 Auth check error:', error);
        return null;
      }
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
