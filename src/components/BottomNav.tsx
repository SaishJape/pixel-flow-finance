import { Home, CreditCard, PlusCircle, History, Settings } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: CreditCard, label: 'Accounts', path: '/accounts' },
  { icon: PlusCircle, label: 'Add', path: '/ai-transaction' },
  { icon: History, label: 'History', path: '/history' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg">
      <div className="grid grid-cols-5 h-16 px-1">
        {navItems.map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 text-xs transition-all duration-200 ease-in-out",
                "hover:scale-105 active:scale-95",
                isActive 
                  ? "text-blue-600 dark:text-blue-400" 
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              )}
            >
              {/* Active background indicator */}
              {isActive && (
                <div className="absolute inset-0 bg-blue-50 dark:bg-blue-900/20 rounded-lg mx-1" />
              )}
              
              {/* Icon with enhanced styling */}
              <div className={cn(
                "relative flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200",
                isActive && "bg-blue-100 dark:bg-blue-800/30"
              )}>
                <Icon className={cn(
                  "h-5 w-5 transition-all duration-200",
                  isActive && "fill-current scale-110"
                )} />
              </div>
              
              {/* Label */}
              <span className={cn(
                "font-medium transition-all duration-200",
                isActive && "font-semibold"
              )}>
                {label}
              </span>
              
              {/* Active indicator dot */}
              {isActive && (
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-600 dark:bg-blue-400 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}