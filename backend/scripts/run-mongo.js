const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

function findMongod() {
  const possiblePaths = [
    "C:\\Program Files\\MongoDB\\Server\\8.2\\bin\\mongod.exe",
    "C:\\Program Files\\MongoDB\\Server\\8.0\\bin\\mongod.exe",
    "C:\\Program Files\\MongoDB\\Server\\7.0\\bin\\mongod.exe",
    "C:\\Program Files\\MongoDB\\Server\\6.0\\bin\\mongod.exe"
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }

  // Fallback to searching Server directory
  const baseDir = "C:\\Program Files\\MongoDB\\Server";
  if (fs.existsSync(baseDir)) {
    const versions = fs.readdirSync(baseDir);
    for (const v of versions) {
      const candidate = path.join(baseDir, v, "bin", "mongod.exe");
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }
  }

  return "mongod";
}

const mongodPath = findMongod();
const dbPath = path.resolve(__dirname, "../data/db");

if (!fs.existsSync(dbPath)) {
  fs.mkdirSync(dbPath, { recursive: true });
}

console.log("==========================================");
console.log("Starting Local MongoDB Server...");
console.log(`Executable: ${mongodPath}`);
console.log(`Data Directory: ${dbPath}`);
console.log("Port: 27017");
console.log("==========================================\n");

const mongoProcess = spawn(mongodPath, ["--dbpath", dbPath, "--port", "27017"], {
  stdio: "inherit"
});

mongoProcess.on("error", (err) => {
  console.error("\n❌ Could not launch MongoDB executable:", err.message);
  console.log("\nAlternative ways to run MongoDB:");
  console.log("1. Open PowerShell as Administrator and run: net start MongoDB");
  console.log("2. Or use MongoDB Atlas (Cloud) in backend/.env");
});

process.on("SIGINT", () => {
  mongoProcess.kill("SIGINT");
  process.exit(0);
});

process.on("SIGTERM", () => {
  mongoProcess.kill("SIGTERM");
  process.exit(0);
});

