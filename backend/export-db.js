const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const mongoose = require("mongoose");
const fs = require("fs");
const Transaction = require("./models/Transaction");

const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/personalExpenseTracker";
const outputFile = path.join(__dirname, "data", "mongo-data.json");

async function exportData() {
  console.log("Connecting to MongoDB to export data...");
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    const docs = await Transaction.find().lean();
    
    fs.mkdirSync(path.join(__dirname, "data"), { recursive: true });
    fs.writeFileSync(outputFile, JSON.stringify(docs, null, 2), "utf8");
    
    console.log(`\n✅ Successfully exported ${docs.length} transaction(s) from MongoDB!`);
    console.log(`📁 File saved at: ${outputFile}`);
    console.log("You can now open 'backend/data/mongo-data.json' in your editor to view your records.\n");
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("❌ Export failed:", err.message);
    console.log("\nMake sure MongoDB is running before running this script.");
    process.exit(1);
  }
}

exportData();

