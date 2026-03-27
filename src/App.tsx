import { useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  User,
  getRedirectResult,
  signInWithRedirect,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { collection, query, where, onSnapshot, doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './lib/firebase';
import { UserProfile, Budget, Transaction, Debt, Loan, Investment, Creditor, Debtor } from './types';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { BudgetTracker } from './components/BudgetTracker';
import { DebtTracker } from './components/DebtTracker';
import { CreditorTracker } from './components/CreditorTracker';
import { TransactionList } from './components/TransactionList';
import { InvestmentTracker } from './components/InvestmentTracker';
import { IncomeExpenseManager } from './components/IncomeExpenseManager';
import { LogIn, Wallet, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  console.log('WealthTrack: App component is rendering');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'budgets' | 'debts' | 'transactions' | 'investments' | 'creditors' | 'trends'>('dashboard');
  const [authError, setAuthError] = useState<string | null>(null);
  const [staySignedIn, setStaySignedIn] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Data states
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [creditors, setCreditors] = useState<Creditor[]>([]);
  const [debtors, setDebtors] = useState<Debtor[]>([]);

  useEffect(() => {
    // Set persistence for better mobile support
    setPersistence(auth, browserLocalPersistence);

    // Handle redirect result for mobile browsers
    getRedirectResult(auth).then((result) => {
      if (result?.user) {
        console.log('Redirect login successful');
      }
    }).catch((error) => {
      console.error("Redirect auth error:", error);
      if (error.code === 'auth/internal-error' || error.code === 'auth/network-request-failed') {
        setAuthError("Mobile browser restriction detected. Please try opening in Safari or Chrome directly.");
      }
    });

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Ensure user profile exists in Firestore
        const userRef = doc(db, 'users', user.uid);
        try {
          const userSnap = await getDoc(userRef);
          
          const profileUpdate: any = {
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || '',
            photoURL: user.photoURL || '',
            lastLogin: new Date().toISOString(),
          };

          if (!userSnap.exists()) {
            profileUpdate.createdAt = new Date().toISOString();
            await setDoc(userRef, profileUpdate);
          } else {
            await setDoc(userRef, { lastLogin: profileUpdate.lastLogin }, { merge: true });
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
        }
        setUser(user);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const qBudgets = query(collection(db, 'budgets'), where('userId', '==', user.uid));
    const unsubBudgets = onSnapshot(qBudgets, (snapshot) => {
      setBudgets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Budget)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'budgets'));

    const qTransactions = query(collection(db, 'transactions'), where('userId', '==', user.uid));
    const unsubTransactions = onSnapshot(qTransactions, (snapshot) => {
      setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'transactions'));

    const qDebts = query(collection(db, 'debts'), where('userId', '==', user.uid));
    const unsubDebts = onSnapshot(qDebts, (snapshot) => {
      setDebts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Debt)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'debts'));

    const qLoans = query(collection(db, 'loans'), where('userId', '==', user.uid));
    const unsubLoans = onSnapshot(qLoans, (snapshot) => {
      setLoans(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Loan)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'loans'));

    const qInvestments = query(collection(db, 'investments'), where('userId', '==', user.uid));
    const unsubInvestments = onSnapshot(qInvestments, (snapshot) => {
      setInvestments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Investment)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'investments'));

    const qCreditors = query(collection(db, 'creditors'), where('userId', '==', user.uid));
    const unsubCreditors = onSnapshot(qCreditors, (snapshot) => {
      setCreditors(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Creditor)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'creditors'));

    const qDebtors = query(collection(db, 'debtors'), where('userId', '==', user.uid));
    const unsubDebtors = onSnapshot(qDebtors, (snapshot) => {
      setDebtors(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Debtor)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'debtors'));

    return () => {
      unsubBudgets();
      unsubTransactions();
      unsubDebts();
      unsubLoans();
      unsubInvestments();
      unsubCreditors();
      unsubDebtors();
    };
  }, [user]);

  const handleLogin = async () => {
    setAuthError(null);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    
    try {
      // Set persistence based on toggle
      await setPersistence(auth, staySignedIn ? browserLocalPersistence : { type: 'SESSION' } as any);
      
      // Always try popup first - it's more reliable for state preservation
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error('Login failed:', error);
      if (error.code === 'auth/popup-blocked' || error.code === 'auth/cancelled-popup-request') {
        setAuthError("Popup was blocked. You can try 'Redirect Mode' below, but for the best experience, please open this page in Safari or Chrome directly.");
      } else if (error.code === 'auth/network-request-failed') {
        setAuthError("Network error. This often happens in 'In-App' browsers (like WhatsApp). Please tap the menu icon and 'Open in Browser'.");
      } else {
        setAuthError(error.message || "An unexpected error occurred.");
      }
    }
  };

  const handleRedirectLogin = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      await signInWithRedirect(auth, provider);
    } catch (error: any) {
      setAuthError("Redirect failed: " + error.message);
    }
  };

  const handleLogout = () => signOut(auth);

  // Investment actions
  const addInvestment = async (investment: Omit<Investment, 'id' | 'userId'>) => {
    if (!user) return;
    const invRef = doc(collection(db, 'investments'));
    try {
      await setDoc(invRef, { ...investment, userId: user.uid });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'investments');
    }
  };

  const deleteInvestment = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'investments', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `investments/${id}`);
    }
  };

  const updateInvestmentValue = async (id: string, newValue: number) => {
    try {
      const invRef = doc(db, 'investments', id);
      await setDoc(invRef, { currentValue: newValue }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `investments/${id}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] text-[var(--color-foreground)]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-[var(--color-muted)]/20 border-t-[var(--color-accent)] rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-background)] text-[var(--color-foreground)] p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-8 max-w-md"
        >
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-[var(--color-card)] rounded-2xl flex items-center justify-center border border-[var(--color-border)] shadow-sm">
              <Wallet className="w-8 h-8 text-[var(--color-accent)]" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight font-serif">WealthTrack</h1>
            <p className="text-[var(--color-muted)]">Master your finances. Track budgets, manage debts, and grow your wealth.</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 text-sm text-[var(--color-muted)] mb-2">
              <input 
                type="checkbox" 
                id="staySignedIn" 
                checked={staySignedIn} 
                onChange={(e) => setStaySignedIn(e.target.checked)}
                className="w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-accent)] focus:ring-[var(--color-accent)]"
              />
              <label htmlFor="staySignedIn" className="cursor-pointer select-none">Stay signed in for 30 days</label>
            </div>
            
            <button
              onClick={handleLogin}
              className="w-full py-4 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 group shadow-sm"
            >
              <LogIn className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              Sign in with Google
            </button>

            {authError && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-5 bg-amber-50 border border-amber-200 rounded-2xl text-left space-y-4"
              >
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-amber-900">Login Troubleshooting</p>
                    <p className="text-xs text-amber-800 leading-relaxed">{authError}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-2">
                  <button
                    onClick={handleRedirectLogin}
                    className="w-full py-2.5 bg-amber-600 text-white text-xs font-bold rounded-lg hover:bg-amber-700 transition-colors shadow-sm"
                  >
                    Try Redirect Mode
                  </button>
                  <div className="p-3 bg-white/50 rounded-lg border border-amber-100">
                    <p className="text-[10px] text-amber-900 font-semibold uppercase tracking-wider mb-1">Best Solution:</p>
                    <p className="text-[11px] text-amber-800">Tap the <span className="font-bold">...</span> or <span className="font-bold">Share</span> icon and select <span className="font-bold">"Open in Safari"</span> or <span className="font-bold">"Open in Chrome"</span>.</p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <Layout user={user} activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout}>
      <AnimatePresence mode="wait">
        {activeTab === 'dashboard' && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Dashboard 
              budgets={budgets} 
              transactions={transactions} 
              debts={debts} 
              loans={loans} 
              investments={investments}
              creditors={creditors}
              debtors={debtors}
            />
          </motion.div>
        )}
        {activeTab === 'budgets' && (
          <motion.div
            key="budgets"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <BudgetTracker 
              userId={user.uid}
              budgets={budgets} 
              transactions={transactions} 
            />
          </motion.div>
        )}
        {activeTab === 'trends' && (
          <motion.div
            key="trends"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <IncomeExpenseManager 
              transactions={transactions} 
            />
          </motion.div>
        )}
        {activeTab === 'debts' && (
          <motion.div
            key="debts"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <DebtTracker 
              userId={user.uid}
              debts={debts} 
              loans={loans} 
            />
          </motion.div>
        )}
        {activeTab === 'transactions' && (
          <motion.div
            key="transactions"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <TransactionList 
              userId={user.uid}
              transactions={transactions} 
            />
          </motion.div>
        )}
        {activeTab === 'investments' && (
          <motion.div
            key="investments"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <InvestmentTracker 
              investments={investments}
              onAdd={addInvestment}
              onDelete={deleteInvestment}
              onUpdateValue={updateInvestmentValue}
            />
          </motion.div>
        )}
        {activeTab === 'creditors' && (
          <motion.div
            key="creditors"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <CreditorTracker 
              userId={user.uid}
              creditors={creditors}
              debtors={debtors}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
}
