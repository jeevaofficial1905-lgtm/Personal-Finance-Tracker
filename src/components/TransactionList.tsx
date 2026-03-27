import React, { useState } from 'react';
import { Transaction } from '../types';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { formatCurrency, cn, formatDate } from '../lib/utils';
import { Plus, Trash2, ArrowUpCircle, ArrowDownCircle, Search, Filter } from 'lucide-react';
import { motion } from 'motion/react';

interface TransactionListProps {
  userId: string;
  transactions: Transaction[];
}

export function TransactionList({ userId, transactions }: TransactionListProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [form, setForm] = useState({
    amount: 0,
    category: '',
    description: '',
    type: 'expense' as 'income' | 'expense',
    date: new Date().toISOString().split('T')[0]
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'transactions'), {
        userId,
        ...form,
        amount: Number(form.amount),
        date: new Date(form.date).toISOString()
      });
      setIsAdding(false);
      setForm({
        amount: 0,
        category: '',
        description: '',
        type: 'expense',
        date: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'transactions');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'transactions', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `transactions/${id}`);
    }
  };

  const filteredTransactions = transactions
    .filter(t => {
      const matchesFilter = filter === 'all' || t.type === filter;
      const matchesSearch = t.description?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           t.category.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesFilter && matchesSearch;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight font-serif">Transactions</h1>
          <p className="text-[var(--color-muted)]">History of your income and expenses.</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="bg-[var(--color-accent)] text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-all flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Add Transaction
        </button>
      </header>

      {isAdding && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-3xl p-8 shadow-sm"
        >
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--color-muted)]">Type</label>
              <select
                value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value as any })}
                className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--color-accent)]"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--color-muted)]">Amount</label>
              <input
                type="number"
                required
                value={form.amount}
                onChange={e => setForm({ ...form, amount: Number(e.target.value) })}
                className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--color-accent)]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--color-muted)]">Category</label>
              <input
                type="text"
                required
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
                placeholder="e.g. Food, Salary"
                className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--color-accent)]"
              />
            </div>
            <div className="space-y-2 lg:col-span-2">
              <label className="text-sm font-medium text-[var(--color-muted)]">Description</label>
              <input
                type="text"
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--color-accent)]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--color-muted)]">Date</label>
              <input
                type="date"
                required
                value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })}
                className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--color-accent)]"
              />
            </div>
            <div className="lg:col-span-3 flex justify-end gap-3">
              <button type="button" onClick={() => setIsAdding(false)} className="px-6 py-3 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-border)]/20 transition-all">Cancel</button>
              <button type="submit" className="px-10 py-3 bg-[var(--color-accent)] text-white rounded-xl font-bold shadow-sm">Add</button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-[var(--color-card)] p-4 rounded-2xl border border-[var(--color-border)] shadow-sm">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted)]/50" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl pl-12 pr-4 py-2 focus:outline-none focus:border-[var(--color-accent)]"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[var(--color-muted)]/50 mr-2" />
          {['all', 'income', 'expense'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={cn(
                "px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all",
                filter === f ? "bg-[var(--color-accent)] text-white" : "text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="space-y-4">
        {filteredTransactions.map(t => (
          <motion.div
            layout
            key={t.id}
            className="group flex items-center justify-between p-6 bg-[var(--color-card)] border border-[var(--color-border)] rounded-3xl hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-6">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center border",
                t.type === 'income' ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-[var(--color-background)] border-[var(--color-border)] text-[var(--color-muted)]"
              )}>
                {t.type === 'income' ? <ArrowUpCircle className="w-6 h-6" /> : <ArrowDownCircle className="w-6 h-6" />}
              </div>
              <div>
                <p className="font-bold text-lg font-serif">{t.category}</p>
                <p className="text-sm text-[var(--color-muted)]">{t.description || 'No description'}</p>
              </div>
            </div>
            <div className="flex items-center gap-8">
              <div className="text-right">
                <p className={cn(
                  "text-xl font-bold",
                  t.type === 'income' ? "text-emerald-700" : "text-[var(--color-foreground)]"
                )}>
                  {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                </p>
                <p className="text-xs text-[var(--color-muted)]/50 font-medium uppercase tracking-wider">{formatDate(t.date)}</p>
              </div>
              <button
                onClick={() => t.id && handleDelete(t.id)}
                className="p-2 text-[var(--color-muted)]/20 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        ))}

        {filteredTransactions.length === 0 && (
          <div className="py-20 text-center text-[var(--color-muted)]/30">
            <p className="text-lg font-medium">No transactions found</p>
            <p className="text-sm">Try adjusting your filters or add a new transaction.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
