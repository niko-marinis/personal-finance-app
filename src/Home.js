import React, { useState, useEffect, useCallback } from 'react';
import { getAuth, signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from './firebase';
import { addTransaction, deleteTransaction } from './services/transactionService';
import './App.css';
import { FaTachometerAlt, FaExchangeAlt, FaWallet, FaUser } from 'react-icons/fa';

const Home = ({ user }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('expense');
  const [isLoading, setIsLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState('daily');
  
  // Set default dates based on active filter
  const today = new Date();
  const todayFormatted = today.toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(todayFormatted);
  const [endDate, setEndDate] = useState(todayFormatted);

  // Format date for display (MM/DD/YYYY format)
  const formatDisplayDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  };

  // Set date range based on filter type
  const setDateRange = (filterType) => {
    const today = new Date();
    const start = new Date();
    
    switch (filterType) {
      case 'daily':
        setStartDate(today.toISOString().split('T')[0]);
        setEndDate(today.toISOString().split('T')[0]);
        break;
      case 'weekly':
        start.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
        setStartDate(start.toISOString().split('T')[0]);
        setEndDate(today.toISOString().split('T')[0]);
        break;
      case 'monthly':
        start.setDate(1); // Start of month
        setStartDate(start.toISOString().split('T')[0]);
        setEndDate(today.toISOString().split('T')[0]);
        break;
      case 'yearly':
        start.setMonth(0, 1); // Start of year (January 1st)
        setStartDate(start.toISOString().split('T')[0]);
        setEndDate(today.toISOString().split('T')[0]);
        break;
      default:
        setStartDate(today.toISOString().split('T')[0]);
        setEndDate(today.toISOString().split('T')[0]);
    }
  };

  // Apply filter when activeFilter changes
  useEffect(() => {
    setDateRange(activeFilter);
  }, [activeFilter]);

  // Filter transactions based on date range - using useCallback to memoize
  const filterTransactionsByDate = useCallback((txns, start, end) => {
    if (!start && !end) {
      setFilteredTransactions(txns);
      return;
    }

    const startDateObj = start ? new Date(start) : null;
    const endDateObj = end ? new Date(end) : null;

    // Set start date to beginning of day and end date to end of day for inclusive filtering
    if (startDateObj) {
      startDateObj.setHours(0, 0, 0, 0);
    }
    if (endDateObj) {
      endDateObj.setHours(23, 59, 59, 999);
    }

    const filtered = txns.filter(tx => {
      const txDate = tx.transaction_date;
      if (!txDate) return false;

      if (startDateObj && endDateObj) {
        return txDate >= startDateObj && txDate <= endDateObj;
      } else if (startDateObj) {
        return txDate >= startDateObj;
      } else if (endDateObj) {
        return txDate <= endDateObj;
      }
      return true;
    });

    console.log("Filtered transactions:", filtered.length, "of", txns.length);
    setFilteredTransactions(filtered);
  }, []);

  useEffect(() => {
    if (!user?.uid) return;
    
    console.log("Setting up Firebase listener for user:", user.uid);
    
    const q = query(
      collection(db, 'transactions'), 
      where('user_id', '==', user.uid),
      orderBy('transaction_date', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        console.log("Received snapshot with", snapshot.docs.length, "documents");
        const data = snapshot.docs.map(doc => {
          const docData = doc.data();
          console.log("Document data:", doc.id, docData);
          
          return { 
            id: doc.id, 
            amount: docData.amount,
            category_id: docData.category_id,
            description: docData.description,
            transaction_date: docData.transaction_date?.toDate?.() || new Date(),
            user_id: docData.user_id
          };
        });
        setTransactions(data);
        
        // Apply filter to the new data
        filterTransactionsByDate(data, startDate, endDate);
      },
      (error) => {
        console.error("Error listening to transactions:", error);
      }
    );

    return () => unsubscribe();
  }, [user, filterTransactionsByDate, startDate, endDate]);

  // Update filtered transactions when dates change
  useEffect(() => {
    filterTransactionsByDate(transactions, startDate, endDate);
  }, [transactions, startDate, endDate, filterTransactionsByDate]);

  const handleLogout = () => {
    const auth = getAuth();
    signOut(auth)
      .then(() => {
        window.location.reload();
      })
      .catch((error) => {
        alert("Logout failed: " + error.message);
      });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || !description) return;
    
    setIsLoading(true);
    try {
      console.log("Adding transaction:", { amount, category, description });
      await addTransaction(user.uid, amount, category, description);
      setAmount('');
      setDescription('');
      setCategory('expense');
      alert('Transaction added successfully!');
    } catch (error) {
      console.error("Error adding transaction:", error);
      alert("Error adding transaction: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this transaction?")) {
      try {
        await deleteTransaction(id);
        alert('Transaction deleted successfully!');
      } catch (error) {
        console.error("Error deleting transaction:", error);
        alert("Error deleting transaction: " + error.message);
      }
    }
  };

  const clearFilters = () => {
    setActiveFilter('daily');
    setDateRange('daily');
  };

  const username = user?.email?.split('@')[0];

  // Calculate totals for the stats cards based on filtered transactions
  const totalIncome = filteredTransactions
    .filter(tx => tx.category_id === 'income')
    .reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);
  
  const totalExpenses = filteredTransactions
    .filter(tx => tx.category_id === 'expense')
    .reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);
  
  const remainingBudget = totalIncome - totalExpenses;

  return (
    <div className="dashboard-container">
      {/* Navbar */}
      <nav className="navbar">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <h1>Personal Finance Tracker</h1>
          <ul className="nav-tabs">
            <li><FaTachometerAlt /> Dashboard</li>
            <li><FaExchangeAlt /> Transactions</li>
            <li><FaWallet /> Budgets</li>
          </ul>
        </div>
        
        <div className="user-menu">
          <div 
            className="user-icon" 
            onClick={() => setShowDropdown(!showDropdown)}
            title="User Menu"
          >
            <FaUser size={20} />
            {username && (
              <span style={{ marginLeft: '8px', fontWeight: 'bold' }}>
                {username}
              </span>
            )}
          </div>

          {showDropdown && (
            <div className="dropdown-menu">
              <div className="dropdown-item" onClick={handleLogout}>Logout</div>
            </div>
          )}
        </div>
      </nav>

      <div className="stats-container">
        <div className="stat-card">
          <h3>Total Income</h3>
          <div className="stat-amount">${totalIncome.toFixed(2)}</div>
        </div>
        <div className="stat-card">
          <h3>Total Expenses</h3>
          <div className="stat-amount">${totalExpenses.toFixed(2)}</div>
        </div>
        <div className="stat-card">
          <h3>Remaining Budget</h3>
          <div className="stat-amount">${remainingBudget.toFixed(2)}</div>
        </div>
      </div>

      {/* Transaction Section */}
      <div className="transaction-section">
        <div className="transaction-form-container">
          <h3>Add New Transaction</h3>
          <form onSubmit={handleSubmit} className="transaction-form">
            <div className="form-group">
              <label>Type</label>
              <select 
                value={category} 
                onChange={(e) => setCategory(e.target.value)}
                className="form-select"
              >
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Amount ($)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="form-input"
                required
              />
            </div>
            
            <div className="form-group">
              <label>Description</label>
              <input
                type="text"
                placeholder="What was this for?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="form-input"
                required
              />
            </div>
            
            <button 
              type="submit" 
              className="submit-btn"
              disabled={isLoading}
            >
              {isLoading ? 'Adding...' : 'Add Transaction'}
            </button>
          </form>
        </div>
        
        <div className="transaction-list-container">
          <h3>Recent Transactions</h3>
          
          {/* Quick Filter Buttons */}
          <div className="quick-filter-buttons">
            <button 
              className={activeFilter === 'daily' ? 'filter-btn active' : 'filter-btn'}
              onClick={() => setActiveFilter('daily')}
            >
              Daily
            </button>
            <button 
              className={activeFilter === 'weekly' ? 'filter-btn active' : 'filter-btn'}
              onClick={() => setActiveFilter('weekly')}
            >
              Weekly
            </button>
            <button 
              className={activeFilter === 'monthly' ? 'filter-btn active' : 'filter-btn'}
              onClick={() => setActiveFilter('monthly')}
            >
              Monthly
            </button>
            <button 
              className={activeFilter === 'yearly' ? 'filter-btn active' : 'filter-btn'}
              onClick={() => setActiveFilter('yearly')}
            >
              Yearly
            </button>
          </div>
          
          {/* Date Filter - Always Visible */}
          <div className="date-filter">
            <div className="filter-controls">
              <div className="filter-group">
                <label>Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setActiveFilter('custom');
                  }}
                  className="filter-input"
                />
              </div>
              <div className="filter-group">
                <label>End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setActiveFilter('custom');
                  }}
                  className="filter-input"
                />
              </div>
              <button 
                className="clear-filter-btn"
                onClick={clearFilters}
              >
                Reset to Today
              </button>
            </div>
            {(startDate || endDate) && (
              <p className="filter-info">
                Showing {filteredTransactions.length} of {transactions.length} transactions
                {startDate && ` from ${formatDisplayDate(startDate)}`}
                {endDate && ` to ${formatDisplayDate(endDate)}`}
                {activeFilter !== 'custom' && ` (${activeFilter})`}
              </p>
            )}
          </div>
          
          {filteredTransactions.length === 0 ? (
            <p>No transactions found. {transactions.length > 0 ? 'Try adjusting your filters.' : 'Add your first transaction above!'}</p>
          ) : (
            <div className="transactions">
              {filteredTransactions.map(tx => (
                <div key={tx.id} className={`transaction-item ${tx.category_id}`}>
                  <div className="transaction-info">
                    <div className="transaction-desc">{tx.description}</div>
                    <div className="transaction-date">
                      {tx.transaction_date?.toLocaleDateString()}
                    </div>
                  </div>
                  <div className="transaction-amount">
                    {tx.category_id === 'income' ? '+' : '-'}${parseFloat(tx.amount || 0).toFixed(2)}
                  </div>
                  <button 
                    className="delete-btn"
                    onClick={() => handleDelete(tx.id)}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;