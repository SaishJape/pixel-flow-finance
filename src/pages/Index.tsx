import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '@/components/MobileLayout';
import { BottomNav } from '@/components/BottomNav';
import { AccountCard } from '@/components/AccountCard';
import { TransactionCard } from '@/components/TransactionCard';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { api, Account, Transaction, FinancialSummary, DEMO_USER } from '@/lib/api';
import { Plus, Eye, EyeOff, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const Dashboard = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null);
  const [showBalance, setShowBalance] = useState(true);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [accountsData, summaryData, historyData] = await Promise.all([
        api.getAccounts(DEMO_USER.user_id, DEMO_USER.group_id),
        api.getFinancialSummary(DEMO_USER.user_id, DEMO_USER.group_id),
        api.getTransactionHistory(DEMO_USER.user_id, DEMO_USER.group_id, 'this_week')
      ]);

      setAccounts(accountsData);
      setFinancialSummary(summaryData);
      setRecentTransactions(historyData.transactions?.slice(0, 5) || []);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast({
        title: "Error",
        description: "Failed to load your financial data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatBalance = (amount: number) => {
    if (!showBalance) return '••••••';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <MobileLayout title="Finance App">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-finance-primary"></div>
        </div>
        <BottomNav />
      </MobileLayout>
    );
  }

  return (
    <MobileLayout 
      title="Finance App"
      action={
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowBalance(!showBalance)}
          className="p-0 h-8 w-8"
        >
          {showBalance ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </Button>
      }
    >
      <div className="space-y-6 p-4 pb-20">
        {/* Balance Overview */}
        <Card className="p-6 bg-gradient-primary text-finance-primary-foreground">
          <div className="text-center">
            <p className="text-sm opacity-90 mb-2">Total Balance</p>
            <h2 className="text-3xl font-bold mb-4">
              {formatBalance(financialSummary?.total_balance || 0)}
            </h2>
            <div className="flex justify-center gap-4 text-sm">
              <div className="text-center">
                <p className="opacity-90">Income</p>
                <p className="font-semibold text-finance-income">
                  {formatBalance(financialSummary?.income || 0)}
                </p>
              </div>
              <div className="text-center">
                <p className="opacity-90">Expense</p>
                <p className="font-semibold text-finance-expense">
                  {formatBalance(financialSummary?.expense || 0)}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="flex justify-center">
          <Button
            onClick={() => navigate('/ai-transaction')}
            className="h-12 w-full bg-finance-primary hover:bg-finance-primary/90"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Add Transaction with AI
          </Button>
        </div>

        {/* Accounts */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Your Accounts</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/accounts')}
              className="text-finance-neutral"
            >
              View All
            </Button>
          </div>
          {accounts.length > 0 ? (
            <div className="space-y-3">
              {accounts.slice(0, 3).map((account) => (
                <AccountCard
                  key={account.setting_id}
                  account={account}
                  onClick={() => navigate('/accounts')}
                />
              ))}
            </div>
          ) : (
            <Card className="p-6 text-center">
              <p className="text-finance-neutral mb-3">No accounts added yet</p>
              <Button onClick={() => navigate('/accounts')} variant="outline">
                Add Your First Account
              </Button>
            </Card>
          )}
        </div>

        {/* Recent Transactions */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Recent Transactions</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/history')}
              className="text-finance-neutral"
            >
              View All
            </Button>
          </div>
          {recentTransactions.length > 0 ? (
            <div className="space-y-3">
              {recentTransactions.map((transaction) => (
                <TransactionCard
                  key={transaction.transaction_id}
                  transaction={transaction}
                />
              ))}
            </div>
          ) : (
            <Card className="p-6 text-center">
              <p className="text-finance-neutral mb-3">No transactions yet</p>
              <Button onClick={() => navigate('/ai-transaction')} variant="outline">
                Add Your First Transaction
              </Button>
            </Card>
          )}
        </div>
      </div>
      
      <BottomNav />
    </MobileLayout>
  );
};

export default Dashboard;
