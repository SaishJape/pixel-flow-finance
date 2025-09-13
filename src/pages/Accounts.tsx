import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '@/components/MobileLayout';
import { BottomNav } from '@/components/BottomNav';
import { AccountCard } from '@/components/AccountCard';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { api, Account, DEMO_USER } from '@/lib/api';
import { Plus } from 'lucide-react';

export default function Accounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [accountType, setAccountType] = useState<'bank' | 'cash'>('bank');
  const [formData, setFormData] = useState({
    holder_name: '',
    bank_name: '',
    account_number: '',
    balance: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const data = await api.getAccounts(DEMO_USER.user_id, DEMO_USER.group_id);
      setAccounts(data);
    } catch (error) {
      console.error('Failed to load accounts:', error);
      toast({
        title: "Error",
        description: "Failed to load accounts. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.holder_name || !formData.balance) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      if (accountType === 'bank') {
        if (!formData.bank_name || !formData.account_number) {
          toast({
            title: "Error",
            description: "Please fill in all bank details.",
            variant: "destructive",
          });
          return;
        }
        await api.createBankAccount({
          user_id: DEMO_USER.user_id,
          group_id: DEMO_USER.group_id,
          holder_name: formData.holder_name,
          account_type: 'bank',
          bank_name: formData.bank_name,
          account_number: formData.account_number,
          balance: parseFloat(formData.balance),
        });
      } else {
        await api.createCashAccount({
          user_id: DEMO_USER.user_id,
          group_id: DEMO_USER.group_id,
          holder_name: formData.holder_name,
          cash: parseFloat(formData.balance),
        });
      }

      toast({
        title: "Success",
        description: `${accountType === 'bank' ? 'Bank' : 'Cash'} account created successfully.`,
      });
      
      setShowDialog(false);
      setFormData({ holder_name: '', bank_name: '', account_number: '', balance: '' });
      loadAccounts();
    } catch (error) {
      console.error('Failed to create account:', error);
      toast({
        title: "Error",
        description: "Failed to create account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <MobileLayout title="Accounts" showBack onBack={() => navigate('/')}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-finance-primary"></div>
        </div>
        <BottomNav />
      </MobileLayout>
    );
  }

  return (
    <MobileLayout 
      title="Accounts" 
      showBack 
      onBack={() => navigate('/')}
      action={
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-finance-primary hover:bg-finance-primary/90">
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95%] max-w-md mx-auto">
            <DialogHeader>
              <DialogTitle>Add New Account</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="account-type">Account Type</Label>
                <Select value={accountType} onValueChange={(value: 'bank' | 'cash') => setAccountType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank">Bank Account</SelectItem>
                    <SelectItem value="cash">Cash Account</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="holder-name">Holder Name</Label>
                <Input
                  id="holder-name"
                  value={formData.holder_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, holder_name: e.target.value }))}
                  placeholder="Enter account holder name"
                  required
                />
              </div>

              {accountType === 'bank' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="bank-name">Bank Name</Label>
                    <Input
                      id="bank-name"
                      value={formData.bank_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, bank_name: e.target.value }))}
                      placeholder="Enter bank name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="account-number">Account Number</Label>
                    <Input
                      id="account-number"
                      value={formData.account_number}
                      onChange={(e) => setFormData(prev => ({ ...prev, account_number: e.target.value }))}
                      placeholder="Enter account number"
                      required
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="balance">Initial Balance</Label>
                <Input
                  id="balance"
                  type="number"
                  step="0.01"
                  value={formData.balance}
                  onChange={(e) => setFormData(prev => ({ ...prev, balance: e.target.value }))}
                  placeholder="Enter initial balance"
                  required
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-finance-primary hover:bg-finance-primary/90"
                disabled={submitting}
              >
                {submitting ? 'Creating...' : 'Create Account'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      }
    >
      <div className="p-4 pb-20">
        {accounts.length > 0 ? (
          <div className="space-y-3">
            {accounts.map((account) => (
              <AccountCard key={account.setting_id} account={account} />
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <h3 className="text-lg font-semibold mb-2">No Accounts Yet</h3>
            <p className="text-finance-neutral mb-4">
              Add your first account to start tracking your finances
            </p>
            <Button onClick={() => setShowDialog(true)} className="bg-finance-primary hover:bg-finance-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Add Account
            </Button>
          </Card>
        )}
      </div>
      
      <BottomNav />
    </MobileLayout>
  );
}