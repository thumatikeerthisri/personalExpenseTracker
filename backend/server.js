const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const Transaction = require("./models/Transaction");
const transactionRoutes = require("./routes/transactions");

const PORT = Number(process.env.PORT) || 5001;
const RAW_MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/personalExpenseTracker";

const app = express();

// Flexible CORS for local development
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow tools like curl, Postman, or requests without origin
      if (!origin) return callback(null, true);
      // Allow localhost and 127.0.0.1 on any port
      if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }
      if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true
  })
);

app.use(express.json({ limit: "20kb" }));

app.get(["/", "/api"], (req, res) => {
  const isMongo = mongoose.connection.readyState === 1;
  res.json({
    message: "Personal Expense Tracker API is running.",
    database: isMongo ? "MongoDB connected" : "Local File Storage (Fallback mode)",
    port: PORT
  });
});

app.use(["/api/transactions", "/transactions"], transactionRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({ message: "Invalid JSON format in request body." });
  }
  console.error("Unhandled server error:", err);
  return res.status(500).json({ message: "Internal server error." });
});

async function seedMongoIfEmpty() {
  try {
    const count = await Transaction.countDocuments();
    if (count === 0) {
      const today = new Date();
      const d = (daysAgo) => {
        const dt = new Date(today);
        dt.setDate(dt.getDate() - daysAgo);
        dt.setUTCHours(12, 0, 0, 0);
        return dt;
      };
      await Transaction.insertMany([
        { title: "Monthly Salary", amount: 65000, category: "Salary", type: "income", date: d(1) },
        { title: "Grocery Shopping", amount: 3200, category: "Food", type: "expense", date: d(2) },
        { title: "Electricity & WiFi Bill", amount: 2150, category: "Bills", type: "expense", date: d(3) },
        { title: "Freelance Project Design", amount: 15000, category: "Freelance", type: "income", date: d(4) },
        { title: "Weekend Dining & Cinema", amount: 1650, category: "Entertainment", type: "expense", date: d(5) },
        { title: "Metro & Fuel", amount: 950, category: "Travel", type: "expense", date: d(6) }
      ]);
      console.log("Seeded initial sample transactions into MongoDB.");
    }
  } catch (seedErr) {
    console.warn("Could not seed MongoDB:", seedErr.message);
  }
}

function hasPlaceholder(uri) {
  if (!uri || typeof uri !== "string") return true;
  // Check for angle brackets like <password>, <cluster-address> or sample placeholder tokens
  return (
    /<[^>]*>/.test(uri) ||
    uri.includes("YOUR_CLUSTER") ||
    uri.includes("YOUR_USERNAME") ||
    uri.includes("YOUR_PASSWORD") ||
    uri.includes("<cluster-address>")
  );
}

// Middleware ensuring DB connection in serverless (e.g. Vercel) environments
app.use(async (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    await ensureDbConnected().catch(() => {});
  }
  next();
});

let isConnected = false;

async function ensureDbConnected() {
  if (mongoose.connection.readyState === 1) {
    return;
  }
  let targetUri = RAW_MONGO_URI;

  if (process.env.VERCEL && (targetUri.includes("localhost") || targetUri.includes("127.0.0.1"))) {
    console.warn("\n⚠️  [Vercel Configuration Notice]");
    console.warn("Your MONGO_URI is set to localhost, which is not reachable on Vercel cloud.");
    console.warn("Please set MONGO_URI to a MongoDB Atlas connection string in Vercel Project Settings.\n");
    return;
  }

  if (hasPlaceholder(RAW_MONGO_URI)) {
    console.warn("\n⚠️  [Configuration Notice]");
    console.warn("Your MONGO_URI contains placeholder brackets '<...>' or sample text.");
    console.warn("To use MongoDB Atlas, replace '<username>', '<password>', and '<cluster-address>' with your actual MongoDB details.");
    console.warn("Switching to local MongoDB / local file fallback so the server can run without crashing.\n");
    targetUri = "mongodb://127.0.0.1:27017/personalExpenseTracker";
  }

  try {
    await mongoose.connect(targetUri, {
      serverSelectionTimeoutMS: 5000
    });
    console.log(`MongoDB connected successfully to ${mongoose.connection.host}/${mongoose.connection.name}`);
    await seedMongoIfEmpty();
  } catch (error) {
    console.warn(`[Notice] MongoDB is not reachable (${error.message}).`);
    console.warn("Using local JSON file storage (data/transactions.json) as a fallback.");
  }
}

// Start HTTP server immediately for local development (with auto-fallback if port blocked)
function startServer(portToTry) {
  const server = app.listen(portToTry, () => {
    console.log(`Backend running at http://localhost:${portToTry}`);
  });

  server.on("error", (err) => {
    if ((err.code === "EADDRINUSE" || err.code === "EACCES") && portToTry < 5010) {
      console.warn(`[Port Notice] Port ${portToTry} is unavailable (${err.code}). Trying port ${portToTry + 1}...`);
      startServer(portToTry + 1);
    } else {
      console.error("Server listen error:", err.message);
    }
  });
}

if (!process.env.VERCEL) {
  startServer(PORT);
  ensureDbConnected().catch(() => {});
}

module.exports = app;
