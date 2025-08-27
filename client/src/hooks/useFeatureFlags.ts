import { useQuery } from "@tanstack/react-query";

interface FeatureFlag {
  id: string;
  flagName: string;
  isGloballyEnabled: boolean;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export function useFeatureFlags() {
  const { data: flags, isLoading } = useQuery({
    queryKey: ["/api/admin/feature-flags"],
    retry: false,
  });

  const isFeatureEnabled = (flagName: string): boolean => {
    if (!flags || !Array.isArray(flags)) return false;
    const flag = flags.find((f: FeatureFlag) => f.flagName === flagName);
    return flag?.isGloballyEnabled || false;
  };

  return {
    flags: flags || [],
    isLoading,
    isFeatureEnabled,
  };
}