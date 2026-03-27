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
          <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="text-white/50">History of your income and expenses.</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="bg-white text-black px-6 py-3 rounded-xl font-semibold hover:bg-white/90 transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Transaction
        </button>
      </header>

      {isAdding && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/5 border border-white/10 rounded-3xl p-8"
        >
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/50">Type</label>
              <select
                value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value as any })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none"
              >
                <option value="expense" className="bg-[#1a1a1a]">Expense</option>
                <option value="income" className="bg-[#1a1a1a]">Income</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/50">Amount</label>
              <input
                type="number"
                required
                value={form.amount}
                onChange={e => setForm({ ...form, amount: Number(e.target.value) })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/50">Category</label>
              <input
                type="text"
                required
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
                placeholder="e.g. Food, Salary"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none"
              />
            </div>
            <div className="space-y-2 lg:col-span-2">
              <label className="text-sm font-medium text-white/50">Description</label>
              <input
                type="text"
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/50">Date</label>
              <input
                type="date"
                required
                value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none"
              />
            </div>
            <div className="lg:col-span-3 flex justify-end gap-3">
              <button type="button" onClick={() => setIsAdding(false)} className="px-6 py-3 rounded-xl border border-white/10">Cancel</button>
              <button type="submit" className="px-10 py-3 bg-white text-black rounded-xl font-bold">Add</button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/10">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-2 focus:outline-none focus:border-white/30"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-white/30 mr-2" />
          {['all', 'income', 'expense'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={cn(
                "px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all",
                filter === f ? "bg-white text-black" : "text-white/50 hover:text-white"
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
            className="group flex items-center justify-between p-6 bg-white/5 border border-white/10 rounded-3xl hover:bg-white/[0.07] transition-all"
          >
            <div className="flex items-center gap-6">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center border",
                t.type === 'income' ? "bg-emerald-400/10 border-emerald-400/20 text-emerald-400" : "bg-rose-400/10 border-rose-400/20 text-rose-400"
              )}>
                {t.type === 'income' ? <ArrowUpCircle className="w-6 h-6" /> : <ArrowDownCircle className="w-6 h-6" />}
              </div>
              <div>
                <p className="font-bold text-lg">{t.category}</p>
                <p className="text-sm text-white/40">{t.description || 'No description'}</p>
              </div>
            </div>
            <div className="flex items-center gap-8">
              <div className="text-right">
                <p className={cn(
                  "text-xl font-bold",
                  t.type === 'income' ? "text-emerald-400" : "text-white"
                )}>
                  {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                </p>
                <p className="text-xs text-white/30 font-medium uppercase tracking-wider">{formatDate(t.date)}</p>
              </div>
              <button
                onClick={() => t.id && handleDelete(t.id)}
                className="p-2 text-white/10 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        ))}

        {filteredTransactions.length === 0 && (
          <div className="py-20 text-center text-white/20">
            <p className="text-lg font-medium">No transactions found</p>
            <p className="text-sm">Try adjusting your filters or add a new transaction.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
