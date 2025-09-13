import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '@/components/MobileLayout';
import { BottomNav } from '@/components/BottomNav';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/hooks/useTheme';
import { User, Database, Info, ExternalLink, Moon, Sun } from 'lucide-react';

export default function Settings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme, toggleTheme } = useTheme();

  const handleExportData = () => {
    toast({
      title: "Export Data",
      description: "Data export functionality will be available soon.",
    });
  };

  const settingsOptions = [
    {
      icon: User,
      title: 'Profile Settings',
      description: 'Manage your personal information',
      action: () => toast({ title: "Coming Soon", description: "Profile settings will be available in the next update." })
    },
    {
      icon: Database,
      title: 'Export Data',
      description: 'Download your financial data',
      action: handleExportData
    },
    {
      icon: Info,
      title: 'About',
      description: 'App version and information',
      action: () => toast({ title: "Account Book", description: "Version 1.0.0 - Built with React & TypeScript" })
    }
  ];

  return (
    <MobileLayout title="Settings" showBack onBack={() => navigate('/')}>
      <div className="p-4 pb-20 space-y-4">
        {/* User Info */}
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-finance-primary flex items-center justify-center">
              <User className="h-6 w-6 text-finance-primary-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Rao Ghuge</h3>
              <p className="text-sm text-finance-neutral">rao@baapcompany.com</p>
            </div>
          </div>
        </Card>

        {/* Dark Mode Toggle */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-finance-secondary">
                {theme === 'dark' ? (
                  <Moon className="h-5 w-5 text-finance-primary" />
                ) : (
                  <Sun className="h-5 w-5 text-finance-primary" />
                )}
              </div>
              <div>
                <h4 className="font-medium text-foreground">Dark Mode</h4>
                <p className="text-sm text-finance-neutral">Switch between light and dark themes</p>
              </div>
            </div>
            <Switch
              checked={theme === 'dark'}
              onCheckedChange={toggleTheme}
            />
          </div>
        </Card>

        {/* Settings Options */}
        <div className="space-y-3">
          {settingsOptions.map((option, index) => (
            <Card key={index} className="p-4 cursor-pointer hover:shadow-card transition-shadow" onClick={option.action}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-finance-secondary">
                    <option.icon className="h-5 w-5 text-finance-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">{option.title}</h4>
                    <p className="text-sm text-finance-neutral">{option.description}</p>
                  </div>
                </div>
                <ExternalLink className="h-4 w-4 text-finance-neutral" />
              </div>
            </Card>
          ))}
        </div>

        {/* API Information */}
        {/* <Card className="p-6">
          <h3 className="font-semibold mb-3">API Configuration</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-finance-neutral">Base URL:</span>
              <span className="font-mono text-xs">http://127.0.0.1:8000</span>
            </div>
            <div className="flex justify-between">
              <span className="text-finance-neutral">User ID:</span>
              <span className="font-mono text-xs">1</span>
            </div>
            <div className="flex justify-between">
              <span className="text-finance-neutral">Group ID:</span>
              <span className="font-mono text-xs">1</span>
            </div>
          </div>
        </Card> */}

        {/* App Info */}
        <Card className="p-6 text-center">
          <h3 className="font-semibold mb-2">Account Book</h3>
          <p className="text-sm text-finance-neutral mb-4">
            AI-powered personal finance management with smart transaction tracking
          </p>
          <div className="text-xs text-finance-neutral">
            Built with React, TypeScript & Tailwind CSS
          </div>
        </Card>
      </div>
      
      <BottomNav />
    </MobileLayout>
  );
}