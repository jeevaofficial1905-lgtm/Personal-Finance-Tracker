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
  X
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface LayoutProps {
  user: User;
  activeTab: string;
  setActiveTab: (tab: any) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export function Layout({ user, activeTab, setActiveTab, onLogout, children }: LayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'budgets', label: 'Budgets', icon: PieChart },
    { id: 'debts', label: 'Debts & Loans', icon: CreditCard },
    { id: 'transactions', label: 'Transactions', icon: History },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col md:flex-row">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-64 flex-col border-r border-white/10 p-6 space-y-8">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight">WealthTrack</span>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                activeTab === item.id 
                  ? "bg-white text-black font-medium" 
                  : "text-white/50 hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon className={cn("w-5 h-5", activeTab === item.id ? "text-black" : "text-white/50 group-hover:text-white")} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="pt-6 border-t border-white/10 space-y-4">
          <div className="flex items-center gap-3 px-2">
            <img src={user.photoURL || ''} alt="" className="w-10 h-10 rounded-full border border-white/10" referrerPolicy="no-referrer" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.displayName}</p>
              <p className="text-xs text-white/40 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/50 hover:text-red-400 hover:bg-red-400/10 transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 border-bottom border-white/10 bg-[#0a0a0a]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Wallet className="w-6 h-6" />
          <span className="font-bold">WealthTrack</span>
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
          className="md:hidden fixed inset-0 z-40 bg-[#0a0a0a] pt-20 p-6 space-y-6"
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
                    ? "bg-white text-black font-bold" 
                    : "text-white/50"
                )}
              >
                <item.icon className="w-6 h-6" />
                {item.label}
              </button>
            ))}
          </nav>
          <div className="pt-6 border-t border-white/10">
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-red-400 bg-red-400/5"
            >
              <LogOut className="w-6 h-6" />
              Sign Out
            </button>
          </div>
        </motion.div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-10">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
