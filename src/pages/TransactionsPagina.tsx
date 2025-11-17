import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUserTransactions } from '../lib/auth';
import { Transaction } from '../types';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import { format } from 'date-fns';

export default function TransactionsPagina() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    if (user?.id) {
      loadTransactions();
    }
  }, [user]);

  const loadTransactions = async () => {
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('No auth token');
      
      const data = await getUserTransactions(user.id, token);
      setTransactions(data);
    } catch (error) {
      console.error('Failed to load transactions:', error);
      // Don't show error if it's just that the collection doesn't exist yet
      if (error instanceof Error && error.message.includes('Failed to fetch transactions')) {
        setTransactions([]);
      } else {
        setError('Failed to load transactions. Please try again later.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'membership':
        return 'bg-geel text-paars';
      case 'event':
        return 'bg-oranje/20 text-paars';
      case 'payment':
        return 'bg-paars/20 text-paars';
      default:
        return 'bg-gray-200 text-paars';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500 text-white';
      case 'pending':
        return 'bg-yellow-500 text-white';
      case 'failed':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-400 text-white';
    }
  };

  const formatAmount = (amount: number | string): string => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return isNaN(numAmount) ? '0.00' : numAmount.toFixed(2);
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-beige flex items-center justify-center">
        <div className="text-paars text-xl font-semibold">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-beige">
      <NavBar />
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => navigate('/account')}
              className="mb-4 flex items-center gap-2 text-paars hover:text-oranje transition-colors"
            >
              <span>←</span>
              <span>Back to Account</span>
            </button>
            <h1 className="text-4xl font-bold text-paars mb-2">My Transactions</h1>
            <p className="text-paars/70">View all your payment history and transactions</p>
          </div>

          {/* Transactions Section */}
          <div className="bg-white rounded-3xl shadow-2xl p-8 border-4 border-oranje">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="text-paars">Loading your transactions...</div>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="text-red-600 mb-4">{error}</div>
                <button
                  onClick={loadTransactions}
                  className="px-6 py-3 bg-oranje text-beige rounded-full font-semibold hover:bg-opacity-90 transition-all hover:scale-105 shadow-md"
                >
                  Try Again
                </button>
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📊</div>
                <div className="text-paars mb-4 font-semibold">No transactions found.</div>
                <p className="text-paars/70 text-sm mb-4">
                  Your payment history will appear here once you make your first transaction.
                </p>
                <div className="mt-6 p-4 bg-geel/10 rounded-xl max-w-md mx-auto">
                  <p className="text-xs text-paars/60">
                    💡 Note: The transactions feature is being set up. Your transaction history will be tracked automatically once the system is fully configured.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-oranje/20">
                        <th className="text-left py-3 px-4 font-semibold text-paars">Date</th>
                        <th className="text-left py-3 px-4 font-semibold text-paars">Description</th>
                        <th className="text-left py-3 px-4 font-semibold text-paars">Type</th>
                        <th className="text-right py-3 px-4 font-semibold text-paars">Amount</th>
                        <th className="text-center py-3 px-4 font-semibold text-paars">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((transaction) => (
                        <tr key={transaction.id} className="border-b border-oranje/10 hover:bg-oranje/5 transition-colors">
                          <td className="py-4 px-4 text-paars/70">
                            {format(new Date(transaction.created_at), 'MMM d, yyyy')}
                          </td>
                          <td className="py-4 px-4 text-paars font-medium">
                            {transaction.description}
                          </td>
                          <td className="py-4 px-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTransactionTypeColor(transaction.transaction_type)}`}>
                              {transaction.transaction_type}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right text-paars font-semibold">
                            €{formatAmount(transaction.amount)}
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(transaction.status)}`}>
                              {transaction.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4">
                  {transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="p-4 border-2 border-oranje/20 rounded-xl hover:border-oranje transition-all hover:shadow-md"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-paars mb-1">
                            {transaction.description}
                          </h3>
                          <p className="text-sm text-paars/70">
                            {format(new Date(transaction.created_at), 'MMMM d, yyyy')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-paars text-lg">
                            €{formatAmount(transaction.amount)}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTransactionTypeColor(transaction.transaction_type)}`}>
                          {transaction.transaction_type}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(transaction.status)}`}>
                          {transaction.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Summary */}
                <div className="mt-8 pt-6 border-t-2 border-oranje/20">
                  <div className="flex justify-between items-center">
                    <span className="text-paars/70 font-semibold">Total Transactions:</span>
                    <span className="text-paars font-bold">{transactions.length}</span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-paars/70 font-semibold">Total Amount:</span>
                    <span className="text-paars font-bold text-xl">
                      €{formatAmount(transactions.reduce((sum, t) => {
                        const amount = typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount;
                        return sum + (t.status === 'completed' && !isNaN(amount) ? amount : 0);
                      }, 0))}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
