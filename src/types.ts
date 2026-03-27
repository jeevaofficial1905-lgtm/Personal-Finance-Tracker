export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt?: string;
}

export interface Budget {
  id?: string;
  userId: string;
  category: string;
  limit: number;
  spent: number;
  period: string;
}

export interface Transaction {
  id?: string;
  userId: string;
  amount: number;
  category: string;
  date: string;
  description?: string;
  type: 'income' | 'expense';
}

export interface Debt {
  id?: string;
  userId: string;
  name: string;
  totalAmount: number;
  remainingAmount: number;
  dueDate?: string;
  interestRate?: number;
  monthlyPayment?: number;
}

export interface Loan {
  id?: string;
  userId: string;
  name: string;
  principal: number;
  interestRate: number;
  termMonths: number;
  startDate?: string;
  monthlyPayment?: number;
}

export interface Investment {
  id?: string;
  userId: string;
  name: string;
  type: 'stock' | 'crypto' | 'real-estate' | 'bond' | 'other';
  amountInvested: number;
  currentValue: number;
  purchaseDate: string;
  notes?: string;
}

export interface Creditor {
  id?: string;
  userId: string;
  name: string;
  amount: number;
  dueDate?: string;
  status: 'pending' | 'paid';
  notes?: string;
}

export interface Debtor {
  id?: string;
  userId: string;
  name: string;
  amount: number;
  dueDate?: string;
  status: 'pending' | 'collected';
  notes?: string;
}
