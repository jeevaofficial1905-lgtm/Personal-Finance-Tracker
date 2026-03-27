import React, { useState, useMemo } from 'react';
import { Transaction } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { 
  TrendingUp, 
  TrendingDown, 
  PieChart as PieChartIcon, 
  BarChart3, 
  ArrowUpRight, 
  ArrowDownRight,
  Target,
  Percent,
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
  Legend,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { motion } from 'motion/react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface IncomeExpenseManagerProps {
  transactions: Transaction[];
}

export function IncomeExpenseManager({ transactions }: IncomeExpenseManagerProps) {
  const now = new Date();
  const [timeRange, setTimeRange] = useState<6 | 12>(6);

  // Calculate monthly data for the chart
  const chartData = useMemo(() => {
    const data: any[] = [];
    for (let i = timeRange - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthLabel = d.toLocaleString('default', { month: 'short' });
      const yearLabel = d.getFullYear();
      
      const monthTransactions = transactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate.getMonth() === d.getMonth() && tDate.getFullYear() === d.getFullYear();
      });

      const income = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((acc, t) => acc + t.amount, 0);
      
      const expense = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => acc + t.amount, 0);

      data.push({
        name: `${monthLabel} ${yearLabel}`,
        income,
        expense,
        savings: income - expense
      });
    }
    return data;
  }, [transactions, timeRange]);

  // Overall stats for the selected time range
  const stats = useMemo(() => {
    const totalIncome = chartData.reduce((acc, d) => acc + d.income, 0);
    const totalExpense = chartData.reduce((acc, d) => acc + d.expense, 0);
    const totalSavings = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? (totalSavings / totalIncome) * 100 : 0;

    return {
      totalIncome,
      totalExpense,
      totalSavings,
      savingsRate
    };
  }, [chartData]);

  // Category breakdown for the selected time range
  const categoryData = useMemo(() => {
    const startDate = new Date(now.getFullYear(), now.getMonth() - (timeRange - 1), 1);
    const filtered = transactions.filter(t => new Date(t.date) >= startDate);

    const incomeByCat = filtered
      .filter(t => t.type === 'income')
      .reduce((acc: any, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {});

    const expenseByCat = filtered
      .filter(t => t.type === 'expense')
      .reduce((acc: any, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {});

    return {
      income: Object.entries(incomeByCat).map(([name, value]) => ({ name, value })),
      expense: Object.entries(expenseByCat).map(([name, value]) => ({ name, value }))
    };
  }, [transactions, timeRange]);

  const COLORS = ['#5A5A40', '#A0522D', '#708090', '#8FBC8F', '#BDB76B', '#CD853F', '#6B8E23'];

  const exportMonthlyPDF = (monthName: string) => {
    const doc = new jsPDF();
    const [month, year] = monthName.split(' ');
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(90, 90, 64); // --color-accent
    doc.text(`Financial Report: ${monthName}`, 14, 22);
    
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 30);

    // Filter transactions for this month
    const monthTransactions = transactions.filter(t => {
      const d = new Date(t.date);
      const m = d.toLocaleString('default', { month: 'short' });
      const y = d.getFullYear().toString();
      return m === month && y === year;
    });

    const income = monthTransactions.filter(t => t.type === 'income');
    const expenses = monthTransactions.filter(t => t.type === 'expense');
    
    const totalIncome = income.reduce((acc, t) => acc + t.amount, 0);
    const totalExpense = expenses.reduce((acc, t) => acc + t.amount, 0);
    const savings = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? (savings / totalIncome) * 100 : 0;

    // Summary Table
    autoTable(doc, {
      startY: 40,
      head: [['Metric', 'Value']],
      body: [
        ['Total Income', formatCurrency(totalIncome)],
        ['Total Expenses', formatCurrency(totalExpense)],
        ['Net Savings', formatCurrency(savings)],
        ['Savings Rate', `${savingsRate.toFixed(1)}%`],
      ],
      theme: 'striped',
      headStyles: { fillColor: [90, 90, 64] },
    });

    // Transactions Table
    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text('Transaction Details', 14, (doc as any).lastAutoTable.finalY + 15);

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [['Date', 'Description', 'Category', 'Type', 'Amount']],
      body: monthTransactions.map(t => [
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

    doc.save(`WealthTrack_Report_${month}_${year}.pdf`);
  };

  const exportFullReport = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(22);
    doc.setTextColor(90, 90, 64);
    doc.text(`Financial Summary: Last ${timeRange} Months`, 14, 22);
    
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 30);

    autoTable(doc, {
      startY: 40,
      head: [['Month', 'Income', 'Expense', 'Savings', 'Rate']],
      body: chartData.slice().reverse().map(row => [
        row.name,
        formatCurrency(row.income),
        formatCurrency(row.expense),
        formatCurrency(row.savings),
        `${row.income > 0 ? ((row.savings / row.income) * 100).toFixed(1) : 0}%`
      ]),
      headStyles: { fillColor: [90, 90, 64] },
    });

    doc.save(`WealthTrack_Full_Report_${timeRange}_Months.pdf`);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight font-serif">Income vs Expense</h1>
          <p className="text-[var(--color-muted)]">Analyze your cash flow trends and savings performance.</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={exportFullReport}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl text-sm font-medium hover:bg-[var(--color-background)] transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            Export Full Report
          </button>
          <div className="flex bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-1 shadow-sm">
            <button
              onClick={() => setTimeRange(6)}
              className={cn(
                "px-4 py-1.5 rounded-lg text-sm font-medium transition-all",
                timeRange === 6 ? "bg-[var(--color-accent)] text-white" : "text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
              )}
            >
              Last 6 Months
            </button>
            <button
              onClick={() => setTimeRange(12)}
              className={cn(
                "px-4 py-1.5 rounded-lg text-sm font-medium transition-all",
                timeRange === 12 ? "bg-[var(--color-accent)] text-white" : "text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
              )}
            >
              Last 12 Months
            </button>
          </div>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-3xl p-6 space-y-4 shadow-sm">
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-100">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm text-[var(--color-muted)] font-medium">Total Income</p>
            <p className="text-2xl font-bold text-emerald-700">{formatCurrency(stats.totalIncome)}</p>
          </div>
        </div>
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-3xl p-6 space-y-4 shadow-sm">
          <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center border border-rose-100">
            <TrendingDown className="w-5 h-5 text-rose-600" />
          </div>
          <div>
            <p className="text-sm text-[var(--color-muted)] font-medium">Total Expenses</p>
            <p className="text-2xl font-bold text-rose-700">{formatCurrency(stats.totalExpense)}</p>
          </div>
        </div>
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-3xl p-6 space-y-4 shadow-sm">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100">
            <Target className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-[var(--color-muted)] font-medium">Net Savings</p>
            <p className={cn(
              "text-2xl font-bold",
              stats.totalSavings >= 0 ? "text-blue-700" : "text-rose-700"
            )}>
              {formatCurrency(stats.totalSavings)}
            </p>
          </div>
        </div>
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-3xl p-6 space-y-4 shadow-sm">
          <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center border border-amber-100">
            <Percent className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-sm text-[var(--color-muted)] font-medium">Savings Rate</p>
            <p className="text-2xl font-bold text-amber-700">{stats.savingsRate.toFixed(1)}%</p>
          </div>
        </div>
      </div>

      {/* Main Trend Chart */}
      <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-3xl p-8 space-y-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold font-serif flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[var(--color-accent)]" />
            Cash Flow Trend
          </h3>
        </div>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'var(--color-muted)', fontSize: 12 }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'var(--color-muted)', fontSize: 12 }}
                tickFormatter={(value) => `₹${value}`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--color-card)', 
                  border: '1px solid var(--color-border)', 
                  borderRadius: '16px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                }}
                cursor={{ fill: 'var(--color-border)', opacity: 0.2 }}
              />
              <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '20px' }} />
              <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} barSize={30} />
              <Bar dataKey="expense" name="Expense" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={30} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Income Breakdown */}
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-3xl p-8 space-y-6 shadow-sm">
          <h3 className="text-xl font-semibold font-serif flex items-center gap-2">
            <ArrowUpRight className="w-5 h-5 text-emerald-600" />
            Income Sources
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData.income}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.income.map((entry, index) => (
                    <Cell key={`cell-income-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '12px' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Breakdown */}
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-3xl p-8 space-y-6 shadow-sm">
          <h3 className="text-xl font-semibold font-serif flex items-center gap-2">
            <ArrowDownRight className="w-5 h-5 text-rose-600" />
            Expense Categories
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData.expense}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.expense.map((entry, index) => (
                    <Cell key={`cell-expense-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '12px' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Monthly Performance Table */}
      <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-3xl overflow-hidden shadow-sm">
        <div className="p-8 border-b border-[var(--color-border)]">
          <h3 className="text-xl font-semibold font-serif">Monthly Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[var(--color-background)]/50 text-[var(--color-muted)] text-xs uppercase tracking-wider font-bold">
                <th className="px-8 py-4">Month</th>
                <th className="px-8 py-4">Income</th>
                <th className="px-8 py-4">Expense</th>
                <th className="px-8 py-4">Savings</th>
                <th className="px-8 py-4">Rate</th>
                <th className="px-8 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {chartData.slice().reverse().map((row, i) => (
                <tr key={i} className="hover:bg-[var(--color-background)]/30 transition-colors">
                  <td className="px-8 py-4 font-medium">{row.name}</td>
                  <td className="px-8 py-4 text-emerald-600 font-semibold">{formatCurrency(row.income)}</td>
                  <td className="px-8 py-4 text-rose-600 font-semibold">{formatCurrency(row.expense)}</td>
                  <td className={cn(
                    "px-8 py-4 font-bold",
                    row.savings >= 0 ? "text-blue-600" : "text-rose-600"
                  )}>
                    {formatCurrency(row.savings)}
                  </td>
                  <td className="px-8 py-4 text-[var(--color-muted)] font-medium">
                    {row.income > 0 ? ((row.savings / row.income) * 100).toFixed(1) : 0}%
                  </td>
                  <td className="px-8 py-4 text-right">
                    <button
                      onClick={() => exportMonthlyPDF(row.name)}
                      className="p-2 hover:bg-[var(--color-background)] rounded-lg transition-colors text-[var(--color-accent)]"
                      title="Download Monthly PDF"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
