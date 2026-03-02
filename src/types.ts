export interface Vehicle {
  id: number;
  name: string;
  number_plate: string;
  driver_name: string;
  image_url?: string;
  status: string;
}

export interface BankAccount {
  id: number;
  account_name: string;
  bank_name: string;
  balance: number;
}

export interface Transaction {
  id: number;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  date: string;
  vehicle_id?: number;
  bank_account_id?: number;
  description?: string;
  odometer_reading?: number;
}

export interface DriverAdvance {
  id: number;
  vehicle_id: number;
  vehicle_name: string;
  driver_name: string;
  amount: number;
  date: string;
  status: 'pending' | 'settled';
  description?: string;
}

export interface DashboardData {
  openingBalance: number;
  totalIncome: number;
  totalExpense: number;
  bankBalance: number;
  currentCash: number;
  incomeByVehicle: { name: string; amount: number }[];
  expenseByVehicle: { name: string; amount: number }[];
  month: string;
}
