const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const mongoose = require("mongoose");

const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/personalExpenseTracker";

// Mask password in logs for security
const maskedUri = uri.replace(/:([^:@]+)@/, ":****@");

console.log("Checking MongoDB connection...");
console.log(`Target URI: ${maskedUri}\n`);

async function testConnection() {
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000
    });
    console.log("Connection successful!");
    console.log(`  - Host: ${mongoose.connection.host}`);
    console.log(`  - Port: ${mongoose.connection.port || "default"}`);
    console.log(`  - Database: ${mongoose.connection.name}`);
    console.log(`  - Connection Status: Connected (readyState: ${mongoose.connection.readyState})`);
    
    // Check collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`  - Collections found (${collections.length}):`, collections.map(c => c.name).join(", ") || "(none yet)");
    
    await mongoose.disconnect();
    console.log("\nMongoDB is ready to use with your application!");
    process.exit(0);
  } catch (error) {
    console.error("Connection failed!");
    console.error(`Error: ${error.message}\n`);
    if (error.message.includes("ECONNREFUSED") || error.message.includes("EACCES")) {
      console.log("Troubleshooting tips for Local MongoDB:");
      console.log("1. Ensure MongoDB service is running. Open PowerShell as Administrator and run:");
      console.log("   net start MongoDB");
      console.log("2. Or start mongod directly:");
      console.log('   & "C:\\Program Files\\MongoDB\\Server\\8.2\\bin\\mongod.exe" --dbpath backend/data/db');
    } else if (error.message.includes("querySrv") || error.message.includes("ENOTFOUND") || error.message.includes("bad auth")) {
      console.log("Troubleshooting tips for MongoDB Atlas:");
      console.log("1. Double check your username, password, and cluster host in backend/.env.");
      console.log("2. Make sure your IP address is whitelisted in Atlas (Network Access -> Add IP -> 0.0.0.0/0).");
    }
    process.exit(1);
  }
}

testConnection();

