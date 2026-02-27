import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const upload = multer({ dest: 'uploads/' });

if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

let db: any;

function initDb(dbPath = "erp.db") {
  if (db) db.close();
  db = new Database(dbPath);
  
  db.exec(`
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
    status TEXT DEFAULT 'pending', -- 'pending', 'settled'
    description TEXT,
    FOREIGN KEY(vehicle_id) REFERENCES vehicles(id)
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT CHECK(type IN ('income', 'expense')) NOT NULL,
    UNIQUE(name, type)
  );

  -- Seed default categories
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

initDb();

try {
  db.prepare("ALTER TABLE vehicles ADD COLUMN image_url TEXT").run();
} catch (e) {}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/dashboard", (req, res) => {
    const { month } = req.query; // Expecting YYYY-MM
    const currentMonth = month ? month.toString() : new Date().toISOString().slice(0, 7);
    
    // Get opening balance for the specific month
    let openingBalanceRow = db.prepare("SELECT amount FROM monthly_opening_balances WHERE month = ?").get(currentMonth);
    
    // Fallback to general opening balance if no monthly one exists
    let openingBalance = openingBalanceRow ? openingBalanceRow.amount : 0;
    if (!openingBalanceRow) {
      const generalOpeningBalance = db.prepare("SELECT value FROM settings WHERE key = 'opening_balance'").get();
      openingBalance = generalOpeningBalance ? parseFloat(generalOpeningBalance.value) : 0;
    }
    
    const stats = db.prepare(`
      SELECT 
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expense
      FROM transactions
      WHERE strftime('%Y-%m', date) = ?
    `).get(currentMonth);

    const bankBalance = db.prepare("SELECT SUM(balance) as total FROM bank_accounts").get().total || 0;
    
    const incomeByVehicle = db.prepare(`
      SELECT v.name, SUM(t.amount) as amount
      FROM transactions t
      JOIN vehicles v ON t.vehicle_id = v.id
      WHERE t.type = 'income' AND strftime('%Y-%m', t.date) = ?
      GROUP BY v.id
    `).all(currentMonth);

    const expenseByVehicle = db.prepare(`
      SELECT v.name, SUM(t.amount) as amount
      FROM transactions t
      JOIN vehicles v ON t.vehicle_id = v.id
      WHERE t.type = 'expense' AND strftime('%Y-%m', t.date) = ?
      GROUP BY v.id
    `).all(currentMonth);

    res.json({
      openingBalance,
      totalIncome: stats.total_income || 0,
      totalExpense: stats.total_expense || 0,
      bankBalance,
      currentCash: openingBalance + (stats.total_income || 0) - (stats.total_expense || 0),
      incomeByVehicle,
      expenseByVehicle,
      month: currentMonth
    });
  });

  app.get("/api/vehicles", (req, res) => {
    const vehicles = db.prepare("SELECT * FROM vehicles").all();
    res.json(vehicles);
  });

  app.get("/api/categories", (req, res) => {
    const categories = db.prepare("SELECT * FROM categories").all();
    res.json(categories);
  });

  app.post("/api/categories", (req, res) => {
    const { name, type } = req.body;
    try {
      const info = db.prepare("INSERT INTO categories (name, type) VALUES (?, ?)").run(name, type);
      res.json({ id: info.lastInsertRowid });
    } catch (e) {
      res.status(400).json({ error: "Category already exists" });
    }
  });

  app.post("/api/vehicles", (req, res) => {
    const { name, number_plate, driver_name } = req.body;
    const info = db.prepare("INSERT INTO vehicles (name, number_plate, driver_name) VALUES (?, ?, ?)").run(name, number_plate, driver_name);
    res.json({ id: info.lastInsertRowid });
  });

  app.put("/api/vehicles/:id", (req, res) => {
    const { id } = req.params;
    const { name, number_plate, driver_name, status } = req.body;
    db.prepare("UPDATE vehicles SET name = ?, number_plate = ?, driver_name = ?, status = ? WHERE id = ?").run(name, number_plate, driver_name, status, id);
    res.json({ success: true });
  });

  app.delete("/api/vehicles/:id", (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM vehicles WHERE id = ?").run(id);
    res.json({ success: true });
  });

  app.post("/api/vehicles/upload-image/:id", upload.single('image'), (req: any, res) => {
    const { id } = req.params;
    if (!req.file) return res.status(400).send("No file uploaded");
    
    const imageUrl = `/uploads/${req.file.filename}`;
    db.prepare("UPDATE vehicles SET image_url = ? WHERE id = ?").run(imageUrl, id);
    res.json({ imageUrl });
  });

  app.get("/api/bank-accounts", (req, res) => {
    const accounts = db.prepare("SELECT * FROM bank_accounts").all();
    res.json(accounts);
  });

  app.post("/api/bank-accounts", (req, res) => {
    const { account_name, bank_name, balance } = req.body;
    const info = db.prepare("INSERT INTO bank_accounts (account_name, bank_name, balance) VALUES (?, ?, ?)").run(account_name, bank_name, balance);
    res.json({ id: info.lastInsertRowid });
  });

  app.get("/api/transactions", (req, res) => {
    const { month } = req.query;
    let query = `
      SELECT t.*, v.name as vehicle_name, ba.account_name, ba.bank_name
      FROM transactions t
      LEFT JOIN vehicles v ON t.vehicle_id = v.id
      LEFT JOIN bank_accounts ba ON t.bank_account_id = ba.id
    `;
    
    let params: any[] = [];
    if (month) {
      query += ` WHERE strftime('%Y-%m', t.date) = ? `;
      params.push(month);
    }
    
    query += ` ORDER BY t.date DESC `;
    
    if (!month) {
      query += ` LIMIT 50 `;
    }
    
    const transactions = db.prepare(query).all(...params);
    res.json(transactions);
  });

  app.post("/api/transactions", (req, res) => {
    const { type, category, amount, vehicle_id, bank_account_id, description } = req.body;
    
    const transaction = db.transaction(() => {
      db.prepare("INSERT INTO transactions (type, category, amount, vehicle_id, bank_account_id, description) VALUES (?, ?, ?, ?, ?, ?)").run(type, category, amount, vehicle_id, bank_account_id, description);
      
      if (bank_account_id) {
        const adjustment = type === 'income' ? amount : -amount;
        db.prepare("UPDATE bank_accounts SET balance = balance + ? WHERE id = ?").run(adjustment, bank_account_id);
      }
    });

    transaction();
    res.json({ success: true });
  });

  app.put("/api/transactions/:id", (req, res) => {
    const { id } = req.params;
    const { type, category, amount, vehicle_id, bank_account_id, description } = req.body;
    
    const oldTransaction = db.prepare("SELECT * FROM transactions WHERE id = ?").get(id);
    if (!oldTransaction) return res.status(404).json({ error: "Transaction not found" });

    const transaction = db.transaction(() => {
      // 1. Reverse old bank balance adjustment
      if (oldTransaction.bank_account_id) {
        const oldAdjustment = oldTransaction.type === 'income' ? -oldTransaction.amount : oldTransaction.amount;
        db.prepare("UPDATE bank_accounts SET balance = balance + ? WHERE id = ?").run(oldAdjustment, oldTransaction.bank_account_id);
      }

      // 2. Update the transaction
      db.prepare(`
        UPDATE transactions 
        SET type = ?, category = ?, amount = ?, vehicle_id = ?, bank_account_id = ?, description = ?
        WHERE id = ?
      `).run(type, category, amount, vehicle_id, bank_account_id, description, id);

      // 3. Apply new bank balance adjustment
      if (bank_account_id) {
        const newAdjustment = type === 'income' ? amount : -amount;
        db.prepare("UPDATE bank_accounts SET balance = balance + ? WHERE id = ?").run(newAdjustment, bank_account_id);
      }
    });

    transaction();
    res.json({ success: true });
  });

  app.delete("/api/transactions/:id", (req, res) => {
    const { id } = req.params;
    const transactionData = db.prepare("SELECT * FROM transactions WHERE id = ?").get(id);
    
    if (transactionData) {
      const dbTransaction = db.transaction(() => {
        if (transactionData.bank_account_id) {
          const adjustment = transactionData.type === 'income' ? -transactionData.amount : transactionData.amount;
          db.prepare("UPDATE bank_accounts SET balance = balance + ? WHERE id = ?").run(adjustment, transactionData.bank_account_id);
        }
        db.prepare("DELETE FROM transactions WHERE id = ?").run(id);
      });
      dbTransaction();
    }
    res.json({ success: true });
  });

  app.post("/api/settings/opening-balance", (req, res) => {
    const { value, month } = req.body;
    const currentMonth = month || new Date().toISOString().slice(0, 7);
    
    db.prepare(`
      INSERT INTO monthly_opening_balances (month, amount) 
      VALUES (?, ?) 
      ON CONFLICT(month) DO UPDATE SET amount = excluded.amount
    `).run(currentMonth, value);
    
    res.json({ success: true });
  });

  app.get("/api/driver-advances", (req, res) => {
    const advances = db.prepare(`
      SELECT da.*, v.name as vehicle_name, v.driver_name
      FROM driver_advances da
      JOIN vehicles v ON da.vehicle_id = v.id
      ORDER BY da.date DESC
    `).all();
    res.json(advances);
  });

  app.post("/api/driver-advances", (req, res) => {
    const { vehicle_id, amount, description } = req.body;
    
    const transaction = db.transaction(() => {
      // Record the advance
      db.prepare("INSERT INTO driver_advances (vehicle_id, amount, description) VALUES (?, ?, ?)").run(vehicle_id, amount, description);
      
      // Also record it as an expense in transactions
      db.prepare("INSERT INTO transactions (type, category, amount, vehicle_id, description) VALUES (?, ?, ?, ?, ?)").run('expense', 'Driver Advance', amount, vehicle_id, description);
    });

    transaction();
    res.json({ success: true });
  });

  app.post("/api/driver-advances/settle", (req, res) => {
    const { id } = req.body;
    db.prepare("UPDATE driver_advances SET status = 'settled' WHERE id = ?").run(id);
    res.json({ success: true });
  });

  app.delete("/api/driver-advances/:id", (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM driver_advances WHERE id = ?").run(id);
    res.json({ success: true });
  });

  // Backup & Export Routes
  app.get("/api/backup/db", (req, res) => {
    const dbPath = path.join(__dirname, "erp.db");
    res.download(dbPath, "sangjog_erp_backup.db");
  });

  app.get("/api/export/transactions", (req, res) => {
    const { month } = req.query;
    let query = `
      SELECT t.date, t.type, t.category, t.amount, v.name as vehicle, ba.account_name as bank, t.description
      FROM transactions t
      LEFT JOIN vehicles v ON t.vehicle_id = v.id
      LEFT JOIN bank_accounts ba ON t.bank_account_id = ba.id
    `;
    
    let params: any[] = [];
    if (month) {
      query += ` WHERE strftime('%Y-%m', t.date) = ? `;
      params.push(month);
    }
    
    query += ` ORDER BY t.date DESC `;
    
    const transactions = db.prepare(query).all(...params);

    if (transactions.length === 0) {
      return res.status(404).send("No transactions to export");
    }

    const headers = ["Date", "Type", "Category", "Amount", "Vehicle", "Bank", "Description"];
    const csvRows = [headers.join(",")];

    for (const t of transactions) {
      const row = [
        t.date,
        t.type,
        `"${t.category}"`,
        t.amount,
        `"${t.vehicle || ''}"`,
        `"${t.bank || ''}"`,
        `"${t.description || ''}"`
      ];
      csvRows.push(row.join(","));
    }

    const filename = month ? `transactions_${month}.csv` : "transactions_report.csv";
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
    res.send(csvRows.join("\n"));
  });

  app.post("/api/restore/db", upload.single('backup'), (req: any, res) => {
    if (!req.file) return res.status(400).send("No file uploaded");

    try {
      const tempPath = req.file.path;
      const targetPath = path.join(__dirname, "erp.db");

      // Close current connection
      db.close();

      // Replace file
      fs.copyFileSync(tempPath, targetPath);
      fs.unlinkSync(tempPath); // Delete temp file

      // Re-initialize
      initDb();

      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to restore database" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
