import { useEffect, useMemo, useState, useCallback } from "react";
import axios from "axios";
import {
  LayoutDashboard,
  ReceiptText,
  ArrowLeftRight,
  Tags,
  Wallet,
  ChartNoAxesColumn,
  Users,
  UserRound,
  FileText,
  Search,
  Plus,
  Moon,
  Sun,
  Bell,
  ArrowUpRight,
  ArrowDownLeft,
  CreditCard,
  Trash2,
  Menu,
  X,
  CircleHelp,
  LoaderCircle,
  TrendingUp,
  Percent,
  CheckCircle2,
  Calendar,
  Layers
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Legend
} from "recharts";

const API =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? "/api/transactions" : "http://localhost:5000/api/transactions");

const categories = [
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

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
  }).format(value || 0);

const getTodayString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const navMain = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Transactions", icon: ReceiptText },
  { label: "Categories", icon: Tags },
  { label: "Wallets", icon: Wallet },
  { label: "Budgets", icon: ChartNoAxesColumn },
  { label: "Split Transactions", icon: ArrowLeftRight, badge: "New" },
  { label: "Borrows", icon: CircleHelp },
  { label: "EMI Loans", icon: CreditCard }
];

const navManage = [
  { label: "Reports", icon: FileText },
  { label: "Expense People", icon: Users },
  { label: "Friends", icon: UserRound }
];

function NavButton({ item, active, onClick }) {
  const Icon = item.icon;
  const isSelected = active === item.label;
  return (
    <button
      type="button"
      className={`nav-item ${isSelected ? "selected" : ""}`}
      onClick={onClick}
    >
      <Icon size={18} strokeWidth={1.8} />
      <span>{item.label}</span>
      {item.badge && <b>{item.badge}</b>}
    </button>
  );
}

function App() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [active, setActive] = useState("Dashboard");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [modal, setModal] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [range, setRange] = useState("Last 7 Days");
  const [showNotification, setShowNotification] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  const [form, setForm] = useState({
    title: "",
    amount: "",
    category: "Food",
    type: "expense",
    date: getTodayString()
  });
  const [dbStatus, setDbStatus] = useState("");

  const checkDbStatus = useCallback(async () => {
    try {
      const baseUrl = API.replace(/\/api\/transactions\/?$/, "") || "/";
      const res = await axios.get(baseUrl);
      if (res.data && res.data.database) {
        setDbStatus(res.data.database);
      }
    } catch {
      setDbStatus("");
    }
  }, []);

  // Theme effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  // Modal Escape key effect
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && modal) setModal(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [modal]);

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(API);
      setTransactions(Array.isArray(response.data) ? response.data : []);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Cannot reach backend server. Please make sure the backend is running at http://localhost:5000");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTransactions();
    checkDbStatus();
  }, [loadTransactions, checkDbStatus]);

  const totals = useMemo(() => {
    const income = transactions
      .filter((t) => t.type === "income")
      .reduce((s, t) => s + (Number(t.amount) || 0), 0);
    const expense = transactions
      .filter((t) => t.type === "expense")
      .reduce((s, t) => s + (Number(t.amount) || 0), 0);
    return { income, expense, balance: income - expense };
  }, [transactions]);

  const thisMonthTotals = useMemo(() => {
    const now = new Date();
    const curMonth = now.getMonth();
    const curYear = now.getFullYear();

    const monthItems = transactions.filter((t) => {
      const d = new Date(t.date);
      return !isNaN(d.getTime()) && d.getMonth() === curMonth && d.getFullYear() === curYear;
    });

    const income = monthItems
      .filter((t) => t.type === "income")
      .reduce((s, t) => s + (Number(t.amount) || 0), 0);
    const expense = monthItems
      .filter((t) => t.type === "expense")
      .reduce((s, t) => s + (Number(t.amount) || 0), 0);

    return { income, expense };
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const textMatch = `${t.title || ""} ${t.category || ""} ${t.type || ""}`
        .toLowerCase()
        .includes(search.toLowerCase());
      const typeMatch = typeFilter === "all" || t.type === typeFilter;
      const catMatch = categoryFilter === "all" || t.category === categoryFilter;
      return textMatch && typeMatch && catMatch;
    });
  }, [transactions, search, typeFilter, categoryFilter]);

  // Robust trend data calculation: aggregates all transactions within time buckets
  const trendData = useMemo(() => {
    const is7 = range === "Last 7 Days";
    const is30 = range === "Last 30 Days";
    const numPoints = 7;
    const daysTotal = is7 ? 7 : is30 ? 30 : 90;
    const bucketDays = Math.ceil(daysTotal / numPoints);

    return Array.from({ length: numPoints }, (_, i) => {
      const pointEndDate = new Date();
      pointEndDate.setHours(23, 59, 59, 999);
      pointEndDate.setDate(pointEndDate.getDate() - (numPoints - 1 - i) * bucketDays);

      const pointStartDate = new Date(pointEndDate);
      pointStartDate.setHours(0, 0, 0, 0);
      pointStartDate.setDate(pointStartDate.getDate() - (bucketDays - 1));

      const bucketItems = transactions.filter((t) => {
        const itemDate = new Date(t.date);
        return !isNaN(itemDate.getTime()) && itemDate >= pointStartDate && itemDate <= pointEndDate;
      });

      const label = pointStartDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });

      return {
        day: label,
        Income: bucketItems.filter((t) => t.type === "income").reduce((s, t) => s + (Number(t.amount) || 0), 0),
        Expense: bucketItems.filter((t) => t.type === "expense").reduce((s, t) => s + (Number(t.amount) || 0), 0)
      };
    });
  }, [transactions, range]);

  // 6-Month rolling summary
  const monthlyData = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - (5 - i));
      const targetMonth = d.getMonth();
      const targetYear = d.getFullYear();

      const list = transactions.filter((t) => {
        const itemDate = new Date(t.date);
        return !isNaN(itemDate.getTime()) && itemDate.getMonth() === targetMonth && itemDate.getFullYear() === targetYear;
      });

      const income = list.filter((t) => t.type === "income").reduce((s, t) => s + (Number(t.amount) || 0), 0);
      const expense = list.filter((t) => t.type === "expense").reduce((s, t) => s + (Number(t.amount) || 0), 0);

      return {
        month: d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" }),
        Income: income,
        Expense: expense,
        Balance: income - expense
      };
    });
  }, [transactions]);

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    const expenses = transactions.filter((t) => t.type === "expense");
    const totalExp = expenses.reduce((s, t) => s + (Number(t.amount) || 0), 0);
    const map = {};

    categories.forEach((c) => {
      map[c] = { category: c, total: 0, count: 0 };
    });

    expenses.forEach((t) => {
      if (!map[t.category]) {
        map[t.category] = { category: t.category, total: 0, count: 0 };
      }
      map[t.category].total += Number(t.amount) || 0;
      map[t.category].count += 1;
    });

    return Object.values(map)
      .filter((item) => item.total > 0)
      .map((item) => ({
        ...item,
        percent: totalExp > 0 ? ((item.total / totalExp) * 100).toFixed(1) : "0"
      }))
      .sort((a, b) => b.total - a.total);
  }, [transactions]);

  const handleTypeChange = (newType) => {
    let nextCategory = form.category;
    if (newType === "income" && form.category === "Food") {
      nextCategory = "Salary";
    } else if (newType === "expense" && form.category === "Salary") {
      nextCategory = "Food";
    }
    setForm({ ...form, type: newType, category: nextCategory });
  };

  const addTransaction = async (event) => {
    event.preventDefault();
    const amountVal = Number(form.amount);
    if (!form.title.trim()) {
      setError("Please provide a transaction title.");
      return;
    }
    if (!Number.isFinite(amountVal) || amountVal <= 0) {
      setError("Please enter a valid amount greater than 0.");
      return;
    }

    try {
      const response = await axios.post(API, {
        title: form.title.trim(),
        amount: amountVal,
        category: form.category,
        type: form.type,
        date: form.date
      });
      setTransactions((prev) => [response.data, ...prev]);
      setForm({
        title: "",
        amount: "",
        category: "Food",
        type: "expense",
        date: getTodayString()
      });
      setModal(false);
      setError("");
      setSuccessMsg("Transaction added successfully!");
      setTimeout(() => setSuccessMsg(""), 3500);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Could not save transaction. Please check server.");
    }
  };

  const deleteTransaction = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title || "this transaction"}"?`)) {
      return;
    }
    try {
      await axios.delete(`${API}/${id}`);
      setTransactions((prev) => prev.filter((t) => (t._id || t.id) !== id));
      setSuccessMsg("Transaction removed.");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      console.error(err);
      setError("Could not delete this transaction.");
    }
  };

  return (
    <div className="app-shell">
      {mobileNav && <button className="scrim" onClick={() => setMobileNav(false)} aria-label="Close navigation" />}

      {/* Sidebar */}
      <aside className={`sidebar ${mobileNav ? "sidebar-open" : ""}`}>
        <div className="brand">
          <span className="brand-mark">
            <ReceiptText size={22} />
          </span>
          <span>Cashflow</span>
        </div>
        <nav>
          <NavButton
            item={navMain[0]}
            active={active}
            onClick={() => {
              setActive(navMain[0].label);
              setMobileNav(false);
            }}
          />
          <div className="nav-label">CORE FEATURES</div>
          {navMain.slice(1).map((item) => (
            <NavButton
              key={item.label}
              item={item}
              active={active}
              onClick={() => {
                setActive(item.label);
                setMobileNav(false);
              }}
            />
          ))}
          <div className="nav-label management-label">MANAGEMENT</div>
          {navManage.map((item) => (
            <NavButton
              key={item.label}
              item={item}
              active={active}
              onClick={() => {
                setActive(item.label);
                setMobileNav(false);
              }}
            />
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="profile-avatar">PT</div>
          <div>
            <strong>Personal Account</strong>
            <small>Expense Manager</small>
          </div>
        </div>
      </aside>

      {/* Main Area */}
      <main className="main-area">
        {/* Topbar */}
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMobileNav(true)} aria-label="Open menu">
            <Menu size={21} />
          </button>
          <div className="search-box">
            <Search size={18} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search transactions, categories, amounts..."
            />
            {search && (
              <button className="clear-search" onClick={() => setSearch("")} title="Clear search">
                <X size={15} />
              </button>
            )}
          </div>
          <div className="top-actions">
            {dbStatus && (
              <span
                className={`db-pill ${dbStatus.includes("MongoDB") ? "mongo-ok" : "mongo-fallback"}`}
                title={`Database status: ${dbStatus}`}
              >
                <span className="db-dot" />
                <span>{dbStatus.includes("MongoDB") ? "MongoDB" : "Local File"}</span>
              </span>
            )}
            <button className="quick-button" onClick={() => setModal(true)}>
              <Plus size={18} /> <span>Quick Action</span>
            </button>
            <button
              className="icon-button"
              aria-label="Toggle theme"
              onClick={() => setDarkMode(!darkMode)}
              title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button
              className="icon-button"
              aria-label="Notifications"
              onClick={() => setShowNotification(!showNotification)}
              title="Notifications"
            >
              <Bell size={20} />
            </button>
            <div className="user-avatar" title="Logged in user">
              PT
            </div>
          </div>
        </header>

        {showNotification && (
          <div className="notification-dropdown">
            <div className="notification-header">
              <strong>Notifications</strong>
              <button onClick={() => setShowNotification(false)} className="close-notif">
                <X size={15} />
              </button>
            </div>
            <p>
              {transactions.length > 0
                ? `You have ${transactions.length} recorded transaction(s). Overall net balance is ${money(totals.balance)}.`
                : "No new alerts. Start by adding your first transaction!"}
            </p>
          </div>
        )}

        {/* Content */}
        <div className="content">
          {error && (
            <div className="error-banner">
              <span>{error}</span>
              <button onClick={() => setError("")} aria-label="Dismiss error">
                <X size={15} />
              </button>
            </div>
          )}
          {successMsg && (
            <div className="success-banner">
              <CheckCircle2 size={17} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Page Heading */}
          <section className="page-heading">
            <div>
              <h1>{active}</h1>
              <p>
                {active === "Dashboard" && "Clean snapshot of your monthly financial performance and trends."}
                {active === "Transactions" && "Review, filter, search, and manage all your income and expenses."}
                {active === "Categories" && "Understand your expense distribution and top spending areas."}
                {active === "Wallets" && "Monitor balance across accounts, cash reserves, and portfolios."}
                {active === "Budgets" && "Keep spending within limits and meet your monthly savings targets."}
                {active === "Reports" && "Summary insights, average expenses, and monthly financial metrics."}
                {!["Dashboard", "Transactions", "Categories", "Wallets", "Budgets", "Reports"].includes(active) &&
                  `Manage your ${active.toLowerCase()} in one place.`}
              </p>
            </div>
            <div className="page-heading-actions">
              <button className="primary-button" onClick={() => setModal(true)}>
                <Plus size={16} /> Add Transaction
              </button>
            </div>
          </section>

          {/* Stats Grid */}
          <section className="stats-grid">
            <article className="stat-card income-card">
              <div className="stat-top">
                <span>Total Income</span>
                <span className="stat-icon income-icon">
                  <ArrowUpRight size={20} />
                </span>
              </div>
              <strong>{money(totals.income)}</strong>
              <small>This Month: {money(thisMonthTotals.income)}</small>
            </article>

            <article className="stat-card expense-card">
              <div className="stat-top">
                <span>Total Expense</span>
                <span className="stat-icon expense-icon">
                  <ArrowDownLeft size={20} />
                </span>
              </div>
              <strong>{money(totals.expense)}</strong>
              <small>This Month: {money(thisMonthTotals.expense)}</small>
            </article>

            <article className="stat-card balance-card">
              <div className="stat-top">
                <span>Net Balance</span>
                <span className="stat-icon balance-icon">
                  <Wallet size={19} />
                </span>
              </div>
              <strong>{money(totals.balance)}</strong>
              <small>{totals.balance >= 0 ? "Healthy positive balance" : "Expenses exceed income"}</small>
            </article>

            <article className="stat-card wallet-card">
              <div className="stat-top">
                <span>Total Records</span>
                <span className="stat-icon record-icon">
                  <CreditCard size={19} />
                </span>
              </div>
              <strong>{transactions.length}</strong>
              <small>{transactions.filter((t) => t.type === "expense").length} expenses, {transactions.filter((t) => t.type === "income").length} income</small>
            </article>
          </section>

          {/* Tab Views */}
          {active === "Transactions" ? (
            <section className="panel transaction-page">
              <div className="panel-heading">
                <div>
                  <h2>All Transactions</h2>
                  <p>
                    Showing {filteredTransactions.length} of {transactions.length} transaction(s)
                  </p>
                </div>
                <div className="filters-row">
                  <div className="pill-group">
                    <button
                      className={`pill ${typeFilter === "all" ? "pill-active" : ""}`}
                      onClick={() => setTypeFilter("all")}
                    >
                      All
                    </button>
                    <button
                      className={`pill ${typeFilter === "expense" ? "pill-active" : ""}`}
                      onClick={() => setTypeFilter("expense")}
                    >
                      Expenses
                    </button>
                    <button
                      className={`pill ${typeFilter === "income" ? "pill-active" : ""}`}
                      onClick={() => setTypeFilter("income")}
                    >
                      Income
                    </button>
                  </div>
                  <select
                    className="category-filter"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                  >
                    <option value="all">All Categories</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <TransactionList
                items={filteredTransactions}
                loading={loading}
                onDelete={deleteTransaction}
              />
            </section>
          ) : active === "Categories" ? (
            <section className="panel category-page">
              <div className="panel-heading">
                <div>
                  <h2>Spending by Category</h2>
                  <p>Breakdown of expenses sorted by highest expenditure.</p>
                </div>
              </div>

              {categoryBreakdown.length === 0 ? (
                <div className="empty-state">
                  <Tags size={28} />
                  <strong>No category expense data yet</strong>
                  <span>Add your first expense transaction to view category insights.</span>
                </div>
              ) : (
                <div className="category-grid">
                  {categoryBreakdown.map((item) => (
                    <div key={item.category} className="category-item-card">
                      <div className="category-header">
                        <span className="category-badge">{item.category}</span>
                        <strong>{money(item.total)}</strong>
                      </div>
                      <div className="category-progress-track">
                        <div
                          className="category-progress-fill"
                          style={{ width: `${Math.min(100, item.percent)}%` }}
                        />
                      </div>
                      <div className="category-footer">
                        <span>{item.count} transaction(s)</span>
                        <span>{item.percent}% of expenses</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          ) : active === "Wallets" ? (
            <section className="panel wallets-page">
              <div className="panel-heading">
                <div>
                  <h2>Wallets & Portfolio</h2>
                  <p>Overview of current balance across financial sources.</p>
                </div>
              </div>
              <div className="wallets-grid">
                <div className="wallet-box primary-wallet">
                  <div className="wallet-box-top">
                    <Wallet size={24} />
                    <span>Primary Account</span>
                  </div>
                  <h3>{money(totals.balance)}</h3>
                  <small>Available liquid cashflow</small>
                </div>
                <div className="wallet-box secondary-wallet">
                  <div className="wallet-box-top">
                    <CreditCard size={24} />
                    <span>Monthly Inflow</span>
                  </div>
                  <h3>{money(thisMonthTotals.income)}</h3>
                  <small>Incoming revenue this month</small>
                </div>
                <div className="wallet-box tertiary-wallet">
                  <div className="wallet-box-top">
                    <TrendingUp size={24} />
                    <span>Monthly Outflow</span>
                  </div>
                  <h3>{money(thisMonthTotals.expense)}</h3>
                  <small>Total spent this month</small>
                </div>
              </div>
            </section>
          ) : active === "Reports" ? (
            <section className="panel reports-page">
              <div className="panel-heading">
                <div>
                  <h2>Financial Summary Report</h2>
                  <p>Key analytics calculated from your recorded activity.</p>
                </div>
              </div>
              <div className="reports-metrics">
                <div className="report-metric-card">
                  <span>Savings Ratio</span>
                  <strong>
                    {totals.income > 0
                      ? `${(((totals.income - totals.expense) / totals.income) * 100).toFixed(1)}%`
                      : "0%"}
                  </strong>
                  <small>Percentage of income retained</small>
                </div>
                <div className="report-metric-card">
                  <span>Average Expense</span>
                  <strong>
                    {money(
                      totals.expense > 0 && transactions.filter((t) => t.type === "expense").length > 0
                        ? totals.expense / transactions.filter((t) => t.type === "expense").length
                        : 0
                    )}
                  </strong>
                  <small>Per recorded expense transaction</small>
                </div>
                <div className="report-metric-card">
                  <span>Top Spending Area</span>
                  <strong>{categoryBreakdown[0]?.category || "None"}</strong>
                  <small>
                    {categoryBreakdown[0] ? money(categoryBreakdown[0].total) : "No expenses yet"}
                  </small>
                </div>
              </div>
            </section>
          ) : active !== "Dashboard" ? (
            <section className="panel coming-soon-page">
              <div className="panel-heading">
                <div>
                  <h2>{active}</h2>
                  <p>Module configured for your personal finances.</p>
                </div>
              </div>
              <div className="empty-state">
                <Layers size={32} />
                <strong>{active} Section Ready</strong>
                <span>
                  You have recorded {transactions.length} transaction(s). Use Quick Actions or Transactions to keep managing your money.
                </span>
                <button className="primary-button" style={{ marginTop: "12px" }} onClick={() => setActive("Dashboard")}>
                  Return to Dashboard
                </button>
              </div>
            </section>
          ) : (
            <>
              {/* Dashboard Charts */}
              <section className="charts-grid">
                <article className="panel chart-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Income vs Expense Trends</h2>
                      <p>Track cashflow movements over time.</p>
                    </div>
                    <select
                      className="range-select"
                      value={range}
                      onChange={(e) => setRange(e.target.value)}
                    >
                      <option>Last 7 Days</option>
                      <option>Last 30 Days</option>
                      <option>Last 90 Days</option>
                    </select>
                  </div>
                  <div className="chart-wrap">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                        <CartesianGrid stroke="#e9edf2" strokeDasharray="3 3" vertical={false} />
                        <XAxis
                          dataKey="day"
                          tick={{ fill: "#7d8795", fontSize: 12 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v}`}
                          tick={{ fill: "#7d8795", fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                          width={52}
                        />
                        <Tooltip formatter={(v) => money(v)} />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="Income"
                          stroke="#22bd69"
                          strokeWidth={3}
                          dot={{ r: 3 }}
                          activeDot={{ r: 5 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="Expense"
                          stroke="#ed4b50"
                          strokeWidth={3}
                          dot={{ r: 3 }}
                          activeDot={{ r: 5 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </article>

                <article className="panel chart-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Monthly Financial Summary</h2>
                      <p>6-Month comparison of income, expenses, and net balance.</p>
                    </div>
                  </div>
                  <div className="chart-wrap">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyData} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
                        <CartesianGrid stroke="#e9edf2" strokeDasharray="3 3" vertical={false} />
                        <XAxis
                          dataKey="month"
                          tick={{ fill: "#7d8795", fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tickFormatter={(v) => `₹${Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(0)}K` : v}`}
                          tick={{ fill: "#7d8795", fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                          width={52}
                        />
                        <Tooltip formatter={(v) => money(v)} />
                        <Legend />
                        <Bar dataKey="Income" fill="#22bd69" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Expense" fill="#ed4b50" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Balance" fill="#397ff2" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </article>
              </section>

              {/* Recent Transactions */}
              <section className="panel recent-panel">
                <div className="panel-heading">
                  <div>
                    <h2>Recent Transactions</h2>
                    <p>Latest inflows and outflows.</p>
                  </div>
                  <button className="text-button" onClick={() => setActive("Transactions")}>
                    View all ({transactions.length})
                  </button>
                </div>
                <TransactionList
                  items={filteredTransactions.slice(0, 5)}
                  loading={loading}
                  onDelete={deleteTransaction}
                />
              </section>
            </>
          )}

          <footer className="footer">
            Personal Expense Tracker <span>•</span> Keep your personal finances clear, organized, and balanced.
          </footer>
        </div>
      </main>

      {/* Add Transaction Modal */}
      {modal && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setModal(false);
          }}
        >
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-heading">
            <div className="modal-title">
              <div>
                <h2 id="modal-heading">Add Transaction</h2>
                <p>Record a new income or expense transaction.</p>
              </div>
              <button className="icon-button" onClick={() => setModal(false)} aria-label="Close modal">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={addTransaction}>
              <label>
                Transaction title
                <input
                  required
                  autoFocus
                  maxLength={100}
                  placeholder="e.g. Grocery shopping, Salary bonus"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </label>

              <label>
                Amount (₹)
                <input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                />
              </label>

              <div className="form-row">
                <label>
                  Type
                  <select
                    value={form.type}
                    onChange={(e) => handleTypeChange(e.target.value)}
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </label>

                <label>
                  Category
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label>
                Date
                <input
                  required
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </label>

              <button className="primary-button submit-button" type="submit">
                <Plus size={17} /> Save Transaction
              </button>
            </form>
          </section>
        </div>
      )}

      <button className="support-pill" onClick={() => alert("Personal Expense Tracker v1.0. For assistance, check README.md.")}>
        <CircleHelp size={16} /> Help & Guide
      </button>
    </div>
  );
}

function TransactionList({ items, loading, onDelete }) {
  if (loading) {
    return (
      <div className="empty-state">
        <LoaderCircle className="spin" size={24} />
        <span>Loading transactions...</span>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="empty-state">
        <ReceiptText size={32} />
        <strong>No transactions found</strong>
        <span>Add a new transaction or adjust your search / filter.</span>
      </div>
    );
  }

  const formatDate = (val) => {
    const d = new Date(val);
    return isNaN(d.getTime())
      ? val
      : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>TRANSACTION</th>
            <th>CATEGORY</th>
            <th>DATE</th>
            <th>TYPE</th>
            <th className="amount-cell">AMOUNT</th>
            <th style={{ width: "40px" }}></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const id = item._id || item.id;
            const isIncome = item.type === "income";
            return (
              <tr key={id}>
                <td>
                  <span className={`row-icon ${item.type}`}>
                    {isIncome ? <ArrowUpRight size={17} /> : <ArrowDownLeft size={17} />}
                  </span>
                  <strong>{item.title}</strong>
                </td>
                <td>
                  <span className="category-tag">{item.category}</span>
                </td>
                <td>{formatDate(item.date)}</td>
                <td>
                  <span className={`type-chip ${item.type}`}>{item.type}</span>
                </td>
                <td className={`amount-cell ${item.type}`}>
                  {isIncome ? "+" : "-"}
                  {money(item.amount)}
                </td>
                <td>
                  <button
                    type="button"
                    className="delete-button"
                    title={`Delete "${item.title}"`}
                    onClick={() => onDelete(id, item.title)}
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default App;
