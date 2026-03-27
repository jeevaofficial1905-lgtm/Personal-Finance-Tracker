import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Trash2, 
  IndianRupee, 
  Briefcase, 
  Bitcoin, 
  Home, 
  BarChart3,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { Investment } from '../types';
import { cn, formatCurrency } from '../lib/utils';

interface InvestmentTrackerProps {
  investments: Investment[];
  onAdd: (investment: Omit<Investment, 'id' | 'userId'>) => void;
  onDelete: (id: string) => void;
  onUpdateValue: (id: string, newValue: number) => void;
}

export function InvestmentTracker({ investments, onAdd, onDelete, onUpdateValue }: InvestmentTrackerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newInvestment, setNewInvestment] = useState<Omit<Investment, 'id' | 'userId'>>({
    name: '',
    type: 'stock',
    amountInvested: 0,
    currentValue: 0,
    purchaseDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const totalInvested = investments.reduce((sum, inv) => sum + inv.amountInvested, 0);
  const totalCurrentValue = investments.reduce((sum, inv) => sum + inv.currentValue, 0);
  const totalGainLoss = totalCurrentValue - totalInvested;
  const totalGainLossPercentage = totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newInvestment.name && newInvestment.amountInvested > 0) {
      onAdd(newInvestment);
      setIsAdding(false);
      setNewInvestment({
        name: '',
        type: 'stock',
        amountInvested: 0,
        currentValue: 0,
        purchaseDate: new Date().toISOString().split('T')[0],
        notes: ''
      });
    }
  };

  const getIcon = (type: Investment['type']) => {
    switch (type) {
      case 'stock': return <BarChart3 className="w-5 h-5" />;
      case 'crypto': return <Bitcoin className="w-5 h-5" />;
      case 'real-estate': return <Home className="w-5 h-5" />;
      case 'bond': return <Briefcase className="w-5 h-5" />;
      default: return <TrendingUp className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold font-serif tracking-tight">Investment Portfolio</h2>
          <p className="text-[var(--color-muted)] mt-1">Track and grow your wealth over time.</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center justify-center gap-2 bg-[var(--color-accent)] text-white px-6 py-3 rounded-2xl font-semibold hover:opacity-90 transition-all shadow-lg shadow-[var(--color-accent)]/20 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Add Investment
        </button>
      </div>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[var(--color-card)] p-6 rounded-3xl border border-[var(--color-border)] shadow-sm"
        >
          <p className="text-sm text-[var(--color-muted)] font-medium uppercase tracking-wider">Total Invested</p>
          <p className="text-3xl font-bold mt-2 font-mono">{formatCurrency(totalInvested)}</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[var(--color-card)] p-6 rounded-3xl border border-[var(--color-border)] shadow-sm"
        >
          <p className="text-sm text-[var(--color-muted)] font-medium uppercase tracking-wider">Current Value</p>
          <p className="text-3xl font-bold mt-2 font-mono">{formatCurrency(totalCurrentValue)}</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={cn(
            "p-6 rounded-3xl border shadow-sm",
            totalGainLoss >= 0 
              ? "bg-green-50 border-green-100 text-green-700" 
              : "bg-red-50 border-red-100 text-red-700"
          )}
        >
          <p className="text-sm font-medium uppercase tracking-wider opacity-70">Total Gain/Loss</p>
          <div className="flex items-baseline gap-2 mt-2">
            <p className="text-3xl font-bold font-mono">
              {totalGainLoss >= 0 ? '+' : ''}{formatCurrency(Math.abs(totalGainLoss))}
            </p>
            <span className="text-sm font-semibold">
              ({totalGainLossPercentage.toFixed(2)}%)
            </span>
          </div>
        </motion.div>
      </div>

      {/* Add Investment Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[var(--color-card)] w-full max-w-lg rounded-3xl border border-[var(--color-border)] shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-[var(--color-border)] flex items-center justify-between">
                <h3 className="text-xl font-bold font-serif">New Investment</h3>
                <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-[var(--color-muted)]/10 rounded-full">
                  <Plus className="w-6 h-6 rotate-45" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-[var(--color-muted)] mb-1">Asset Name</label>
                    <input
                      type="text"
                      required
                      value={newInvestment.name}
                      onChange={e => setNewInvestment({...newInvestment, name: e.target.value})}
                      className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl px-4 py-3 focus:ring-2 focus:ring-[var(--color-accent)] outline-none"
                      placeholder="e.g. Apple Stock, Bitcoin, Rental Property"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-muted)] mb-1">Type</label>
                    <select
                      value={newInvestment.type}
                      onChange={e => setNewInvestment({...newInvestment, type: e.target.value as Investment['type']})}
                      className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl px-4 py-3 focus:ring-2 focus:ring-[var(--color-accent)] outline-none"
                    >
                      <option value="stock">Stock</option>
                      <option value="crypto">Crypto</option>
                      <option value="real-estate">Real Estate</option>
                      <option value="bond">Bond</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-muted)] mb-1">Purchase Date</label>
                    <input
                      type="date"
                      value={newInvestment.purchaseDate}
                      onChange={e => setNewInvestment({...newInvestment, purchaseDate: e.target.value})}
                      className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl px-4 py-3 focus:ring-2 focus:ring-[var(--color-accent)] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-muted)] mb-1">Amount Invested</label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted)]" />
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={newInvestment.amountInvested}
                        onChange={e => setNewInvestment({...newInvestment, amountInvested: parseFloat(e.target.value) || 0, currentValue: parseFloat(e.target.value) || 0})}
                        className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-[var(--color-accent)] outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-muted)] mb-1">Current Value</label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted)]" />
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={newInvestment.currentValue}
                        onChange={e => setNewInvestment({...newInvestment, currentValue: parseFloat(e.target.value) || 0})}
                        className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-[var(--color-accent)] outline-none"
                      />
                    </div>
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full bg-[var(--color-accent)] text-white py-4 rounded-xl font-bold hover:opacity-90 transition-all active:scale-95 mt-4"
                >
                  Add to Portfolio
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Investments List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {investments.length === 0 ? (
          <div className="col-span-full bg-[var(--color-card)] border border-dashed border-[var(--color-border)] rounded-3xl p-12 text-center">
            <div className="w-16 h-16 bg-[var(--color-muted)]/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-[var(--color-muted)]" />
            </div>
            <h3 className="text-xl font-bold font-serif">No investments yet</h3>
            <p className="text-[var(--color-muted)] mt-2 max-w-sm mx-auto">
              Start tracking your stocks, crypto, and other assets to see your net worth grow.
            </p>
          </div>
        ) : (
          investments.map((inv) => {
            const gainLoss = inv.currentValue - inv.amountInvested;
            const gainLossPercentage = (gainLoss / inv.amountInvested) * 100;
            const isPositive = gainLoss >= 0;

            return (
              <motion.div
                layout
                key={inv.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-3xl p-6 shadow-sm group hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[var(--color-accent)]/5 rounded-2xl flex items-center justify-center text-[var(--color-accent)]">
                      {getIcon(inv.type)}
                    </div>
                    <div>
                      <h4 className="font-bold text-lg">{inv.name}</h4>
                      <p className="text-xs text-[var(--color-muted)] uppercase tracking-widest font-semibold">{inv.type}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => inv.id && onDelete(inv.id)}
                    className="p-2 text-[var(--color-muted)] hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-[var(--color-background)]/50 p-4 rounded-2xl border border-[var(--color-border)]/50">
                    <p className="text-[10px] text-[var(--color-muted)] uppercase font-bold tracking-wider mb-1">Invested</p>
                    <p className="text-lg font-bold font-mono">{formatCurrency(inv.amountInvested)}</p>
                  </div>
                  <div className="bg-[var(--color-background)]/50 p-4 rounded-2xl border border-[var(--color-border)]/50">
                    <p className="text-[10px] text-[var(--color-muted)] uppercase font-bold tracking-wider mb-1">Current Value</p>
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-bold font-mono">{formatCurrency(inv.currentValue)}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold",
                      isPositive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    )}>
                      {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {Math.abs(gainLossPercentage).toFixed(2)}%
                    </div>
                    <p className={cn("text-sm font-bold", isPositive ? "text-green-600" : "text-red-600")}>
                      {isPositive ? '+' : '-'}{formatCurrency(Math.abs(gainLoss))}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
                    <Calendar className="w-3 h-3" />
                    {new Date(inv.purchaseDate).toLocaleDateString()}
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-[var(--color-border)]">
                  <label className="block text-[10px] text-[var(--color-muted)] uppercase font-bold tracking-wider mb-2">Update Current Value</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-[var(--color-muted)]" />
                      <input
                        type="number"
                        step="0.01"
                        placeholder="New value..."
                        className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl pl-8 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const val = parseFloat((e.target as HTMLInputElement).value);
                            if (!isNaN(val) && inv.id) {
                              onUpdateValue(inv.id, val);
                              (e.target as HTMLInputElement).value = '';
                            }
                          }
                        }}
                      />
                    </div>
                    <button 
                      className="px-4 py-2 bg-[var(--color-muted)]/10 hover:bg-[var(--color-muted)]/20 rounded-xl text-xs font-bold transition-all"
                      onClick={(e) => {
                        const input = (e.currentTarget.previousSibling as HTMLElement).querySelector('input');
                        if (input && inv.id) {
                          const val = parseFloat(input.value);
                          if (!isNaN(val)) {
                            onUpdateValue(inv.id, val);
                            input.value = '';
                          }
                        }
                      }}
                    >
                      Update
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
