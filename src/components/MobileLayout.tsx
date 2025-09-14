import { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MobileLayoutProps {
  children: ReactNode;
  title: string;
  onBack?: () => void;
  showBack?: boolean;
  action?: ReactNode;
}

export function MobileLayout({ children, title, onBack, showBack = false, action }: MobileLayoutProps) {
  return (
    <div className="min-h-screen bg-background font-afacad">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-3">
            {showBack && onBack && (
              <Button variant="ghost" size="sm" onClick={onBack} className="p-0 h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <h1 className="text-lg font-semibold text-foreground truncate">{title}</h1>
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      </header>

      {/* Content */}
      <main className="pb-20">
        {children}
      </main>
    </div>
  );
}