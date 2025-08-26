import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
    gcTime: 1000 * 60 * 10, // Keep in cache for 10 minutes
    queryFn: async () => {
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
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user && !error,
  };
}
