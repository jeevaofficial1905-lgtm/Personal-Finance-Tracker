import React, { useState } from 'react';
import { Budget, Transaction, Debt, Loan, Investment, Creditor, Debtor } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { 
  TrendingUp, 
  TrendingDown, 
  IndianRupee, 
  ArrowUpRight, 
  ArrowDownRight,
  AlertCircle,
  Briefcase,
  Users,
  Calendar,
  Download
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { motion } from 'motion/react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface DashboardProps {
  budgets: Budget[];
  transactions: Transaction[];
  debts: Debt[];
  loans: Loan[];
  investments: Investment[];
  creditors: Creditor[];
  debtors: Debtor[];
}

export function Dashboard({ budgets, transactions, debts, loans, investments, creditors, debtors }: DashboardProps) {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

  const filteredTransactions = transactions.filter(t => {
    const tDate = new Date(t.date);
    return tDate.getMonth() === selectedMonth && tDate.getFullYear() === selectedYear;
  });

  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);
  
  const totalExpenses = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  const balance = transactions
    .reduce((acc, t) => acc + (t.type === 'income' ? t.amount : -t.amount), 0);

  const totalDebt = debts.reduce((acc, d) => acc + d.remainingAmount, 0);
  const totalLoans = loans.reduce((acc, l) => acc + (l.remainingAmount ?? l.principal), 0);
  const totalCreditors = creditors
    .filter(c => c.status === 'pending')
    .reduce((acc, c) => acc + c.amount, 0);
  const totalDebtors = debtors
    .filter(d => d.status === 'pending')
    .reduce((acc, d) => acc + d.amount, 0);

  const totalInvested = investments.reduce((acc, inv) => acc + inv.amountInvested, 0);
  const totalInvestmentValue = investments.reduce((acc, inv) => acc + inv.currentValue, 0);
  const investmentGain = totalInvestmentValue - totalInvested;

  const netWorth = balance + totalInvestmentValue + totalDebtors - totalDebt - totalLoans - totalCreditors;

  // Chart data: Expenses by category (filtered by month)
  const expensesByCategory = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc: any, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});

  const pieData = Object.entries(expensesByCategory).map(([name, value]) => ({
    name,
    value
  }));

  const COLORS = ['#5A5A40', '#A0522D', '#708090', '#8FBC8F', '#BDB76B'];

  // Budget status (filtered by month)
  const budgetStatus = budgets.map(b => {
    const spent = filteredTransactions
      .filter(t => t.type === 'expense' && t.category === b.category)
      .reduce((acc, t) => acc + t.amount, 0);
    return {
      ...b,
      spent,
      percent: (spent / b.limit) * 100
    };
  });

  const exportMonthlyPDF = () => {
    const doc = new jsPDF();
    const monthName = months[selectedMonth];
    const yearName = selectedYear;
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(90, 90, 64); // --color-accent
    doc.text(`Financial Report: ${monthName} ${yearName}`, 14, 22);
    
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 30);

    // Summary Table
    autoTable(doc, {
      startY: 40,
      head: [['Metric', 'Value']],
      body: [
        ['Net Worth', formatCurrency(netWorth)],
        ['Total Income', formatCurrency(totalIncome)],
        ['Total Expenses', formatCurrency(totalExpenses)],
        ['Total Investments', formatCurrency(totalInvestmentValue)],
        ['Total Liabilities', formatCurrency(totalDebt + totalLoans + totalCreditors)],
        ['Total Receivables', formatCurrency(totalDebtors)],
      ],
      theme: 'striped',
      headStyles: { fillColor: [90, 90, 64] },
    });

    // Budget Table
    if (budgetStatus.length > 0) {
      doc.setFontSize(16);
      doc.setTextColor(0);
      doc.text('Budget Performance', 14, (doc as any).lastAutoTable.finalY + 15);

      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 20,
        head: [['Category', 'Limit', 'Spent', 'Status']],
        body: budgetStatus.map(b => [
          b.category,
          formatCurrency(b.limit),
          formatCurrency(b.spent),
          `${b.percent.toFixed(1)}%`
        ]),
        headStyles: { fillColor: [90, 90, 64] },
      });
    }

    // Transactions Table
    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text('Transaction Details', 14, (doc as any).lastAutoTable.finalY + 15);

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [['Date', 'Description', 'Category', 'Type', 'Amount']],
      body: filteredTransactions.map(t => [
        new Date(t.date).toLocaleDateString(),
        t.description,
        t.category,
        t.type.toUpperCase(),
        formatCurrency(t.amount)
      ]),
      headStyles: { fillColor: [90, 90, 64] },
      columnStyles: {
        4: { halign: 'right' }
      }
    });

    doc.save(`WealthTrack_Report_${monthName}_${yearName}.pdf`);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight font-serif">Overview</h1>
          <p className="text-[var(--color-muted)]">Your financial health at a glance.</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={exportMonthlyPDF}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl text-sm font-medium hover:bg-[var(--color-background)] transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            Download Report
          </button>
          <div className="flex bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-1 shadow-sm">
            <div className="flex items-center px-3 text-[var(--color-muted)]">
              <Calendar className="w-4 h-4" />
            </div>
            <select 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="bg-transparent px-3 py-1.5 text-sm font-medium focus:outline-none"
            >
              {months.map((m, i) => (
                <option key={m} value={i}>{m}</option>
              ))}
            </select>
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="bg-transparent px-3 py-1.5 text-sm font-medium focus:outline-none border-l border-[var(--color-border)]"
            >
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard 
          title="Net Worth" 
          value={netWorth} 
          icon={IndianRupee}
          color="text-[var(--color-accent)]"
        />
        <StatCard 
          title="Investments" 
          value={totalInvestmentValue} 
          icon={Briefcase}
          trend={investmentGain >= 0 ? 'up' : 'down'}
        />
        <StatCard 
          title={`${months[selectedMonth]} Income`} 
          value={totalIncome} 
          icon={TrendingUp}
          color="text-emerald-600"
        />
        <StatCard 
          title={`${months[selectedMonth]} Expenses`} 
          value={totalExpenses} 
          icon={TrendingDown}
          color="text-rose-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Expenses Chart */}
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-3xl p-8 space-y-6 shadow-sm">
          <h3 className="text-xl font-semibold font-serif">Expenses by Category</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '12px' }}
                  itemStyle={{ color: 'var(--color-foreground)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Budget Progress */}
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-3xl p-8 space-y-6 shadow-sm">
          <h3 className="text-xl font-semibold font-serif">Budget Progress</h3>
          <div className="space-y-6">
            {budgetStatus.length > 0 ? budgetStatus.map(b => (
              <div key={b.id} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{b.category}</span>
                  <span className="text-[var(--color-muted)]">{formatCurrency(b.spent)} / {formatCurrency(b.limit)}</span>
                </div>
                <div className="h-2 bg-[var(--color-border)]/50 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(b.percent, 100)}%` }}
                    className={cn(
                      "h-full rounded-full transition-all",
                      b.percent > 90 ? "bg-rose-500" : b.percent > 70 ? "bg-amber-500" : "bg-[var(--color-accent)]"
                    )}
                  />
                </div>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center py-12 text-[var(--color-muted)]/50 space-y-2">
                <AlertCircle className="w-8 h-8" />
                <p>No budgets set yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Debt & Loans Overview */}
      <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-3xl p-8 space-y-6 shadow-sm">
        <h3 className="text-xl font-semibold font-serif">Liabilities & Receivables</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-2">
            <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider font-semibold">Total Debt</p>
            <p className="text-3xl font-bold text-rose-600">{formatCurrency(totalDebt)}</p>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider font-semibold">Active Loans</p>
            <p className="text-3xl font-bold text-amber-600">{formatCurrency(totalLoans)}</p>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider font-semibold">I Owe People</p>
            <p className="text-3xl font-bold text-rose-400">{formatCurrency(totalCreditors)}</p>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider font-semibold">People Owe Me</p>
            <p className="text-3xl font-bold text-emerald-600">{formatCurrency(totalDebtors)}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function StatCard({ title, value, icon: Icon, trend, color }: any) {
  return (
    <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-3xl p-6 space-y-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 bg-[var(--color-background)] rounded-xl flex items-center justify-center border border-[var(--color-border)]">
          <Icon className={cn("w-5 h-5", color || "text-[var(--color-accent)]")} />
        </div>
        {trend && (
          <div className={cn(
            "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
            trend === 'up' ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
          )}>
            {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {trend === 'up' ? 'Positive' : 'Negative'}
          </div>
        )}
      </div>
      <div>
        <p className="text-sm text-[var(--color-muted)] font-medium">{title}</p>
        <p className="text-3xl font-bold tracking-tight">{formatCurrency(value)}</p>
      </div>
    </div>
  );
}
