import React from 'react';
import { User } from 'firebase/auth';
import { 
  LayoutDashboard, 
  PieChart, 
  CreditCard, 
  History, 
  LogOut, 
  Wallet,
  Menu,
  X,
  Calculator as CalculatorIcon,
  TrendingUp,
  Users,
  BarChart3
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Calculator } from './Calculator';

interface LayoutProps {
  user: User;
  activeTab: string;
  setActiveTab: (tab: any) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export function Layout({ user, activeTab, setActiveTab, onLogout, children }: LayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = React.useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);
  const sessionStart = React.useMemo(() => new Date().toLocaleTimeString(), []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'budgets', label: 'Budgets', icon: PieChart },
    { id: 'trends', label: 'Income vs Expense', icon: BarChart3 },
    { id: 'investments', label: 'Investments', icon: TrendingUp },
    { id: 'creditors', label: 'People', icon: Users },
    { id: 'debts', label: 'Debts & Loans', icon: CreditCard },
    { id: 'transactions', label: 'Transactions', icon: History },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-foreground)] flex flex-col md:flex-row">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-64 flex-col border-r border-[var(--color-border)] p-6 space-y-8">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 bg-[var(--color-background)] rounded-xl flex items-center justify-center border border-[var(--color-border)] shadow-sm">
            <Wallet className="w-6 h-6 text-[var(--color-accent)]" />
          </div>
          <span className="font-bold text-xl tracking-tight font-serif">WealthTrack</span>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                activeTab === item.id 
                  ? "bg-[var(--color-accent)] text-white font-medium" 
                  : "text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-border)]/50"
              )}
            >
              <item.icon className={cn("w-5 h-5", activeTab === item.id ? "text-white" : "text-[var(--color-muted)] group-hover:text-[var(--color-foreground)]")} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="pt-6 border-t border-[var(--color-border)] space-y-4">
          <div className="px-4 py-3 bg-[var(--color-background)] rounded-xl border border-[var(--color-border)] space-y-1">
            <p className="text-[10px] text-[var(--color-muted)] font-bold uppercase tracking-widest">Session Info</p>
            <p className="text-[11px] font-medium">Started: {sessionStart}</p>
          </div>
          <div className="flex items-center gap-3 px-2">
            <img src={user.photoURL || ''} alt="" className="w-10 h-10 rounded-full border border-[var(--color-border)]" referrerPolicy="no-referrer" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.displayName}</p>
              <p className="text-xs text-[var(--color-muted)] truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[var(--color-muted)] hover:text-red-600 hover:bg-red-50 transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-3xl p-8 max-w-sm w-full shadow-2xl space-y-6"
            >
              <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center border border-rose-100 mx-auto">
                <LogOut className="w-8 h-8 text-rose-600" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-bold font-serif">Sign Out?</h3>
                <p className="text-[var(--color-muted)]">Are you sure you want to end your session? You'll need to sign in again to access your data.</p>
              </div>
              <div className="flex flex-col gap-3">
                <button
                  onClick={onLogout}
                  className="w-full py-3 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition-all shadow-sm"
                >
                  Yes, Sign Out
                </button>
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="w-full py-3 bg-[var(--color-background)] text-[var(--color-foreground)] font-bold rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-border)]/50 transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 border-b border-[var(--color-border)] bg-[var(--color-background)]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Wallet className="w-6 h-6 text-[var(--color-accent)]" />
          <span className="font-bold font-serif">WealthTrack</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden fixed inset-0 z-40 bg-[var(--color-background)] pt-20 p-6 space-y-6"
        >
          <nav className="space-y-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-lg transition-all",
                  activeTab === item.id 
                    ? "bg-[var(--color-accent)] text-white font-bold" 
                    : "text-[var(--color-muted)]"
                )}
              >
                <item.icon className="w-6 h-6" />
                {item.label}
              </button>
            ))}
          </nav>
          <div className="pt-6 border-t border-[var(--color-border)]">
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-red-600 bg-red-50"
            >
              <LogOut className="w-6 h-6" />
              Sign Out
            </button>
          </div>
        </motion.div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-10 relative">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>

        {/* Floating Calculator Button */}
        <div className="fixed bottom-6 right-6 z-50">
          <AnimatePresence>
            {isCalculatorOpen && (
              <Calculator onClose={() => setIsCalculatorOpen(false)} />
            )}
          </AnimatePresence>
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsCalculatorOpen(!isCalculatorOpen)}
            className={cn(
              "w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-300",
              isCalculatorOpen 
                ? "bg-[var(--color-foreground)] text-[var(--color-background)] rotate-90" 
                : "bg-[var(--color-accent)] text-white"
            )}
          >
            {isCalculatorOpen ? <X className="w-6 h-6" /> : <CalculatorIcon className="w-6 h-6" />}
          </motion.button>
        </div>
      </main>
    </div>
  );
}

