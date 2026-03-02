// import Database from "better-sqlite3"; // Removed for dynamic import
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isSupabase = process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY;

class DBService {
  private sqlite: any;
  private supabase: SupabaseClient | null = null;

  constructor() {
    this.init();
  }

  private async init() {
    if (isSupabase) {
      this.supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
    } else if (!process.env.NETLIFY) {
      try {
        const Database = (await import("better-sqlite3")).default;
        this.sqlite = new Database("erp.db");
        this.initSqlite();
      } catch (e) {
        console.error("Failed to initialize SQLite:", e);
      }
    }
  }

  private initSqlite() {
    this.sqlite.exec(`
      CREATE TABLE IF NOT EXISTS vehicles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        number_plate TEXT UNIQUE,
        driver_name TEXT,
        image_url TEXT,
        status TEXT DEFAULT 'active'
      );
      CREATE TABLE IF NOT EXISTS bank_accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        account_name TEXT NOT NULL,
        bank_name TEXT,
        balance REAL DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT CHECK(type IN ('income', 'expense')) NOT NULL,
        category TEXT NOT NULL,
        amount REAL NOT NULL,
        date TEXT DEFAULT CURRENT_TIMESTAMP,
        vehicle_id INTEGER,
        bank_account_id INTEGER,
        description TEXT,
        odometer_reading REAL,
        FOREIGN KEY(vehicle_id) REFERENCES vehicles(id),
        FOREIGN KEY(bank_account_id) REFERENCES bank_accounts(id)
      );
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      );
      CREATE TABLE IF NOT EXISTS monthly_opening_balances (
        month TEXT PRIMARY KEY,
        amount REAL DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS driver_advances (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vehicle_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        date TEXT DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'pending',
        description TEXT,
        FOREIGN KEY(vehicle_id) REFERENCES vehicles(id)
      );
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT CHECK(type IN ('income', 'expense')) NOT NULL,
        UNIQUE(name, type)
      );
      INSERT OR IGNORE INTO categories (name, type) VALUES 
      ('ভাড়া (Rent)', 'income'),
      ('তেল খরচ (Fuel)', 'expense'),
      ('ড্রাইভার বেতন (Driver Salary)', 'expense'),
      ('গাড়ি মেরামত (Maintenance)', 'expense'),
      ('টোল (Toll)', 'expense'),
      ('পুলিশ খরচ (Police Expense)', 'expense'),
      ('অন্যান্য (Others)', 'income'),
      ('অন্যান্য (Others)', 'expense');
      INSERT OR IGNORE INTO settings (key, value) VALUES ('opening_balance', '0');
    `);
  }

  async getVehicles() {
    if (this.supabase) {
      const { data } = await this.supabase.from('vehicles').select('*');
      return data;
    }
    return this.sqlite.prepare("SELECT * FROM vehicles").all();
  }

  async addVehicle(vehicle: any) {
    if (this.supabase) {
      const { data, error } = await this.supabase.from('vehicles').insert([vehicle]).select();
      if (error) throw error;
      return data[0];
    }
    const info = this.sqlite.prepare("INSERT INTO vehicles (name, number_plate, driver_name) VALUES (?, ?, ?)").run(vehicle.name, vehicle.number_plate, vehicle.driver_name);
    return { id: info.lastInsertRowid };
  }

  async updateVehicle(id: string, vehicle: any) {
    if (this.supabase) {
      const { data, error } = await this.supabase.from('vehicles').update(vehicle).eq('id', id).select();
      if (error) throw error;
      return data[0];
    }
    this.sqlite.prepare("UPDATE vehicles SET name = ?, number_plate = ?, driver_name = ?, status = ? WHERE id = ?").run(vehicle.name, vehicle.number_plate, vehicle.driver_name, vehicle.status, id);
    return { id };
  }

  async getCategories() {
    if (this.supabase) {
      const { data } = await this.supabase.from('categories').select('*');
      return data;
    }
    return this.sqlite.prepare("SELECT * FROM categories").all();
  }

  async addCategory(category: any) {
    if (this.supabase) {
      const { data, error } = await this.supabase.from('categories').insert([category]).select();
      if (error) throw error;
      return data[0];
    }
    const info = this.sqlite.prepare("INSERT INTO categories (name, type) VALUES (?, ?)").run(category.name, category.type);
    return { id: info.lastInsertRowid };
  }

  async getBankAccounts() {
    if (this.supabase) {
      const { data } = await this.supabase.from('bank_accounts').select('*');
      return data;
    }
    return this.sqlite.prepare("SELECT * FROM bank_accounts").all();
  }

  async addBankAccount(account: any) {
    if (this.supabase) {
      const { data, error } = await this.supabase.from('bank_accounts').insert([account]).select();
      if (error) throw error;
      return data[0];
    }
    const info = this.sqlite.prepare("INSERT INTO bank_accounts (account_name, bank_name, balance) VALUES (?, ?, ?)").run(account.account_name, account.bank_name, account.balance);
    return { id: info.lastInsertRowid };
  }

  async getTransactions(month?: string) {
    if (this.supabase) {
      let query = this.supabase.from('transactions').select('*, vehicles(name), bank_accounts(account_name)');
      if (month) {
        query = query.gte('date', `${month}-01`).lt('date', `${month}-32`);
      }
      const { data } = await query.order('date', { ascending: false });
      return data;
    }
    let sql = "SELECT t.*, v.name as vehicle_name, b.account_name as bank_account_name FROM transactions t LEFT JOIN vehicles v ON t.vehicle_id = v.id LEFT JOIN bank_accounts b ON t.bank_account_id = b.id";
    if (month) {
      return this.sqlite.prepare(`${sql} WHERE strftime('%Y-%m', t.date) = ? ORDER BY t.date DESC`).all(month);
    }
    return this.sqlite.prepare(`${sql} ORDER BY t.date DESC`).all();
  }

  async addTransaction(tx: any) {
    if (this.supabase) {
      const { data, error } = await this.supabase.from('transactions').insert([tx]).select();
      if (error) throw error;
      return data[0];
    }
    const info = this.sqlite.prepare("INSERT INTO transactions (type, category, amount, date, vehicle_id, bank_account_id, description, odometer_reading) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(tx.type, tx.category, tx.amount, tx.date, tx.vehicle_id, tx.bank_account_id, tx.description, tx.odometer_reading);
    return { id: info.lastInsertRowid };
  }

  async getDashboardStats(month: string) {
    if (this.supabase) {
      const { data: txs } = await this.supabase.from('transactions').select('*').gte('date', `${month}-01`).lt('date', `${month}-32`);
      const { data: banks } = await this.supabase.from('bank_accounts').select('balance');
      const { data: opening } = await this.supabase.from('monthly_opening_balances').select('amount').eq('month', month).single();
      const { data: settings } = await this.supabase.from('settings').select('value').eq('key', 'opening_balance').single();
      const { data: vehicles } = await this.supabase.from('vehicles').select('id, name');

      const totalIncome = txs?.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0) || 0;
      const totalExpense = txs?.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0) || 0;
      const bankBalance = banks?.reduce((sum, b) => sum + b.balance, 0) || 0;
      const openingBalance = opening?.amount || parseFloat(settings?.value || '0');
      
      const currentCash = openingBalance + totalIncome - totalExpense - bankBalance;

      const incomeByVehicle = vehicles?.map(v => ({
        name: v.name,
        amount: txs?.filter(t => t.type === 'income' && t.vehicle_id === v.id).reduce((sum, t) => sum + t.amount, 0) || 0
      })).filter(v => v.amount > 0) || [];

      const expenseByVehicle = vehicles?.map(v => ({
        name: v.name,
        amount: txs?.filter(t => t.type === 'expense' && t.vehicle_id === v.id).reduce((sum, t) => sum + t.amount, 0) || 0
      })).filter(v => v.amount > 0) || [];

      return {
        openingBalance,
        totalIncome,
        totalExpense,
        bankBalance,
        currentCash,
        totalBalance: currentCash + bankBalance,
        incomeByVehicle,
        expenseByVehicle,
        month
      };
    }
    
    // SQLite Fallback
    let openingBalanceRow = this.sqlite.prepare("SELECT amount FROM monthly_opening_balances WHERE month = ?").get(month);
    let openingBalance = openingBalanceRow ? openingBalanceRow.amount : 0;
    if (!openingBalanceRow) {
      const generalOpeningBalance = this.sqlite.prepare("SELECT value FROM settings WHERE key = 'opening_balance'").get();
      openingBalance = generalOpeningBalance ? parseFloat(generalOpeningBalance.value) : 0;
    }
    
    const stats = this.sqlite.prepare(`
      SELECT 
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expense
      FROM transactions
      WHERE strftime('%Y-%m', date) = ?
    `).get(month);

    const bankBalance = this.sqlite.prepare("SELECT SUM(balance) as total FROM bank_accounts").get().total || 0;
    const currentCash = openingBalance + (stats.total_income || 0) - (stats.total_expense || 0) - bankBalance;

    const incomeByVehicle = this.sqlite.prepare(`
      SELECT v.name, SUM(t.amount) as amount
      FROM transactions t
      JOIN vehicles v ON t.vehicle_id = v.id
      WHERE t.type = 'income' AND strftime('%Y-%m', t.date) = ?
      GROUP BY v.id
    `).all(month);

    const expenseByVehicle = this.sqlite.prepare(`
      SELECT v.name, SUM(t.amount) as amount
      FROM transactions t
      JOIN vehicles v ON t.vehicle_id = v.id
      WHERE t.type = 'expense' AND strftime('%Y-%m', t.date) = ?
      GROUP BY v.id
    `).all(month);

    return {
      openingBalance,
      totalIncome: stats.total_income || 0,
      totalExpense: stats.total_expense || 0,
      bankBalance,
      currentCash,
      totalBalance: currentCash + bankBalance,
      incomeByVehicle,
      expenseByVehicle,
      month
    };
  }

  async deleteVehicle(id: number) {
    if (this.supabase) {
      const { error } = await this.supabase.from('vehicles').delete().eq('id', id);
      if (error) throw error;
      return true;
    }
    const info = this.sqlite.prepare("DELETE FROM vehicles WHERE id = ?").run(id);
    return info.changes > 0;
  }

  async deleteBankAccount(id: number) {
    if (this.supabase) {
      // Check transactions first
      const { data } = await this.supabase.from('transactions').select('id').eq('bank_account_id', id).limit(1);
      if (data && data.length > 0) throw new Error("Cannot delete bank account with existing transactions");
      
      const { error } = await this.supabase.from('bank_accounts').delete().eq('id', id);
      if (error) throw error;
      return true;
    }
    const transactions = this.sqlite.prepare("SELECT id FROM transactions WHERE bank_account_id = ?").all(id);
    if (transactions.length > 0) throw new Error("Cannot delete bank account with existing transactions");
    const info = this.sqlite.prepare("DELETE FROM bank_accounts WHERE id = ?").run(id);
    return info.changes > 0;
  }

  async updateVehicleImage(id: string, imageUrl: string) {
    if (this.supabase) {
      const { error } = await this.supabase.from('vehicles').update({ image_url: imageUrl }).eq('id', id);
      if (error) throw error;
      return true;
    }
    this.sqlite.prepare("UPDATE vehicles SET image_url = ? WHERE id = ?").run(imageUrl, id);
    return true;
  }

  async deleteTransaction(id: number) {
    if (this.supabase) {
      const { error } = await this.supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;
      return true;
    }
    const info = this.sqlite.prepare("DELETE FROM transactions WHERE id = ?").run(id);
    return info.changes > 0;
  }

  async getSettings() {
    if (this.supabase) {
      const { data } = await this.supabase.from('settings').select('*');
      return data;
    }
    return this.sqlite.prepare("SELECT * FROM settings").all();
  }

  async updateSetting(key: string, value: string) {
    if (this.supabase) {
      const { error } = await this.supabase.from('settings').upsert({ key, value });
      if (error) throw error;
      return true;
    }
    this.sqlite.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run(key, value);
    return true;
  }

  async getMonthlyOpeningBalances() {
    if (this.supabase) {
      const { data } = await this.supabase.from('monthly_opening_balances').select('*');
      return data;
    }
    return this.sqlite.prepare("SELECT * FROM monthly_opening_balances").all();
  }

  async updateMonthlyOpeningBalance(month: string, amount: number) {
    if (this.supabase) {
      const { error } = await this.supabase.from('monthly_opening_balances').upsert({ month, amount });
      if (error) throw error;
      return true;
    }
    this.sqlite.prepare("INSERT OR REPLACE INTO monthly_opening_balances (month, amount) VALUES (?, ?)").run(month, amount);
    return true;
  }

  async getDriverAdvances(vehicleId?: number) {
    if (this.supabase) {
      let query = this.supabase.from('driver_advances').select('*, vehicles(name)');
      if (vehicleId) query = query.eq('vehicle_id', vehicleId);
      const { data } = await query.order('date', { ascending: false });
      return data;
    }
    let sql = "SELECT a.*, v.name as vehicle_name FROM driver_advances a JOIN vehicles v ON a.vehicle_id = v.id";
    if (vehicleId) return this.sqlite.prepare(`${sql} WHERE a.vehicle_id = ? ORDER BY a.date DESC`).all(vehicleId);
    return this.sqlite.prepare(`${sql} ORDER BY a.date DESC`).all();
  }

  async addDriverAdvance(advance: any) {
    if (this.supabase) {
      const { data, error } = await this.supabase.from('driver_advances').insert([advance]).select();
      if (error) throw error;
      return data[0];
    }
    const info = this.sqlite.prepare("INSERT INTO driver_advances (vehicle_id, amount, date, description) VALUES (?, ?, ?, ?)").run(advance.vehicle_id, advance.amount, advance.date, advance.description);
    return { id: info.lastInsertRowid };
  }

  async updateDriverAdvanceStatus(id: number, status: string) {
    if (this.supabase) {
      const { error } = await this.supabase.from('driver_advances').update({ status }).eq('id', id);
      if (error) throw error;
      return true;
    }
    this.sqlite.prepare("UPDATE driver_advances SET status = ? WHERE id = ?").run(status, id);
    return true;
  }

  async deleteDriverAdvance(id: number) {
    if (this.supabase) {
      const { error } = await this.supabase.from('driver_advances').delete().eq('id', id);
      if (error) throw error;
      return true;
    }
    const info = this.sqlite.prepare("DELETE FROM driver_advances WHERE id = ?").run(id);
    return info.changes > 0;
  }

  async importBackup(backup: any) {
    if (this.supabase) {
      // For Supabase, we would need to handle this carefully with transactions or multiple calls
      // For now, let's focus on SQLite for the "local" feel
      if (backup.vehicles) await this.supabase.from('vehicles').upsert(backup.vehicles);
      if (backup.bankAccounts) await this.supabase.from('bank_accounts').upsert(backup.bankAccounts);
      if (backup.transactions) await this.supabase.from('transactions').upsert(backup.transactions);
      if (backup.settings) await this.supabase.from('settings').upsert(backup.settings);
      if (backup.monthlyBalances) await this.supabase.from('monthly_opening_balances').upsert(backup.monthlyBalances);
      if (backup.driverAdvances) await this.supabase.from('driver_advances').upsert(backup.driverAdvances);
      if (backup.categories) await this.supabase.from('categories').upsert(backup.categories);
      return true;
    }

    // SQLite Import
    const run = (sql: string, params: any[]) => this.sqlite.prepare(sql).run(...params);
    
    this.sqlite.transaction(() => {
      if (backup.vehicles) {
        this.sqlite.prepare("DELETE FROM vehicles").run();
        backup.vehicles.forEach((v: any) => run("INSERT INTO vehicles (id, name, number_plate, driver_name, image_url, status) VALUES (?, ?, ?, ?, ?, ?)", [v.id, v.name, v.number_plate, v.driver_name, v.image_url, v.status]));
      }
      if (backup.bankAccounts) {
        this.sqlite.prepare("DELETE FROM bank_accounts").run();
        backup.bankAccounts.forEach((b: any) => run("INSERT INTO bank_accounts (id, account_name, bank_name, balance) VALUES (?, ?, ?, ?)", [b.id, b.account_name, b.bank_name, b.balance]));
      }
      if (backup.transactions) {
        this.sqlite.prepare("DELETE FROM transactions").run();
        backup.transactions.forEach((t: any) => run("INSERT INTO transactions (id, type, category, amount, date, vehicle_id, bank_account_id, description, odometer_reading) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", [t.id, t.type, t.category, t.amount, t.date, t.vehicle_id, t.bank_account_id, t.description, t.odometer_reading]));
      }
      if (backup.settings) {
        this.sqlite.prepare("DELETE FROM settings").run();
        backup.settings.forEach((s: any) => run("INSERT INTO settings (key, value) VALUES (?, ?)", [s.key, s.value]));
      }
      if (backup.monthlyBalances) {
        this.sqlite.prepare("DELETE FROM monthly_opening_balances").run();
        backup.monthlyBalances.forEach((m: any) => run("INSERT INTO monthly_opening_balances (month, amount) VALUES (?, ?)", [m.month, m.amount]));
      }
      if (backup.driverAdvances) {
        this.sqlite.prepare("DELETE FROM driver_advances").run();
        backup.driverAdvances.forEach((a: any) => run("INSERT INTO driver_advances (id, vehicle_id, amount, date, status, description) VALUES (?, ?, ?, ?, ?, ?)", [a.id, a.vehicle_id, a.amount, a.date, a.status, a.description]));
      }
      if (backup.categories) {
        this.sqlite.prepare("DELETE FROM categories").run();
        backup.categories.forEach((c: any) => run("INSERT INTO categories (id, name, type) VALUES (?, ?, ?)", [c.id, c.name, c.type]));
      }
    })();
    return true;
  }

  async resetDatabase() {
    if (this.supabase) {
      const tablesWithId = ['transactions', 'driver_advances', 'vehicles', 'bank_accounts', 'categories'];
      for (const table of tablesWithId) {
        await this.supabase.from(table).delete().neq('id', -1);
      }
      await this.supabase.from('settings').delete().neq('key', '_');
      await this.supabase.from('monthly_opening_balances').delete().neq('month', '_');

      // Re-seed default categories
      await this.supabase.from('categories').insert([
        { name: 'ভাড়া (Rent)', type: 'income' },
        { name: 'তেল খরচ (Fuel)', type: 'expense' },
        { name: 'ড্রাইভার বেতন (Driver Salary)', type: 'expense' },
        { name: 'গাড়ি মেরামত (Maintenance)', type: 'expense' },
        { name: 'টোল (Toll)', type: 'expense' },
        { name: 'পুলিশ খরচ (Police Expense)', type: 'expense' },
        { name: 'অন্যান্য (Others)', type: 'income' },
        { name: 'অন্যান্য (Others)', type: 'expense' }
      ]);
      await this.supabase.from('settings').insert([{ key: 'opening_balance', value: '0' }]);
      return true;
    }

    this.sqlite.transaction(() => {
      this.sqlite.prepare("DELETE FROM transactions").run();
      this.sqlite.prepare("DELETE FROM driver_advances").run();
      this.sqlite.prepare("DELETE FROM vehicles").run();
      this.sqlite.prepare("DELETE FROM bank_accounts").run();
      this.sqlite.prepare("DELETE FROM monthly_opening_balances").run();
      this.sqlite.prepare("DELETE FROM settings").run();
      this.sqlite.prepare("DELETE FROM categories").run();
      
      this.sqlite.prepare(`
        INSERT INTO categories (name, type) VALUES 
        ('ভাড়া (Rent)', 'income'),
        ('তেল খরচ (Fuel)', 'expense'),
        ('ড্রাইভার বেতন (Driver Salary)', 'expense'),
        ('গাড়ি মেরামত (Maintenance)', 'expense'),
        ('টোল (Toll)', 'expense'),
        ('পুলিশ খরচ (Police Expense)', 'expense'),
        ('অন্যান্য (Others)', 'income'),
        ('অন্যান্য (Others)', 'expense')
      `).run();
      this.sqlite.prepare("INSERT INTO settings (key, value) VALUES ('opening_balance', '0')").run();
    })();
    return true;
  }
}

export const dbService = new DBService();
