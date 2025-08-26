import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
    gcTime: 1000 * 60 * 10, // Keep in cache for 10 minutes
    refetchOnMount: false, // Don't refetch on every mount
    refetchOnWindowFocus: false, // Don't refetch on window focus
    queryFn: async () => {
      try {
        const response = await fetch("/api/auth/user", {
          credentials: 'same-origin' // Ensure session cookies are sent
        });
        if (response.status === 401) {
          return null; // Not authenticated, return null instead of throwing
        }
        if (!response.ok) {
          throw new Error("Failed to fetch user");
        }
        return response.json();
      } catch (err) {
        // If there's a network error, assume not authenticated
        console.log("Auth check failed:", err);
        return null;
      }
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user && !error,
  };
}
