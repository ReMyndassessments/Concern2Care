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
  const { data: response, isLoading } = useQuery({
    queryKey: ["/api/feature-flags/enabled"],
    retry: false,
  });

  const flags = (response as any)?.flags || [];

  const isFeatureEnabled = (flagName: string): boolean => {
    if (!Array.isArray(flags)) return false;
    const flag = flags.find((f: FeatureFlag) => f.flagName === flagName);
    return flag?.isGloballyEnabled || false;
  };

  return {
    flags,
    isLoading,
    isFeatureEnabled,
  };
}