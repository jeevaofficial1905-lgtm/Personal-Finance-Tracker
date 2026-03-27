import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Plus, 
  Trash2, 
  IndianRupee, 
  Calendar, 
  CheckCircle2, 
  ArrowUpRight, 
  ArrowDownLeft,
  MessageSquare,
  Clock,
  UserPlus
} from 'lucide-react';
import { Creditor, Debtor } from '../types';
import { cn, formatCurrency, formatDate } from '../lib/utils';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';

interface CreditorTrackerProps {
  userId: string;
  creditors: Creditor[];
  debtors: Debtor[];
}

export function CreditorTracker({ userId, creditors, debtors }: CreditorTrackerProps) {
  const [activeTab, setActiveTab] = useState<'creditors' | 'debtors'>('creditors');
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState({
    name: '',
    amount: 0,
    dueDate: '',
    notes: ''
  });

  const totalOwed = creditors.reduce((sum, c) => sum + (c.status === 'pending' ? c.amount : 0), 0);
  const totalReceivable = debtors.reduce((sum, d) => sum + (d.status === 'pending' ? d.amount : 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const collectionName = activeTab;
    try {
      await addDoc(collection(db, collectionName), {
        userId,
        name: form.name,
        amount: Number(form.amount),
        dueDate: form.dueDate || null,
        notes: form.notes,
        status: 'pending'
      });
      setIsAdding(false);
      setForm({ name: '', amount: 0, dueDate: '', notes: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, collectionName);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, activeTab, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${activeTab}/${id}`);
    }
  };

  const toggleStatus = async (item: Creditor | Debtor) => {
    if (!item.id) return;
    const newStatus = item.status === 'pending' 
      ? (activeTab === 'creditors' ? 'paid' : 'collected') 
      : 'pending';
    
    try {
      await updateDoc(doc(db, activeTab, item.id), { status: newStatus });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${activeTab}/${item.id}`);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight font-serif">People & Credit</h1>
          <p className="text-[var(--color-muted)]">Manage personal loans, lent money, and informal debts.</p>
        </div>
        <div className="flex items-center gap-2 p-1 bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] shadow-sm">
          <button
            onClick={() => setActiveTab('creditors')}
            className={cn(
              "px-6 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2",
              activeTab === 'creditors' ? "bg-rose-600 text-white shadow-md" : "text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
            )}
          >
            <ArrowUpRight className="w-4 h-4" />
            I Owe
          </button>
          <button
            onClick={() => setActiveTab('debtors')}
            className={cn(
              "px-6 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2",
              activeTab === 'debtors' ? "bg-emerald-600 text-white shadow-md" : "text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
            )}
          >
            <ArrowDownLeft className="w-4 h-4" />
            Owes Me
          </button>
        </div>
      </header>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[var(--color-card)] p-8 rounded-3xl border border-[var(--color-border)] shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-[var(--color-muted)] font-medium uppercase tracking-wider">Total I Owe</p>
            <p className="text-4xl font-bold text-rose-600">{formatCurrency(totalOwed)}</p>
          </div>
          <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600">
            <ArrowUpRight className="w-8 h-8" />
          </div>
        </div>
        <div className="bg-[var(--color-card)] p-8 rounded-3xl border border-[var(--color-border)] shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-[var(--color-muted)] font-medium uppercase tracking-wider">Total Receivable</p>
            <p className="text-4xl font-bold text-emerald-600">{formatCurrency(totalReceivable)}</p>
          </div>
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
            <ArrowDownLeft className="w-8 h-8" />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => setIsAdding(true)}
          className="bg-[var(--color-accent)] text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-[var(--color-accent)]/20"
        >
          <UserPlus className="w-5 h-5" />
          Add {activeTab === 'creditors' ? 'Creditor' : 'Debtor'}
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-3xl p-8 shadow-xl"
          >
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--color-muted)]">Name</label>
                <input
                  type="text"
                  required
                  placeholder="Person or Entity name"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--color-accent)]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--color-muted)]">Amount</label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted)]" />
                  <input
                    type="number"
                    required
                    value={form.amount}
                    onChange={e => setForm({ ...form, amount: Number(e.target.value) })}
                    className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-[var(--color-accent)]"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--color-muted)]">Due Date (Optional)</label>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={e => setForm({ ...form, dueDate: e.target.value })}
                  className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--color-accent)]"
                />
              </div>
              <div className="flex items-end gap-3">
                <button type="submit" className="flex-1 bg-[var(--color-accent)] text-white py-3 rounded-xl font-semibold shadow-sm">Save</button>
                <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-3 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-border)]/20">Cancel</button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {(activeTab === 'creditors' ? creditors : debtors).map(item => (
          <motion.div
            layout
            key={item.id}
            className={cn(
              "bg-[var(--color-card)] border rounded-3xl p-6 space-y-4 relative group shadow-sm transition-all hover:shadow-md",
              item.status === 'paid' || item.status === 'collected' ? "opacity-60 border-emerald-100" : "border-[var(--color-border)]"
            )}
          >
            <button
              onClick={() => item.id && handleDelete(item.id)}
              className="absolute top-4 right-4 p-2 text-[var(--color-muted)]/20 hover:text-rose-600 transition-colors opacity-0 group-hover:opacity-100"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-4">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center border",
                activeTab === 'creditors' ? "bg-rose-50 border-rose-100 text-rose-600" : "bg-emerald-50 border-emerald-100 text-emerald-600"
              )}>
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg">{item.name}</h3>
                <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider font-semibold">
                  {activeTab === 'creditors' ? 'Creditor' : 'Debtor'}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <p className="text-xs text-[var(--color-muted)] font-medium uppercase tracking-wider">Amount</p>
                  <p className={cn(
                    "text-2xl font-bold",
                    activeTab === 'creditors' ? "text-rose-600" : "text-emerald-600"
                  )}>
                    {formatCurrency(item.amount)}
                  </p>
                </div>
                {item.dueDate && (
                  <div className="text-right">
                    <p className="text-[10px] text-[var(--color-muted)] uppercase font-bold tracking-widest">Due Date</p>
                    <p className="text-sm font-medium flex items-center gap-1 justify-end">
                      <Clock className="w-3 h-3" />
                      {formatDate(item.dueDate)}
                    </p>
                  </div>
                )}
              </div>

              {item.notes && (
                <div className="p-3 bg-[var(--color-background)]/50 rounded-xl border border-[var(--color-border)]/50 flex gap-2">
                  <MessageSquare className="w-4 h-4 text-[var(--color-muted)] shrink-0 mt-0.5" />
                  <p className="text-xs text-[var(--color-muted)] italic">{item.notes}</p>
                </div>
              )}

              <div className="pt-4 border-t border-[var(--color-border)]/50 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  {item.status === 'pending' ? (
                    <span className="flex items-center gap-1 text-amber-600 text-[10px] font-bold uppercase tracking-widest">
                      <Clock className="w-3 h-3" />
                      Pending
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-emerald-600 text-[10px] font-bold uppercase tracking-widest">
                      <CheckCircle2 className="w-3 h-3" />
                      {activeTab === 'creditors' ? 'Paid' : 'Collected'}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => toggleStatus(item)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                    item.status === 'pending' 
                      ? "bg-[var(--color-accent)] text-white shadow-sm hover:opacity-90" 
                      : "bg-[var(--color-muted)]/10 text-[var(--color-muted)] hover:bg-[var(--color-muted)]/20"
                  )}
                >
                  Mark as {item.status === 'pending' ? (activeTab === 'creditors' ? 'Paid' : 'Collected') : 'Pending'}
                </button>
              </div>
            </div>
          </motion.div>
        ))}

        {((activeTab === 'creditors' && creditors.length === 0) || (activeTab === 'debtors' && debtors.length === 0)) && !isAdding && (
          <div className="md:col-span-2 xl:col-span-3 py-20 bg-[var(--color-card)] border border-dashed border-[var(--color-border)] rounded-3xl flex flex-col items-center justify-center text-[var(--color-muted)]/30 space-y-4">
            <CheckCircle2 className="w-12 h-12" />
            <div className="text-center">
              <p className="text-lg font-medium">No {activeTab} tracked</p>
              <p className="text-sm">Click the button above to add someone.</p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
