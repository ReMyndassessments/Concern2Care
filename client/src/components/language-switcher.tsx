import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface LanguageSwitcherProps {
  className?: string;
}

export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const { i18n, t } = useTranslation();
  
  // Check if Chinese localization feature is enabled
  const { data: enabledFlags = [] } = useQuery({
    queryKey: ['/api/feature-flags/enabled'],
    queryFn: async () => {
      try {
        const response = await apiRequest('/api/feature-flags/enabled');
        return response.flags || [];
      } catch (error) {
        console.error('Error fetching feature flags:', error);
        return [];
      }
    },
    retry: false,
    refetchOnWindowFocus: false,
  });

  const isChineseEnabled = enabledFlags.some((flag: any) => 
    flag.flagName === 'chinese_localization' && flag.isGloballyEnabled
  );

  // Don't render if Chinese localization is not enabled
  if (!isChineseEnabled) {
    return null;
  }

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const currentLanguage = i18n.language;

  return (
    <Button 
      variant="outline" 
      size="sm" 
      className={`gap-2 ${className}`}
      onClick={() => changeLanguage(currentLanguage === 'zh' ? 'en' : 'zh')}
      data-testid="button-language-switcher"
      title={currentLanguage === 'zh' ? 'Switch to English' : 'Switch to Chinese'}
    >
      <Globe className="h-4 w-4" />
      <span className="hidden sm:inline">
        {currentLanguage === 'zh' ? '中文' : 'EN'}
      </span>
    </Button>
  );
}