import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '@/components/MobileLayout';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { api, Account } from '@/lib/api';

export default function AddTransaction() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    transaction_type: '',
    category: '',
    amount: '',
    payment_method: '',
    description: '',
    setting_id: '',
    transaction_date: new Date().toISOString().split('T')[0],
  });
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    loadAccounts();
  }, [user]);

  const loadAccounts = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const data = await api.getAccounts(user.user_id, user.group_id);
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
    
    if (!formData.transaction_type || !formData.category || !formData.amount || !formData.payment_method) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      await api.addTransaction({
        user_id: user!.user_id,
        group_id: user!.group_id,
        setting_id: formData.setting_id || undefined,
        transaction_type: formData.transaction_type,
        category: formData.category,
        amount: parseFloat(formData.amount),
        payment_method: formData.payment_method,
        description: formData.description || undefined,
        transaction_date: formData.transaction_date,
      });

      toast({
        title: "Success",
        description: "Transaction added successfully.",
      });
      
      navigate('/');
    } catch (error: any) {
      console.error('Failed to add transaction:', error);
      if (error.status_code === 400 && error.message === 'Insufficient balance') {
        toast({
          title: "Insufficient Balance",
          description: `${error.reason}: Available ₹${error.available_balance}, Required ₹${error.required_amount}`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to add transaction. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const commonCategories = {
    expense: ['Food & Dining', 'Transportation', 'Shopping', 'Entertainment', 'Bills & Utilities', 'Healthcare', 'Education', 'Other'],
    income: ['Salary', 'Business', 'Investment', 'Gift', 'Bonus', 'Other'],
    loan_payable: ['Personal Loan', 'Credit Card', 'Mortgage', 'Other'],
    loan_receivable: ['Personal Loan', 'Investment', 'Other'],
    asset: ['Real Estate', 'Vehicle', 'Electronics', 'Jewelry', 'Other']
  };

  if (loading) {
    return (
      <MobileLayout title="Add Transaction" showBack onBack={() => navigate('/')}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-finance-primary"></div>
        </div>
        <BottomNav />
      </MobileLayout>
    );
  }

  return (
    <MobileLayout title="Add Transaction" showBack onBack={() => navigate('/')}>
      <div className="p-4">
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="transaction-type">Transaction Type *</Label>
              <Select value={formData.transaction_type} onValueChange={(value) => setFormData(prev => ({ ...prev, transaction_type: value, category: '' }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select transaction type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="loan_payable">Loan Payable</SelectItem>
                  <SelectItem value="loan_receivable">Loan Receivable</SelectItem>
                  <SelectItem value="asset">Asset Purchase</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.transaction_type && (
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {commonCategories[formData.transaction_type as keyof typeof commonCategories]?.map((category) => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="Enter amount"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment-method">Payment Method *</Label>
              <Select value={formData.payment_method} onValueChange={(value) => setFormData(prev => ({ ...prev, payment_method: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank">Bank Transfer</SelectItem>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {accounts.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="account">Account (Optional)</Label>
                <Select value={formData.setting_id} onValueChange={(value) => setFormData(prev => ({ ...prev, setting_id: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.setting_id} value={account.setting_id}>
                        {account.account_type === 'bank' ? account.bank_name : 'Cash'} - ₹{account.balance.toLocaleString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.transaction_date}
                onChange={(e) => setFormData(prev => ({ ...prev, transaction_date: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Add a note about this transaction"
                rows={3}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-finance-primary hover:bg-finance-primary/90"
              disabled={submitting}
            >
              {submitting ? 'Adding...' : 'Add Transaction'}
            </Button>
          </form>
        </Card>
      </div>
      
      <BottomNav />
    </MobileLayout>
  );
}