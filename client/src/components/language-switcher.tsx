import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';

interface LanguageSwitcherProps {
  className?: string;
}

export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const { i18n, t } = useTranslation();
  const { isFeatureEnabled } = useFeatureFlags();
  
  // Check if Chinese localization feature is enabled
  const isChineseEnabled = isFeatureEnabled('chinese_localization');

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