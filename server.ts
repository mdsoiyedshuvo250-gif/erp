import express from "express";
// import { createServer as createViteServer } from "vite"; // Removed for dynamic import
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import fs from "fs";
import { dbService } from "./src/services/dbService";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const upload = multer({ dest: process.env.NETLIFY ? '/tmp' : 'uploads/' });

if (!process.env.NETLIFY && !fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

export const app = express();
const PORT = 3000;

export async function startServer() {
  app.use(express.json());

  // API Routes
  app.get("/api/dashboard", async (req, res) => {
    const { month } = req.query;
    const currentMonth = month ? month.toString() : new Date().toISOString().slice(0, 7);
    try {
      const stats = await dbService.getDashboardStats(currentMonth);
      res.json(stats);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/vehicles", async (req, res) => {
    try {
      const vehicles = await dbService.getVehicles();
      res.json(vehicles);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await dbService.getCategories();
      res.json(categories);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/categories", async (req, res) => {
    const { name, type } = req.body;
    try {
      const result = await dbService.addCategory({ name, type });
      res.json(result);
    } catch (e) {
      res.status(400).json({ error: "Category already exists" });
    }
  });

  app.post("/api/vehicles", async (req, res) => {
    const { name, number_plate, driver_name } = req.body;
    try {
      const result = await dbService.addVehicle({ name, number_plate, driver_name });
      res.json(result);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });

  app.put("/api/vehicles/:id", async (req, res) => {
    const { id } = req.params;
    const { name, number_plate, driver_name, status } = req.body;
    try {
      await dbService.updateVehicle(id, { name, number_plate, driver_name, status });
      res.json({ success: true });
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });

  app.delete("/api/vehicles/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const deleted = await dbService.deleteVehicle(Number(id));
      res.json({ success: true, deleted });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/bank-accounts/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const deleted = await dbService.deleteBankAccount(Number(id));
      res.json({ success: true, deleted });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/vehicles/upload-image/:id", upload.single('image'), async (req: any, res) => {
    const { id } = req.params;
    if (!req.file) return res.status(400).send("No file uploaded");
    
    const imageUrl = `/uploads/${req.file.filename}`;
    try {
      await dbService.updateVehicleImage(id, imageUrl);
      res.json({ imageUrl });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/bank-accounts", async (req, res) => {
    try {
      const accounts = await dbService.getBankAccounts();
      res.json(accounts);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/bank-accounts", async (req, res) => {
    const { account_name, bank_name, balance } = req.body;
    try {
      const result = await dbService.addBankAccount({ account_name, bank_name, balance });
      res.json(result);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });

  app.get("/api/transactions", async (req, res) => {
    const { month } = req.query;
    try {
      const transactions = await dbService.getTransactions(month?.toString());
      res.json(transactions);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/transactions", async (req, res) => {
    const { type, category, amount, date, vehicle_id, bank_account_id, description, odometer_reading } = req.body;
    try {
      const result = await dbService.addTransaction({
        type, category, amount, date, vehicle_id, bank_account_id, description, odometer_reading
      });
      res.json(result);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });

  app.delete("/api/transactions/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const deleted = await dbService.deleteTransaction(Number(id));
      res.json({ success: true, deleted });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await dbService.getSettings();
      res.json(settings);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/settings", async (req, res) => {
    const { key, value } = req.body;
    try {
      await dbService.updateSetting(key, value);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/monthly-opening-balances", async (req, res) => {
    try {
      const balances = await dbService.getMonthlyOpeningBalances();
      res.json(balances);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/monthly-opening-balances", async (req, res) => {
    const { month, amount } = req.body;
    try {
      await dbService.updateMonthlyOpeningBalance(month, amount);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/driver-advances", async (req, res) => {
    const { vehicle_id } = req.query;
    try {
      const advances = await dbService.getDriverAdvances(vehicle_id ? Number(vehicle_id) : undefined);
      res.json(advances);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/driver-advances", async (req, res) => {
    const { vehicle_id, amount, date, description } = req.body;
    try {
      const result = await dbService.addDriverAdvance({ vehicle_id, amount, date, description });
      res.json(result);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });

  app.put("/api/driver-advances/:id/status", async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
      await dbService.updateDriverAdvanceStatus(Number(id), status);
      res.json({ success: true });
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });

  app.delete("/api/driver-advances/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const deleted = await dbService.deleteDriverAdvance(Number(id));
      res.json({ success: true, deleted });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/export/transactions", async (req, res) => {
    try {
      const transactions = await dbService.getTransactions();
      const csvHeader = "ID,Type,Category,Amount,Date,Vehicle,Bank Account,Description,Odometer\n";
      const csvRows = transactions.map((t: any) => {
        return `${t.id},${t.type},${t.category},${t.amount},${t.date},"${t.vehicle_name || ''}","${t.bank_account_name || ''}","${t.description || ''}",${t.odometer_reading || ''}`;
      }).join("\n");
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=transactions.csv');
      res.send(csvHeader + csvRows);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/backup/export", async (req, res) => {
    try {
      const vehicles = await dbService.getVehicles();
      const bankAccounts = await dbService.getBankAccounts();
      const transactions = await dbService.getTransactions();
      const settings = await dbService.getSettings();
      const monthlyBalances = await dbService.getMonthlyOpeningBalances();
      const driverAdvances = await dbService.getDriverAdvances();
      const categories = await dbService.getCategories();

      const backup = {
        vehicles,
        bankAccounts,
        transactions,
        settings,
        monthlyBalances,
        driverAdvances,
        categories,
        exportedAt: new Date().toISOString()
      };

      res.json(backup);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/backup/import", async (req, res) => {
    const backup = req.body;
    try {
      await dbService.importBackup(backup);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/backup/reset", async (req, res) => {
    try {
      await dbService.resetDatabase();
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else if (!process.env.NETLIFY) {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api")) return next();
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

  return app;
}

if (process.env.NODE_ENV !== "production" || !process.env.NETLIFY) {
  startServer().then((app) => {
    app.listen(3000, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:3000`);
    });
  });
}
