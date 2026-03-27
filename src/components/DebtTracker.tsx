import React, { useState } from 'react';
import { Debt, Loan } from '../types';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { formatCurrency, cn, formatDate } from '../lib/utils';
import { Plus, Trash2, CreditCard, Landmark, Calendar, Percent, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

interface DebtTrackerProps {
  userId: string;
  debts: Debt[];
  loans: Loan[];
}

export function DebtTracker({ userId, debts, loans }: DebtTrackerProps) {
  const [activeView, setActiveView] = useState<'debts' | 'loans'>('debts');
  const [isAdding, setIsAdding] = useState(false);

  // Form states
  const [debtForm, setDebtForm] = useState({ name: '', totalAmount: 0, remainingAmount: 0, dueDate: '' });
  const [loanForm, setLoanForm] = useState({ name: '', principal: 0, interestRate: 0, termMonths: 12 });

  const handleAddDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'debts'), {
        userId,
        ...debtForm,
        totalAmount: Number(debtForm.totalAmount),
        remainingAmount: Number(debtForm.remainingAmount),
        dueDate: debtForm.dueDate ? new Date(debtForm.dueDate).toISOString() : null
      });
      setIsAdding(false);
      setDebtForm({ name: '', totalAmount: 0, remainingAmount: 0, dueDate: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'debts');
    }
  };

  const handleAddLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'loans'), {
        userId,
        ...loanForm,
        principal: Number(loanForm.principal),
        interestRate: Number(loanForm.interestRate),
        termMonths: Number(loanForm.termMonths),
        startDate: new Date().toISOString()
      });
      setIsAdding(false);
      setLoanForm({ name: '', principal: 0, interestRate: 0, termMonths: 12 });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'loans');
    }
  };

  const handleDelete = async (collectionName: string, id: string) => {
    try {
      await deleteDoc(doc(db, collectionName, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${collectionName}/${id}`);
    }
  };

  const handleUpdateDebt = async (id: string, paidAmount: number) => {
    const debt = debts.find(d => d.id === id);
    if (!debt) return;
    const newRemaining = Math.max(0, debt.remainingAmount - paidAmount);
    try {
      await updateDoc(doc(db, 'debts', id), { remainingAmount: newRemaining });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `debts/${id}`);
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
          <h1 className="text-4xl font-bold tracking-tight font-serif">Liabilities</h1>
          <p className="text-[var(--color-muted)]">Track your debts and monitor active loans.</p>
        </div>
        <div className="flex items-center gap-2 p-1 bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] shadow-sm">
          <button
            onClick={() => setActiveView('debts')}
            className={cn(
              "px-6 py-2 rounded-xl text-sm font-semibold transition-all",
              activeView === 'debts' ? "bg-[var(--color-accent)] text-white" : "text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
            )}
          >
            Debts
          </button>
          <button
            onClick={() => setActiveView('loans')}
            className={cn(
              "px-6 py-2 rounded-xl text-sm font-semibold transition-all",
              activeView === 'loans' ? "bg-[var(--color-accent)] text-white" : "text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
            )}
          >
            Loans
          </button>
        </div>
      </header>

      <div className="flex justify-end">
        <button
          onClick={() => setIsAdding(true)}
          className="bg-[var(--color-accent)] text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-all flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Add {activeView === 'debts' ? 'Debt' : 'Loan'}
        </button>
      </div>

      {isAdding && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-3xl p-8 shadow-sm"
        >
          {activeView === 'debts' ? (
            <form onSubmit={handleAddDebt} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--color-muted)]">Debt Name</label>
                <input
                  type="text"
                  required
                  value={debtForm.name}
                  onChange={e => setDebtForm({ ...debtForm, name: e.target.value })}
                  className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--color-accent)]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--color-muted)]">Total Amount</label>
                <input
                  type="number"
                  required
                  value={debtForm.totalAmount}
                  onChange={e => setDebtForm({ ...debtForm, totalAmount: Number(e.target.value) })}
                  className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--color-accent)]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--color-muted)]">Remaining</label>
                <input
                  type="number"
                  required
                  value={debtForm.remainingAmount}
                  onChange={e => setDebtForm({ ...debtForm, remainingAmount: Number(e.target.value) })}
                  className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--color-accent)]"
                />
              </div>
              <div className="flex items-end gap-3">
                <button type="submit" className="flex-1 bg-[var(--color-accent)] text-white py-3 rounded-xl font-semibold shadow-sm">Save</button>
                <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-3 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-border)]/20">X</button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleAddLoan} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--color-muted)]">Loan Name</label>
                <input
                  type="text"
                  required
                  value={loanForm.name}
                  onChange={e => setLoanForm({ ...loanForm, name: e.target.value })}
                  className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--color-accent)]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--color-muted)]">Principal</label>
                <input
                  type="number"
                  required
                  value={loanForm.principal}
                  onChange={e => setLoanForm({ ...loanForm, principal: Number(e.target.value) })}
                  className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--color-accent)]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--color-muted)]">Interest Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={loanForm.interestRate}
                  onChange={e => setLoanForm({ ...loanForm, interestRate: Number(e.target.value) })}
                  className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--color-accent)]"
                />
              </div>
              <div className="flex items-end gap-3">
                <button type="submit" className="flex-1 bg-[var(--color-accent)] text-white py-3 rounded-xl font-semibold shadow-sm">Save</button>
                <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-3 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-border)]/20">X</button>
              </div>
            </form>
          )}
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {activeView === 'debts' ? (
          debts.map(debt => (
            <div key={debt.id} className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-3xl p-8 space-y-6 relative group shadow-sm">
              <button
                onClick={() => debt.id && handleDelete('debts', debt.id)}
                className="absolute top-6 right-6 p-2 text-[var(--color-muted)]/20 hover:text-rose-600 transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[var(--color-background)] rounded-2xl flex items-center justify-center border border-[var(--color-border)]">
                  <CreditCard className="w-6 h-6 text-[var(--color-accent)]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold font-serif">{debt.name}</h3>
                  <p className="text-sm text-[var(--color-muted)]">Personal Debt</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="text-sm text-[var(--color-muted)]">Remaining</p>
                    <p className="text-3xl font-bold text-rose-600">{formatCurrency(debt.remainingAmount)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-[var(--color-muted)]">Total</p>
                    <p className="text-lg font-medium">{formatCurrency(debt.totalAmount)}</p>
                  </div>
                </div>

                <div className="h-2 bg-[var(--color-border)]/50 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(1 - debt.remainingAmount / debt.totalAmount) * 100}%` }}
                    className="h-full bg-emerald-600 rounded-full"
                  />
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-sm text-[var(--color-muted)]/60">
                    <Calendar className="w-4 h-4" />
                    {debt.dueDate ? `Due ${formatDate(debt.dueDate)}` : 'No due date'}
                  </div>
                  <button
                    onClick={() => debt.id && handleUpdateDebt(debt.id, 50)}
                    className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] hover:text-[var(--color-accent)] transition-colors"
                  >
                    Pay $50
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          loans.map(loan => (
            <div key={loan.id} className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-3xl p-8 space-y-6 relative group shadow-sm">
              <button
                onClick={() => loan.id && handleDelete('loans', loan.id)}
                className="absolute top-6 right-6 p-2 text-[var(--color-muted)]/20 hover:text-rose-600 transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[var(--color-background)] rounded-2xl flex items-center justify-center border border-[var(--color-border)]">
                  <Landmark className="w-6 h-6 text-[var(--color-accent)]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold font-serif">{loan.name}</h3>
                  <p className="text-sm text-[var(--color-muted)]">Active Loan</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-xs text-[var(--color-muted)]/60 uppercase font-bold tracking-widest">Principal</p>
                  <p className="text-xl font-bold">{formatCurrency(loan.principal)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-[var(--color-muted)]/60 uppercase font-bold tracking-widest">Interest</p>
                  <div className="flex items-center gap-1">
                    <Percent className="w-4 h-4 text-amber-600" />
                    <p className="text-xl font-bold">{loan.interestRate}%</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-[var(--color-muted)]/60 uppercase font-bold tracking-widest">Term</p>
                  <p className="text-xl font-bold">{loan.termMonths} Months</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-[var(--color-muted)]/60 uppercase font-bold tracking-widest">Started</p>
                  <p className="text-xl font-bold">{loan.startDate ? formatDate(loan.startDate) : 'N/A'}</p>
                </div>
              </div>
            </div>
          ))
        )}

        {((activeView === 'debts' && debts.length === 0) || (activeView === 'loans' && loans.length === 0)) && !isAdding && (
          <div className="md:col-span-2 py-20 bg-[var(--color-card)] border border-dashed border-[var(--color-border)] rounded-3xl flex flex-col items-center justify-center text-[var(--color-muted)]/30 space-y-4">
            <CheckCircle2 className="w-12 h-12" />
            <div className="text-center">
              <p className="text-lg font-medium">Clear of {activeView}!</p>
              <p className="text-sm">You don't have any active {activeView} tracked.</p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
