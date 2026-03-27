import { Budget, Transaction, Debt, Loan } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight,
  AlertCircle
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

interface DashboardProps {
  budgets: Budget[];
  transactions: Transaction[];
  debts: Debt[];
  loans: Loan[];
}

export function Dashboard({ budgets, transactions, debts, loans }: DashboardProps) {
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);
  
  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  const balance = totalIncome - totalExpenses;

  const totalDebt = debts.reduce((acc, d) => acc + d.remainingAmount, 0);
  const totalLoans = loans.reduce((acc, l) => acc + l.principal, 0);

  // Chart data: Expenses by category
  const expensesByCategory = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc: any, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});

  const pieData = Object.entries(expensesByCategory).map(([name, value]) => ({
    name,
    value
  }));

  const COLORS = ['#ffffff', '#888888', '#444444', '#222222', '#666666'];

  // Budget status
  const budgetStatus = budgets.map(b => {
    const spent = transactions
      .filter(t => t.type === 'expense' && t.category === b.category)
      .reduce((acc, t) => acc + t.amount, 0);
    return {
      ...b,
      spent,
      percent: (spent / b.limit) * 100
    };
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <p className="text-white/50">Your financial health at a glance.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Total Balance" 
          value={balance} 
          icon={DollarSign}
          trend={balance >= 0 ? 'up' : 'down'}
        />
        <StatCard 
          title="Monthly Income" 
          value={totalIncome} 
          icon={TrendingUp}
          color="text-emerald-400"
        />
        <StatCard 
          title="Monthly Expenses" 
          value={totalExpenses} 
          icon={TrendingDown}
          color="text-rose-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Expenses Chart */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6">
          <h3 className="text-xl font-semibold">Expenses by Category</h3>
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
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Budget Progress */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6">
          <h3 className="text-xl font-semibold">Budget Progress</h3>
          <div className="space-y-6">
            {budgetStatus.length > 0 ? budgetStatus.map(b => (
              <div key={b.id} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{b.category}</span>
                  <span className="text-white/50">{formatCurrency(b.spent)} / {formatCurrency(b.limit)}</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(b.percent, 100)}%` }}
                    className={cn(
                      "h-full rounded-full transition-all",
                      b.percent > 90 ? "bg-rose-500" : b.percent > 70 ? "bg-amber-500" : "bg-white"
                    )}
                  />
                </div>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center py-12 text-white/30 space-y-2">
                <AlertCircle className="w-8 h-8" />
                <p>No budgets set yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Debt & Loans Overview */}
      <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6">
        <h3 className="text-xl font-semibold">Liabilities</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <p className="text-sm text-white/50 uppercase tracking-wider font-semibold">Total Debt</p>
            <p className="text-4xl font-bold text-rose-400">{formatCurrency(totalDebt)}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-white/50 uppercase tracking-wider font-semibold">Active Loans</p>
            <p className="text-4xl font-bold text-amber-400">{formatCurrency(totalLoans)}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function StatCard({ title, value, icon: Icon, trend, color }: any) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10">
          <Icon className={cn("w-5 h-5", color || "text-white")} />
        </div>
        {trend && (
          <div className={cn(
            "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
            trend === 'up' ? "bg-emerald-400/10 text-emerald-400" : "bg-rose-400/10 text-rose-400"
          )}>
            {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {trend === 'up' ? 'Positive' : 'Negative'}
          </div>
        )}
      </div>
      <div>
        <p className="text-sm text-white/50 font-medium">{title}</p>
        <p className="text-3xl font-bold tracking-tight">{formatCurrency(value)}</p>
      </div>
    </div>
  );
}
