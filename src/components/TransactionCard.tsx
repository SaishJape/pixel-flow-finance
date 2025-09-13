import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Transaction } from '@/lib/api';
import { ArrowUpRight, ArrowDownLeft, CreditCard, Landmark } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TransactionCardProps {
  transaction: Transaction;
}

export function TransactionCard({ transaction }: TransactionCardProps) {
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
    });
  };

  const getTransactionIcon = () => {
    if (transaction.transaction_type === 'income') {
      return <ArrowDownLeft className="h-4 w-4 text-finance-income" />;
    }
    return <ArrowUpRight className="h-4 w-4 text-finance-expense" />;
  };

  const getPaymentMethodIcon = () => {
    switch (transaction.payment_method) {
      case 'bank':
      case 'upi':
        return <Landmark className="h-3 w-3" />;
      case 'credit_card':
        return <CreditCard className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const isIncome = transaction.transaction_type === 'income';

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2 rounded-lg",
            isIncome ? "bg-finance-income/10" : "bg-finance-expense/10"
          )}>
            {getTransactionIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-foreground truncate">
              {transaction.category}
            </h3>
            <div className="flex items-center gap-2 text-sm text-finance-neutral">
              <span>{formatDate(transaction.transaction_date)}</span>
              {getPaymentMethodIcon() && (
                <>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    {getPaymentMethodIcon()}
                    <span className="capitalize">{transaction.payment_method.replace('_', ' ')}</span>
                  </div>
                </>
              )}
            </div>
            {transaction.description && (
              <p className="text-xs text-finance-neutral mt-1 truncate">
                {transaction.description}
              </p>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className={cn(
            "text-lg font-bold",
            isIncome ? "text-finance-income" : "text-finance-expense"
          )}>
            {isIncome ? '+' : '-'}{formatAmount(transaction.amount)}
          </p>
          <Badge 
            variant={isIncome ? 'default' : 'destructive'} 
            className="text-xs"
          >
            {transaction.transaction_type}
          </Badge>
        </div>
      </div>
    </Card>
  );
}