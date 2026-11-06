const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const mongoose = require("mongoose");
const fs = require("fs");
const Transaction = require("./models/Transaction");

const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/personalExpenseTracker";
const inputFile = path.join(__dirname, "data", "transactions.json");

async function importData() {
  console.log("Starting import to MongoDB...");

  if (!fs.existsSync(inputFile)) {
    console.error(`❌ Data file not found at: ${inputFile}`);
    process.exit(1);
  }

  let rawData;
  try {
    rawData = JSON.parse(fs.readFileSync(inputFile, "utf8"));
    if (!Array.isArray(rawData)) {
      throw new Error("JSON file must contain an array of transactions.");
    }
  } catch (parseErr) {
    console.error("❌ Failed to parse transactions.json:", parseErr.message);
    process.exit(1);
  }

  console.log(`Found ${rawData.length} transaction(s) in JSON file.`);

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log(`Connected to MongoDB (${mongoose.connection.name}).\n`);

    let imported = 0;
    let skipped = 0;

    for (const item of rawData) {
      // Check if transaction already exists by ID or by same title + date + amount
      let query;
      if (item._id && mongoose.isValidObjectId(item._id)) {
        query = { _id: item._id };
      } else {
        query = {
          title: item.title,
          amount: item.amount,
          date: new Date(item.date)
        };
      }

      const existing = await Transaction.findOne(query);
      if (existing) {
        skipped++;
      } else {
        const docToInsert = {
          title: item.title,
          amount: Number(item.amount),
          category: item.category,
          type: item.type,
          date: new Date(item.date)
        };
        if (item._id && mongoose.isValidObjectId(item._id)) {
          docToInsert._id = item._id;
        }
        await Transaction.create(docToInsert);
        imported++;
      }
    }

    console.log("==========================================");
    console.log(`✅ Import finished successfully!`);
    console.log(`   - Imported: ${imported} record(s)`);
    console.log(`   - Skipped (already existed): ${skipped} record(s)`);
    console.log("==========================================\n");

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("❌ MongoDB connection or import error:", err.message);
    process.exit(1);
  }
}

importData();

