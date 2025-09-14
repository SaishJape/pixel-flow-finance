import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '@/components/MobileLayout';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNotificationHelpers } from '@/contexts/NotificationContext';
import { useAuth } from '@/contexts/AuthContext';
import { useMicrophone } from '@/hooks/useMicrophone';
import { api, Account } from '@/lib/api';
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
  const [insufficientBalanceError, setInsufficientBalanceError] = useState<any>(null);
  const navigate = useNavigate();
  const { showSuccess, showError, showWarning, showInfo } = useNotificationHelpers();
  const { user } = useAuth();
  const { 
    permission: micPermission, 
    isRequesting: isRequestingPermission, 
    requestPermission: requestMicrophonePermission,
    hasPermission,
    isDenied,
    needsPermission,
    isMobile
  } = useMicrophone();

  useEffect(() => {
    loadAccounts();
    initializeSpeechRecognition();
  }, [user]);


  const initializeSpeechRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'en-US';
      recognitionInstance.maxAlternatives = 1;
      
      recognitionInstance.onstart = () => {
        setIsRecording(true);
        showInfo("Listening...", "Speak your transaction details clearly");
      };
      
      recognitionInstance.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setQuery(prev => prev + (prev ? ' ' : '') + transcript);
        setIsRecording(false);
        
        showSuccess("Speech Captured", "Your voice input has been added to the text field.");
      };
      
      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        
        let errorMessage = "Could not recognize speech. Please try again.";
        
        switch (event.error) {
          case 'no-speech':
            errorMessage = "No speech detected. Please speak clearly.";
            break;
          case 'audio-capture':
            errorMessage = "Microphone not accessible. Please check your microphone.";
            break;
          case 'not-allowed':
            errorMessage = "Microphone access denied. Please allow microphone access.";
            break;
          case 'network':
            errorMessage = "Network error. Please check your internet connection.";
            break;
        }
        
        showError("Speech Recognition Error", errorMessage);
      };
      
      recognitionInstance.onend = () => {
        setIsRecording(false);
      };
      
      setRecognition(recognitionInstance);
    } else {
      showError("Speech Recognition Not Supported", "Your browser doesn't support speech recognition. Please use text input.");
    }
  };

  const toggleRecording = async () => {
    if (!recognition) {
      showError("Not Supported", "Speech recognition is not supported in your browser.");
      return;
    }

    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
      return;
    }

    // Check permission status and handle accordingly
    if (isDenied) {
      showError("Microphone Access Denied", "Please enable microphone access in your browser settings to use voice input.");
      return;
    }

    if (needsPermission) {
      // Request permission first
      const granted = await requestMicrophonePermission();
      
      // If permission was granted, start recording
      if (granted) {
        recognition.start();
      }
      return;
    }

    // Permission is granted, start recording
    if (hasPermission) {
      recognition.start();
    }
  };

  const loadAccounts = async () => {
    if (!user) return;
    
    try {
      const data = await api.getAccounts(user.user_id, user.group_id);
      setAccounts(data);
    } catch (error) {
      console.error('Failed to load accounts:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) {
      showError("Error", "Please enter a transaction description.");
      return;
    }

    // Clear any previous insufficient balance error
    setInsufficientBalanceError(null);

    try {
      setLoading(true);
      const response = await api.addTransactionByQuery({
        user_id: user!.user_id,
        group_id: user!.group_id,
        setting_id: selectedAccount || undefined,
        query: query.trim(),
      });

      if (response.status === 'success') {
        showSuccess("Success", "Transaction created successfully with AI!");
        navigate('/');
      } else if (response.status === 'account_selection_required') {
        setShowAccountSelection(true);
        setPendingTransaction(response.suggested);
        showInfo("Account Selection Required", "Please select an account for this transaction.");
      } else if (response.status === 'pending') {
        setPendingTransaction(response.parsed_preview);
        showInfo("Almost Done", response.message);
      }
    } catch (error: any) {
      console.error('Failed to process AI transaction:', error);
      
      // Handle insufficient balance error with detailed information
      if (error.status_code === 400 && error.message === 'Insufficient balance') {
        setInsufficientBalanceError({
          message: error.message,
          reason: error.reason,
          available_balance: error.available_balance,
          required_amount: error.required_amount,
          account: error.account,
          status: error.status,
          status_code: error.status_code
        });
        
        toast({
          title: "Insufficient Balance",
          description: `${error.reason}: Available ₹${error.available_balance}, Required ₹${error.required_amount}`,
          variant: "destructive",
        });
      } else {
        showError("Error", "Failed to process transaction. Please try again or use manual entry.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAccountSelection = async () => {
    if (!selectedAccount) {
      showError("Error", "Please select an account.");
      return;
    }

    try {
      setLoading(true);
      const response = await api.addTransactionByQuery({
        user_id: user!.user_id,
        group_id: user!.group_id,
        setting_id: selectedAccount,
        query: query.trim(),
      });

      if (response.status === 'success') {
        showSuccess("Success", "Transaction created successfully!");
        navigate('/');
      }
    } catch (error: any) {
      console.error('Failed to create transaction:', error);
      
      // Handle insufficient balance error with detailed information
      if (error.status_code === 400 && error.message === 'Insufficient balance') {
        // Always set the insufficient balance error for proper display
        setInsufficientBalanceError({
          message: error.message || 'Insufficient balance',
          reason: error.reason || 'Cannot complete transaction',
          available_balance: error.available_balance || 0,
          required_amount: error.required_amount || 0,
          account: error.account || {},
          status: error.status || 'failed',
          status_code: error.status_code || 400
        });
        
        // Show error notification
        const reason = error.reason || 'Cannot complete transaction';
        const available = error.available_balance || 0;
        const required = error.required_amount || 0;
        showError("Insufficient Balance", `${reason}: Available ₹${available.toLocaleString()}, Required ₹${required.toLocaleString()}`);
        
        // Keep the account selection visible so user can choose a different account
        setShowAccountSelection(true);
      } else {
        console.error('Unexpected error:', error);
        showError("Error", "Failed to create transaction. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const clearInsufficientBalanceError = () => {
    setInsufficientBalanceError(null);
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const exampleQueries = [
    "I spent ₹500 on groceries by cash",
    "I earned ₹50000 from selling tomatoes by cash",
    "I received ₹50000 salary through bank transfer",
    "Paid ₹1200 for electricity bill using UPI",
    "Bought coffee for ₹150 with cash",
    "I got ₹5000 bonus income in my bank account",
    "I lent ₹10000 to my friend by cash",
    "I borrowed ₹25000 from bank for emergency"
  ];

  return (
    <MobileLayout title="AI Transaction" showBack onBack={() => navigate('/')}>
      <div className="p-4 space-y-6">
        {/* Main Input */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-finance-primary" />
            <h2 className="text-lg font-semibold">Describe Your Transaction</h2>
          </div>
          
          {/* Helpful tip for first-time users */}
          {needsPermission && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start gap-2">
                <Mic className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="text-sm">
                  <p className="text-blue-800 dark:text-blue-200 font-medium">Voice Input Available</p>
                  <p className="text-blue-700 dark:text-blue-300">
                    Click the microphone icon to enable voice input and speak your transaction details naturally.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="text-sm text-finance-muted-foreground mb-2">
            💡 <strong>Tip:</strong> Use clear words: "earned/received" for income, "spent/paid" for expenses, "lent" for loan receivable, "borrowed" for loan payable.
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Textarea
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  // Clear insufficient balance error when user starts typing
                  if (insufficientBalanceError) {
                    setInsufficientBalanceError(null);
                  }
                }}
                placeholder="E.g., I lent 10000 rupees to my friend by cash"
                rows={4}
                className="resize-none pr-12"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={toggleRecording}
                className={`absolute bottom-2 right-2 h-8 w-8 p-0 ${
                  isRecording 
                    ? 'text-red-500 animate-pulse' 
                    : isDenied
                      ? 'text-red-400' 
                      : hasPermission
                        ? 'text-finance-primary'
                        : 'text-finance-neutral'
                }`}
                disabled={loading || isRequestingPermission}
                title={
                  isDenied
                    ? 'Microphone access denied - Click to retry' 
                    : hasPermission
                      ? 'Click to start voice input'
                      : 'Click to enable microphone access'
                }
              >
                {isRequestingPermission ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                ) : isRecording ? (
                  <MicOff className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
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
              <Select 
                value={selectedAccount} 
                onValueChange={(value) => {
                  setSelectedAccount(value);
                  // Clear insufficient balance error when user selects a different account
                  if (insufficientBalanceError) {
                    setInsufficientBalanceError(null);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose an account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => {
                    const accountName = account.account_type === 'bank' ? account.bank_name : 'Cash';
                    const balance = account.balance;
                    
                    return (
                      <SelectItem key={account.setting_id} value={account.setting_id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{accountName}</span>
                          <span className="ml-2 text-finance-muted-foreground">
                            ₹{balance.toLocaleString()}
                          </span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {/* Account Balance Warning */}
              {selectedAccount && pendingTransaction && (() => {
                const selectedAccountData = accounts.find(acc => acc.setting_id === selectedAccount);
                // Only show insufficient balance warning for transactions that subtract money from account
                // Income and loan_receivable transactions add money to the account, so no balance check needed
                const transactionType = pendingTransaction.transaction_type;
                const requiresBalanceCheck = transactionType === 'expense' || transactionType === 'loan_payable';
                const hasInsufficientBalance = requiresBalanceCheck && selectedAccountData && selectedAccountData.balance < pendingTransaction.amount;
                
                if (hasInsufficientBalance) {
                  return (
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-yellow-600 dark:text-yellow-400">⚠️</span>
                        <div className="text-sm">
                          <p className="text-yellow-800 dark:text-yellow-200 font-medium">Insufficient Balance Warning</p>
                          <p className="text-yellow-700 dark:text-yellow-300">
                            This account has ₹{selectedAccountData.balance.toLocaleString()} but needs ₹{pendingTransaction.amount.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
              
              <Button 
                onClick={handleAccountSelection}
                className="w-full bg-finance-primary hover:bg-finance-primary/90"
                disabled={loading || !selectedAccount}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                    Processing...
                  </>
                ) : (
                  'Confirm Transaction'
                )}
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

        {/* Microphone Permission Info */}
        {isDenied && (
          <Card className="p-4 border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
            <div className="flex items-start gap-3">
              <Mic className="h-5 w-5 text-red-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-800 dark:text-red-200">Microphone Access Required</h4>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  To use voice input, please enable microphone access.
                </p>
                <div className="mt-2 text-xs text-red-600 dark:text-red-400">
                  {isMobile ? (
                    <>
                      <p><strong>On Mobile:</strong></p>
                      <ul className="list-disc list-inside ml-2 space-y-1">
                        <li>Tap the microphone icon above</li>
                        <li>Select "Allow" when prompted</li>
                        <li>Or go to browser settings → Site permissions → Microphone</li>
                      </ul>
                    </>
                  ) : (
                    <>
                      <p><strong>On Desktop:</strong></p>
                      <ul className="list-disc list-inside ml-2 space-y-1">
                        <li>Click the microphone icon in your browser's address bar</li>
                        <li>Select "Allow" for this site</li>
                        <li>Or go to browser settings → Privacy → Site settings → Microphone</li>
                      </ul>
                    </>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Insufficient Balance Error */}
        {insufficientBalanceError && (
          <Card className="p-4 border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center mt-0.5">
                <span className="text-white text-xs font-bold">!</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-red-800 dark:text-red-200">Insufficient Balance</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearInsufficientBalanceError}
                    className="text-red-600 hover:text-red-700 h-6 w-6 p-0"
                  >
                    ×
                  </Button>
                </div>
                
                <div className="space-y-2 text-sm">
                  <p className="text-red-700 dark:text-red-300">
                    <strong>Reason:</strong> {insufficientBalanceError.reason}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-red-100 dark:bg-red-900 p-2 rounded">
                      <p className="text-xs text-red-600 dark:text-red-400">Available Balance</p>
                      <p className="font-semibold text-red-800 dark:text-red-200">
                        {formatAmount(insufficientBalanceError.available_balance)}
                      </p>
                    </div>
                    <div className="bg-red-100 dark:bg-red-900 p-2 rounded">
                      <p className="text-xs text-red-600 dark:text-red-400">Required Amount</p>
                      <p className="font-semibold text-red-800 dark:text-red-200">
                        {formatAmount(insufficientBalanceError.required_amount)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-red-100 dark:bg-red-900 p-2 rounded">
                    <p className="text-xs text-red-600 dark:text-red-400">Account</p>
                    <p className="font-medium text-red-800 dark:text-red-200">
                      {insufficientBalanceError.account.account_type === 'bank' 
                        ? insufficientBalanceError.account.bank_name 
                        : 'Cash Account'
                      }
                    </p>
                  </div>
                  
                  <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded">
                    <p className="text-xs text-yellow-800 dark:text-yellow-200">
                      <strong>💡 Suggestions:</strong>
                    </p>
                    <ul className="text-xs text-yellow-700 dark:text-yellow-300 mt-1 list-disc list-inside space-y-1">
                      <li>Add money to your account first</li>
                      <li>Choose a different account with sufficient balance</li>
                      <li>Reduce the transaction amount</li>
                      <li>Use manual transaction entry for partial payments</li>
                    </ul>
                  </div>
                  
                  {/* Action buttons */}
                  <div className="mt-3 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowAccountSelection(true);
                        setInsufficientBalanceError(null);
                      }}
                      className="flex-1 text-xs"
                    >
                      Choose Different Account
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/accounts')}
                      className="flex-1 text-xs"
                    >
                      Add Money
                    </Button>
                  </div>
                </div>
              </div>
            </div>
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