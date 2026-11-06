# Personal Expense Tracker

A modern, responsive full-stack MERN application for personal financial tracking:
- **React + Vite** frontend with custom dashboard styling and Lucide icons
- **Node.js + Express** REST API backend
- **MongoDB + Mongoose** with automatic local fallback mode if MongoDB is offline
- Real-time interactive charts (Line Trends & Monthly Summaries) powered by Recharts
- Quick Add, Search, Category filter, Type filtering, and Delete with confirmation
- Dark Mode toggle with persistent theme preference
- Spending breakdown by Category, Wallets portfolio overview, and Financial Reports

---

## 1. Quick Start

### Option A: One-Click Launcher (Windows - Starts MongoDB + App)
Double-click `run.bat` in the project root folder (or run in Command Prompt):
```cmd
run.bat
```
This automatically launches MongoDB in its own console window, waits for it to become ready, and starts both the Backend and Frontend concurrently.

---

### Option B: Run Concurrently (If MongoDB is already running)

#### 1. Backend Terminal
```bash
cd backend
npm run dev
```
*(Runs at `http://localhost:5000`)*

#### 2. Frontend Terminal
```bash
cd frontend
npm run dev
```
*(Runs at `http://localhost:5173`)*

---

## 2. MongoDB Database Connection

Your application connects to MongoDB using Mongoose. You can connect using either **Local MongoDB** or **MongoDB Atlas (Cloud)**.

### Option 1: Local MongoDB (Installed on your PC)
MongoDB Server 8.2 is installed at `C:\Program Files\MongoDB\Server\8.2`.

- **To start the MongoDB service:**
  Open PowerShell as Administrator and run:
  ```powershell
  net start MongoDB
  ```
- **Or run MongoDB directly:**
  ```bash
  npm run mongo:local
  ```
- In `backend/.env`:
  ```env
  MONGO_URI=mongodb://127.0.0.1:27017/personalExpenseTracker
  ```

---

### Option 2: MongoDB Atlas (Cloud)
1. Go to [MongoDB Atlas](https://cloud.mongodb.com/) and create or open your cluster.
2. Click **Connect** -> **Drivers** (Node.js) and copy the connection string.
3. Open `backend/.env` and update `MONGO_URI`:
  ```env
  MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/personalExpenseTracker?retryWrites=true&w=majority
  ```
4. In Atlas **Network Access**, ensure your current IP address (or `0.0.0.0/0`) is added to the IP Access List.

---

### Database Utilities
- **Test Connection**: Check MongoDB reachability and collections:
  ```bash
  npm run test:db
  ```
- **Export to JSON**: Dump all MongoDB transactions into `backend/data/mongo-data.json`:
  ```bash
  npm run export:db
  ```
- **Import from JSON**: Load records from `backend/data/transactions.json` into MongoDB:
  ```bash
  npm run import:db
  ```

---

## 3. Deployment to Vercel

This repository is pre-configured with `vercel.json` and serverless API handlers for instant full-stack deployment on Vercel:

1. Push your latest code to GitHub (or use `push-to-github.bat`).
2. Log in to [Vercel](https://vercel.com/) and click **"Add New..."** -> **"Project"**.
3. Select your GitHub repository: `personalExpenseTracker`.
4. Under **Environment Variables**, add:
   - `MONGO_URI`: Your MongoDB Atlas connection string (`mongodb+srv://...`)
5. Click **Deploy**.

Vercel will automatically build the React Vite frontend and deploy the Express API as serverless functions with zero additional configuration needed!

---

## 4. Features & Modules
- **Dashboard**: Snapshot of total income, expenses, net balance, 7/30/90-day cashflow trend line chart, monthly summary bar chart, and recent transactions.
- **Transactions**: Full transaction table with live search, Type filter (All / Income / Expense), Category filter, and delete actions with confirmation.
- **Categories**: Visual expenditure breakdown with progress bars, transaction counts, and expense percentages.
- **Wallets**: Portfolio and balance distribution across cash reserves, inflow, and outflow.
- **Reports**: Savings ratio, average expense per transaction, and top spending areas.
- **Theme**: Dark and light mode toggle with state saved to `localStorage`.
- **Escape Key & Outside Click**: Quick dismiss for modals and dialogs.
