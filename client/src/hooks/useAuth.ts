import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: 3, // Retry failed requests
    staleTime: 30000, // Cache for 30 seconds to prevent rapid re-fetching
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      console.log('🔐 Checking authentication...');
      const response = await fetch("/api/auth/user", {
        credentials: 'include', // Ensure cookies are sent
        cache: 'no-cache' // Prevent browser caching issues
      });
      console.log('🔐 Auth response status:', response.status);
      if (response.status === 401) {
        console.log('🔐 Not authenticated');
        return null; // Not authenticated, return null instead of throwing
      }
      if (!response.ok) {
        console.error('🔐 Auth request failed:', response.status);
        throw new Error("Failed to fetch user");
      }
      const userData = await response.json();
      console.log('🔐 Authentication successful:', userData.email);
      return userData;
    },
  });

  // Explicitly handle the loading state and null user
  const isAuthenticated = !isLoading && !!user && !error;
  
  console.log('🔐 Auth state:', { isLoading, isAuthenticated, hasUser: !!user, hasError: !!error });
  
  return {
    user,
    isLoading,
    isAuthenticated,
  };
}
