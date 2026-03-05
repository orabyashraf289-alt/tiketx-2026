import { useLanguage, Language } from '@/i18n';
import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface Props {
  size?: 'default' | 'icon';
  variant?: 'ghost' | 'outline';
}

export function LanguageSwitcher({ size = 'icon', variant = 'ghost' }: Props) {
  const { lang, setLanguage, t } = useLanguage();

  const toggle = () => {
    const next: Language = lang === 'ar' ? 'en' : 'ar';
    setLanguage(next);
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={variant}
          size={size}
          onClick={toggle}
          className="gap-1.5 text-xs"
        >
          <Globe className="h-4 w-4" />
          {size !== 'icon' && (lang === 'ar' ? 'EN' : 'عربي')}
          {size === 'icon' && <span className="sr-only">{t.language.switchLanguage}</span>}
        </Button>
      </TooltipTrigger>
      <TooltipContent side={lang === 'ar' ? 'left' : 'right'}>
        {lang === 'ar' ? 'Switch to English' : 'التبديل للعربية'}
      </TooltipContent>
    </Tooltip>
  );
}
