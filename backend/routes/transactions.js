const express = require("express");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const Transaction = require("../models/Transaction");

const router = express.Router();
const categories = Transaction.categories || [
  "Food",
  "Travel",
  "Shopping",
  "Bills",
  "Education",
  "Healthcare",
  "Entertainment",
  "Salary",
  "Investment",
  "Freelance",
  "Other"
];

const DATA_DIR = path.join(__dirname, "../data");
const DATA_FILE = path.join(DATA_DIR, "transactions.json");

function normalizeDate(dateInput) {
  if (typeof dateInput === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    return new Date(`${dateInput}T12:00:00.000Z`);
  }
  const parsed = new Date(dateInput);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

// Ensure local fallback file exists with rich initial sample data
function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    const today = new Date();
    const d = (daysAgo) => {
      const dt = new Date(today);
      dt.setDate(dt.getDate() - daysAgo);
      dt.setUTCHours(12, 0, 0, 0);
      return dt.toISOString();
    };

    const initialData = [
      {
        _id: new mongoose.Types.ObjectId().toString(),
        title: "Monthly Salary",
        amount: 65000,
        category: "Salary",
        type: "income",
        date: d(1),
        createdAt: d(1)
      },
      {
        _id: new mongoose.Types.ObjectId().toString(),
        title: "Grocery Shopping",
        amount: 3200,
        category: "Food",
        type: "expense",
        date: d(2),
        createdAt: d(2)
      },
      {
        _id: new mongoose.Types.ObjectId().toString(),
        title: "Electricity & WiFi Bill",
        amount: 2150,
        category: "Bills",
        type: "expense",
        date: d(3),
        createdAt: d(3)
      },
      {
        _id: new mongoose.Types.ObjectId().toString(),
        title: "Freelance Project Design",
        amount: 15000,
        category: "Freelance",
        type: "income",
        date: d(4),
        createdAt: d(4)
      },
      {
        _id: new mongoose.Types.ObjectId().toString(),
        title: "Weekend Dining & Cinema",
        amount: 1650,
        category: "Entertainment",
        type: "expense",
        date: d(5),
        createdAt: d(5)
      },
      {
        _id: new mongoose.Types.ObjectId().toString(),
        title: "Metro & Fuel",
        amount: 950,
        category: "Travel",
        type: "expense",
        date: d(6),
        createdAt: d(6)
      }
    ];

    fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2), "utf8");
  }
}

async function readLocalData() {
  ensureDataFile();
  try {
    const raw = await fs.promises.readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeLocalData(data) {
  ensureDataFile();
  await fs.promises.writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
}

// GET all transactions
router.get("/", async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const transactions = await Transaction.find().sort({ date: -1, createdAt: -1 });
      return res.json(transactions);
    }

    const local = await readLocalData();
    local.sort((a, b) => {
      const timeDiff = (new Date(b.date).getTime() || 0) - (new Date(a.date).getTime() || 0);
      if (timeDiff !== 0) return timeDiff;
      return (new Date(b.createdAt).getTime() || 0) - (new Date(a.createdAt).getTime() || 0);
    });
    return res.json(local);
  } catch (error) {
    console.error("Error reading transactions:", error);
    res.status(500).json({ message: "Could not load transactions." });
  }
});

// GET single transaction by ID
router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;

    if (mongoose.connection.readyState === 1) {
      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ message: "Invalid transaction ID." });
      }
      const transaction = await Transaction.findById(id);
      if (!transaction) return res.status(404).json({ message: "Transaction not found." });
      return res.json(transaction);
    }

    const local = await readLocalData();
    const found = local.find((t) => String(t._id || t.id) === String(id));
    if (!found) return res.status(404).json({ message: "Transaction not found." });
    return res.json(found);
  } catch (error) {
    console.error("Error reading transaction:", error);
    res.status(500).json({ message: "Could not load transaction." });
  }
});

// POST create transaction
router.post("/", async (req, res) => {
  try {
    const { title, amount, category, type, date } = req.body;
    const numAmount = Number(amount);

    if (
      typeof title !== "string" || !title.trim() || title.trim().length > 100 ||
      !Number.isFinite(numAmount) || numAmount < 0.01 ||
      !categories.includes(category) ||
      !["income", "expense"].includes(type) ||
      !date || !Number.isFinite(Date.parse(date))
    ) {
      return res.status(400).json({ message: "Please enter valid transaction details (minimum amount ₹0.01)." });
    }

    const roundedAmount = Math.round(numAmount * 100) / 100;
    const normDate = normalizeDate(date);

    if (mongoose.connection.readyState === 1) {
      const transaction = await Transaction.create({
        title: title.trim(),
        amount: roundedAmount,
        category,
        type,
        date: normDate
      });
      return res.status(201).json(transaction);
    }

    const local = await readLocalData();
    const newTransaction = {
      _id: new mongoose.Types.ObjectId().toString(),
      title: title.trim(),
      amount: roundedAmount,
      category,
      type,
      date: normDate.toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    local.unshift(newTransaction);
    await writeLocalData(local);
    return res.status(201).json(newTransaction);
  } catch (error) {
    console.error("Error creating transaction:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Could not save transaction." });
  }
});

// PUT update transaction
router.put("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const { title, amount, category, type, date } = req.body;
    const numAmount = Number(amount);

    if (
      typeof title !== "string" || !title.trim() || title.trim().length > 100 ||
      !Number.isFinite(numAmount) || numAmount < 0.01 ||
      !categories.includes(category) ||
      !["income", "expense"].includes(type) ||
      !date || !Number.isFinite(Date.parse(date))
    ) {
      return res.status(400).json({ message: "Please enter valid transaction details (minimum amount ₹0.01)." });
    }

    const roundedAmount = Math.round(numAmount * 100) / 100;
    const normDate = normalizeDate(date);

    if (mongoose.connection.readyState === 1) {
      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ message: "Invalid transaction ID." });
      }
      const updated = await Transaction.findByIdAndUpdate(
        id,
        {
          title: title.trim(),
          amount: roundedAmount,
          category,
          type,
          date: normDate
        },
        { new: true, runValidators: true }
      );
      if (!updated) return res.status(404).json({ message: "Transaction not found." });
      return res.json(updated);
    }

    const local = await readLocalData();
    const index = local.findIndex((t) => String(t._id || t.id) === String(id));
    if (index === -1) {
      return res.status(404).json({ message: "Transaction not found." });
    }

    local[index] = {
      ...local[index],
      title: title.trim(),
      amount: roundedAmount,
      category,
      type,
      date: normDate.toISOString(),
      updatedAt: new Date().toISOString()
    };
    await writeLocalData(local);
    return res.json(local[index]);
  } catch (error) {
    console.error("Error updating transaction:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Could not update transaction." });
  }
});

// DELETE transaction
router.delete("/:id", async (req, res) => {
  try {
    const id = req.params.id;

    if (mongoose.connection.readyState === 1) {
      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ message: "Invalid transaction ID." });
      }
      const deleted = await Transaction.findByIdAndDelete(id);
      if (!deleted) return res.status(404).json({ message: "Transaction not found." });
      return res.json({ message: "Transaction deleted.", id });
    }

    const local = await readLocalData();
    const index = local.findIndex((t) => String(t._id || t.id) === String(id));
    if (index === -1) {
      return res.status(404).json({ message: "Transaction not found." });
    }
    local.splice(index, 1);
    await writeLocalData(local);
    return res.json({ message: "Transaction deleted.", id });
  } catch (error) {
    console.error("Error deleting transaction:", error);
    res.status(500).json({ message: "Could not delete transaction." });
  }
});

module.exports = router;
