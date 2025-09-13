import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '@/components/MobileLayout';
import { BottomNav } from '@/components/BottomNav';
import { TransactionCard } from '@/components/TransactionCard';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { api, Transaction, DEMO_USER } from '@/lib/api';
import { Filter } from 'lucide-react';

export default function History() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'today' | 'yesterday' | 'this_week' | 'this_month' | 'all'>('this_week');
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadTransactions();
  }, [filter]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const data = await api.getTransactionHistory(DEMO_USER.user_id, DEMO_USER.group_id, filter);
      setTransactions(data.transactions || []);
    } catch (error) {
      console.error('Failed to load transactions:', error);
      toast({
        title: "Error",
        description: "Failed to load transaction history. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getTotalAmount = () => {
    return transactions.reduce((total, transaction) => {
      if (transaction.transaction_type === 'income') {
        return total + transaction.amount;
      } else {
        return total - transaction.amount;
      }
    }, 0);
  };

  const getIncomeTotal = () => {
    return transactions
      .filter(t => t.transaction_type === 'income')
      .reduce((total, t) => total + t.amount, 0);
  };

  const getExpenseTotal = () => {
    return transactions
      .filter(t => ['expense', 'loan_payable'].includes(t.transaction_type))
      .reduce((total, t) => total + t.amount, 0);
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getFilterLabel = () => {
    switch (filter) {
      case 'today': return 'Today';
      case 'yesterday': return 'Yesterday';
      case 'this_week': return 'This Week';
      case 'this_month': return 'This Month';
      case 'all': return 'All Time';
      default: return 'This Week';
    }
  };

  if (loading) {
    return (
      <MobileLayout title="Transaction History" showBack onBack={() => navigate('/')}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-finance-primary"></div>
        </div>
        <BottomNav />
      </MobileLayout>
    );
  }

  return (
    <MobileLayout title="Transaction History" showBack onBack={() => navigate('/')}>
      <div className="p-4 pb-20 space-y-4">
        {/* Filter and Summary */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-finance-neutral" />
              <span className="text-sm font-medium">Filter</span>
            </div>
            <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="this_week">This Week</SelectItem>
                <SelectItem value="this_month">This Month</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {transactions.length > 0 && (
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-finance-neutral">Income</p>
                <p className="font-semibold text-finance-income">
                  {formatAmount(getIncomeTotal())}
                </p>
              </div>
              <div>
                <p className="text-xs text-finance-neutral">Expense</p>
                <p className="font-semibold text-finance-expense">
                  {formatAmount(getExpenseTotal())}
                </p>
              </div>
              <div>
                <p className="text-xs text-finance-neutral">Net</p>
                <p className={`font-semibold ${getTotalAmount() >= 0 ? 'text-finance-income' : 'text-finance-expense'}`}>
                  {formatAmount(getTotalAmount())}
                </p>
              </div>
            </div>
          )}
        </Card>

        {/* Transactions */}
        {transactions.length > 0 ? (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-finance-neutral">
              {transactions.length} transaction{transactions.length !== 1 ? 's' : ''} found for {getFilterLabel().toLowerCase()}
            </h3>
            {transactions.map((transaction) => (
              <TransactionCard
                key={transaction.transaction_id}
                transaction={transaction}
              />
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <h3 className="text-lg font-semibold mb-2">No Transactions Found</h3>
            <p className="text-finance-neutral mb-4">
              No transactions found for {getFilterLabel().toLowerCase()}
            </p>
            <Button 
              onClick={() => navigate('/add-transaction')} 
              className="bg-finance-primary hover:bg-finance-primary/90"
            >
              Add Your First Transaction
            </Button>
          </Card>
        )}
      </div>
      
      <BottomNav />
    </MobileLayout>
  );
}