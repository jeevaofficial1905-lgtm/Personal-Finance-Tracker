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
