import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '@/components/MobileLayout';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { api, Account, DEMO_USER } from '@/lib/api';
import { Sparkles, Send, Mic, MicOff } from 'lucide-react';

export default function AITransaction() {
  const [query, setQuery] = useState('');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [showAccountSelection, setShowAccountSelection] = useState(false);
  const [pendingTransaction, setPendingTransaction] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadAccounts();
    initializeSpeechRecognition();
  }, []);

  const initializeSpeechRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'en-US';
      
      recognitionInstance.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setQuery(prev => prev + ' ' + transcript);
        setIsRecording(false);
      };
      
      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        toast({
          title: "Speech Error",
          description: "Could not recognize speech. Please try again.",
          variant: "destructive",
        });
      };
      
      recognitionInstance.onend = () => {
        setIsRecording(false);
      };
      
      setRecognition(recognitionInstance);
    }
  };

  const toggleRecording = async () => {
    if (!recognition) {
      toast({
        title: "Not Supported",
        description: "Speech recognition is not supported in your browser.",
        variant: "destructive",
      });
      return;
    }

    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
    } else {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        recognition.start();
        setIsRecording(true);
        toast({
          title: "Listening...",
          description: "Speak your transaction details",
        });
      } catch (error) {
        toast({
          title: "Permission Denied",
          description: "Please allow microphone access to use voice input.",
          variant: "destructive",
        });
      }
    }
  };

  const loadAccounts = async () => {
    try {
      const data = await api.getAccounts(DEMO_USER.user_id, DEMO_USER.group_id);
      setAccounts(data);
    } catch (error) {
      console.error('Failed to load accounts:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) {
      toast({
        title: "Error",
        description: "Please enter a transaction description.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const response = await api.addTransactionByQuery({
        user_id: DEMO_USER.user_id,
        group_id: DEMO_USER.group_id,
        setting_id: selectedAccount || undefined,
        query: query.trim(),
      });

      if (response.status === 'success') {
        toast({
          title: "Success",
          description: "Transaction created successfully with AI!",
        });
        navigate('/');
      } else if (response.status === 'account_selection_required') {
        setShowAccountSelection(true);
        setPendingTransaction(response.suggested);
        toast({
          title: "Account Selection Required",
          description: "Please select an account for this transaction.",
        });
      } else if (response.status === 'pending') {
        setPendingTransaction(response.parsed_preview);
        toast({
          title: "Almost Done",
          description: response.message,
        });
      }
    } catch (error: any) {
      console.error('Failed to process AI transaction:', error);
      if (error.status_code === 400 && error.message?.includes('Insufficient balance')) {
        toast({
          title: "Insufficient Balance",
          description: `Available: ₹${error.available_balance}, Required: ₹${error.required_amount}`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to process transaction. Please try again or use manual entry.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAccountSelection = async () => {
    if (!selectedAccount) {
      toast({
        title: "Error",
        description: "Please select an account.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const response = await api.addTransactionByQuery({
        user_id: DEMO_USER.user_id,
        group_id: DEMO_USER.group_id,
        setting_id: selectedAccount,
        query: query.trim(),
      });

      if (response.status === 'success') {
        toast({
          title: "Success",
          description: "Transaction created successfully!",
        });
        navigate('/');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create transaction. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exampleQueries = [
    "I spent ₹500 on groceries by cash",
    "Received ₹50000 salary through bank transfer",
    "Paid ₹1200 for electricity bill using UPI",
    "Bought coffee for ₹150 with cash",
    "Got ₹5000 bonus in my bank account"
  ];

  return (
    <MobileLayout title="AI Transaction" showBack onBack={() => navigate('/')}>
      <div className="p-4 pb-20 space-y-6">
        {/* Main Input */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-finance-primary" />
            <h2 className="text-lg font-semibold">Describe Your Transaction</h2>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="E.g., I spent 500 rupees on groceries by cash"
                rows={4}
                className="resize-none pr-12"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={toggleRecording}
                className={`absolute bottom-2 right-2 h-8 w-8 p-0 ${
                  isRecording ? 'text-red-500 animate-pulse' : 'text-finance-primary'
                }`}
                disabled={loading}
              >
                {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-finance-primary hover:bg-finance-primary/90"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Create Transaction
                </>
              )}
            </Button>
          </form>
        </Card>

        {/* Account Selection (if needed) */}
        {showAccountSelection && accounts.length > 0 && (
          <Card className="p-6 border-finance-primary">
            <h3 className="font-semibold mb-4">Select Account</h3>
            {pendingTransaction && (
              <div className="mb-4 p-3 bg-finance-secondary rounded-lg">
                <p className="text-sm text-finance-neutral">Detected transaction:</p>
                <p className="font-medium">{pendingTransaction.type} - {pendingTransaction.category}</p>
                <p className="text-lg font-bold">₹{pendingTransaction.amount}</p>
                {pendingTransaction.description && (
                  <p className="text-sm text-finance-neutral">{pendingTransaction.description}</p>
                )}
              </div>
            )}
            <div className="space-y-3">
              <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.setting_id} value={account.setting_id}>
                      {account.account_type === 'bank' ? account.bank_name : 'Cash'} - ₹{account.balance.toLocaleString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                onClick={handleAccountSelection}
                className="w-full bg-finance-primary hover:bg-finance-primary/90"
                disabled={loading || !selectedAccount}
              >
                Confirm Transaction
              </Button>
            </div>
          </Card>
        )}

        {/* Pending Transaction Display */}
        {pendingTransaction && !showAccountSelection && (
          <Card className="p-6 border-finance-primary">
            <h3 className="font-semibold mb-4">Transaction Preview</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-finance-neutral">Type:</span>
                <span className="font-medium capitalize">{pendingTransaction.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-finance-neutral">Category:</span>
                <span className="font-medium">{pendingTransaction.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-finance-neutral">Amount:</span>
                <span className="font-bold">₹{pendingTransaction.amount}</span>
              </div>
              {pendingTransaction.description && (
                <div className="flex justify-between">
                  <span className="text-finance-neutral">Note:</span>
                  <span className="font-medium">{pendingTransaction.description}</span>
                </div>
              )}
            </div>
            <p className="text-sm text-finance-neutral mt-4">
              Please specify payment method to complete the transaction.
            </p>
          </Card>
        )}

        {/* Examples */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Example Queries</h3>
          <div className="space-y-2">
            {exampleQueries.map((example, index) => (
              <button
                key={index}
                onClick={() => setQuery(example)}
                className="text-left w-full p-3 rounded-lg bg-finance-secondary hover:bg-finance-accent transition-colors text-sm"
              >
                "{example}"
              </button>
            ))}
          </div>
        </Card>
      </div>
      
      <BottomNav />
    </MobileLayout>
  );
}