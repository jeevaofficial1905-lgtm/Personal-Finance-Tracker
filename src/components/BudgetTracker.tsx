import React, { useState } from 'react';
import { Budget, Transaction } from '../types';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { formatCurrency, cn } from '../lib/utils';
import { Plus, Trash2, PieChart, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';

interface BudgetTrackerProps {
  userId: string;
  budgets: Budget[];
  transactions: Transaction[];
}

export function BudgetTracker({ userId, budgets, transactions }: BudgetTrackerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newBudget, setNewBudget] = useState({ category: '', limit: 0 });

  const handleAddBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBudget.category || newBudget.limit <= 0) return;

    try {
      await addDoc(collection(db, 'budgets'), {
        userId,
        category: newBudget.category,
        limit: Number(newBudget.limit),
        spent: 0,
        period: 'monthly'
      });
      setNewBudget({ category: '', limit: 0 });
      setIsAdding(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'budgets');
    }
  };

  const handleDeleteBudget = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'budgets', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `budgets/${id}`);
    }
  };

  const getSpentForCategory = (category: string) => {
    return transactions
      .filter(t => t.type === 'expense' && t.category === category)
      .reduce((acc, t) => acc + t.amount, 0);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight font-serif">Budgets</h1>
          <p className="text-[var(--color-muted)]">Plan and track your monthly spending.</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="bg-[var(--color-accent)] text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-all flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Add Budget
        </button>
      </header>

      {isAdding && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-3xl p-8 shadow-sm"
        >
          <form onSubmit={handleAddBudget} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--color-muted)]">Category</label>
              <input
                type="text"
                value={newBudget.category}
                onChange={e => setNewBudget({ ...newBudget, category: e.target.value })}
                placeholder="e.g. Groceries"
                className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--color-accent)] transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--color-muted)]">Monthly Limit</label>
              <input
                type="number"
                value={newBudget.limit}
                onChange={e => setNewBudget({ ...newBudget, limit: Number(e.target.value) })}
                placeholder="0.00"
                className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--color-accent)] transition-all"
              />
            </div>
            <div className="flex items-end gap-3">
              <button
                type="submit"
                className="flex-1 bg-[var(--color-accent)] text-white py-3 rounded-xl font-semibold hover:opacity-90 transition-all shadow-sm"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-6 py-3 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-border)]/20 transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {budgets.map(budget => {
          const spent = getSpentForCategory(budget.category);
          const percent = (spent / budget.limit) * 100;
          const remaining = budget.limit - spent;

          return (
            <div key={budget.id} className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-3xl p-8 space-y-6 relative group shadow-sm">
              <button
                onClick={() => budget.id && handleDeleteBudget(budget.id)}
                className="absolute top-6 right-6 p-2 text-[var(--color-muted)]/20 hover:text-rose-600 transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[var(--color-background)] rounded-2xl flex items-center justify-center border border-[var(--color-border)]">
                  <PieChart className="w-6 h-6 text-[var(--color-accent)]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold font-serif">{budget.category}</h3>
                  <p className="text-sm text-[var(--color-muted)]">Monthly Budget</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="text-sm text-[var(--color-muted)]">Spent</p>
                    <p className="text-2xl font-bold">{formatCurrency(spent)}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-sm text-[var(--color-muted)]">Limit</p>
                    <p className="text-xl font-medium text-[var(--color-foreground)]/80">{formatCurrency(budget.limit)}</p>
                  </div>
                </div>

                <div className="h-3 bg-[var(--color-border)]/50 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(percent, 100)}%` }}
                    className={cn(
                      "h-full rounded-full transition-all",
                      percent > 100 ? "bg-rose-500" : percent > 80 ? "bg-amber-500" : "bg-[var(--color-accent)]"
                    )}
                  />
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className={cn(
                    "font-medium",
                    remaining < 0 ? "text-rose-600" : "text-[var(--color-muted)]"
                  )}>
                    {remaining < 0 ? `Over by ${formatCurrency(Math.abs(remaining))}` : `${formatCurrency(remaining)} remaining`}
                  </span>
                  <span className="text-[var(--color-muted)]/50">{Math.round(percent)}% used</span>
                </div>
              </div>

              {percent > 90 && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 text-amber-700 rounded-xl text-xs font-medium border border-amber-100">
                  <AlertTriangle className="w-4 h-4" />
                  Warning: You've used over 90% of this budget.
                </div>
              )}
            </div>
          );
        })}

        {budgets.length === 0 && !isAdding && (
          <div className="md:col-span-2 py-20 bg-[var(--color-card)] border border-dashed border-[var(--color-border)] rounded-3xl flex flex-col items-center justify-center text-[var(--color-muted)]/30 space-y-4">
            <PieChart className="w-12 h-12" />
            <div className="text-center">
              <p className="text-lg font-medium">No budgets defined</p>
              <p className="text-sm">Start by adding a budget for your expense categories.</p>
            </div>
            <button
              onClick={() => setIsAdding(true)}
              className="mt-4 px-6 py-2 bg-[var(--color-accent)] text-white rounded-full hover:opacity-90 transition-all shadow-sm"
            >
              Add your first budget
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
