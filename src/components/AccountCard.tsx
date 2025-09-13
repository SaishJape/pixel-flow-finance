import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Account } from '@/lib/api';
import { Wallet, Building2 } from 'lucide-react';

interface AccountCardProps {
  account: Account;
  onClick?: () => void;
}

export function AccountCard({ account, onClick }: AccountCardProps) {
  const formatBalance = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card 
      className="p-4 cursor-pointer transition-all hover:shadow-card active:scale-[0.98]"
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-finance-secondary">
            {account.account_type === 'bank' ? (
              <Building2 className="h-5 w-5 text-finance-primary" />
            ) : (
              <Wallet className="h-5 w-5 text-finance-primary" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-foreground">
              {account.account_type === 'bank' ? account.bank_name : 'Cash'}
            </h3>
            <p className="text-sm text-finance-neutral">
              {account.account_type === 'bank' ? 'Bank Account' : 'Cash Account'}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-foreground">
            {formatBalance(account.balance)}
          </p>
          <Badge variant={account.balance > 0 ? 'default' : 'destructive'} className="text-xs">
            {account.account_type}
          </Badge>
        </div>
      </div>
    </Card>
  );
}