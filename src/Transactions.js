import React, { useState, useEffect, useCallback } from 'react';
import { getAuth, signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { Link, useLocation } from 'react-router-dom';
import { db } from './firebase';
import { deleteTransaction } from './services/transactionService';
import './App.css';
import { FaTachometerAlt, FaExchangeAlt, FaChartBar, FaUser, FaSearch } from 'react-icons/fa';

const Transactions = ({ user }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [activeFilter, setActiveFilter] = useState('daily');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();

  // Set default dates based on active filter
  const today = new Date();
  const todayFormatted = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const [startDate, setStartDate] = useState(todayFormatted);

  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const tomorrowFormatted = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
  const [endDate, setEndDate] = useState(tomorrowFormatted);

  // Set date range based on filter type
  const setDateRange = (filterType) => {
    const today = new Date();

    switch (filterType) {
      case 'daily': {
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        const todayFormatted = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        const tomorrowFormatted = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;

        setStartDate(todayFormatted);
        setEndDate(tomorrowFormatted);
        break;
      }

      case 'weekly': {
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 7);

        const startFormatted = `${startOfWeek.getFullYear()}-${String(startOfWeek.getMonth() + 1).padStart(2, '0')}-${String(startOfWeek.getDate()).padStart(2, '0')}`;
        const endFormatted = `${endOfWeek.getFullYear()}-${String(endOfWeek.getMonth() + 1).padStart(2, '0')}-${String(endOfWeek.getDate()).padStart(2, '0')}`;

        setStartDate(startFormatted);
        setEndDate(endFormatted);
        break;
      }

      case 'monthly': {
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

        const startFormatted = `${startOfMonth.getFullYear()}-${String(startOfMonth.getMonth() + 1).padStart(2, '0')}-${String(startOfMonth.getDate()).padStart(2, '0')}`;
        const endFormatted = `${endOfMonth.getFullYear()}-${String(endOfMonth.getMonth() + 1).padStart(2, '0')}-${String(endOfMonth.getDate()).padStart(2, '0')}`;

        setStartDate(startFormatted);
        setEndDate(endFormatted);
        break;
      }

      case 'yearly': {
        const startOfYear = new Date(today.getFullYear(), 0, 1);
        const endOfYear = new Date(today.getFullYear() + 1, 0, 1);

        const startFormatted = `${startOfYear.getFullYear()}-${String(startOfYear.getMonth() + 1).padStart(2, '0')}-${String(startOfYear.getDate()).padStart(2, '0')}`;
        const endFormatted = `${endOfYear.getFullYear()}-${String(endOfYear.getMonth() + 1).padStart(2, '0')}-${String(endOfYear.getDate()).padStart(2, '0')}`;

        setStartDate(startFormatted);
        setEndDate(endFormatted);
        break;
      }

      default: {
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        const todayFormatted = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        const tomorrowFormatted = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;

        setStartDate(todayFormatted);
        setEndDate(tomorrowFormatted);
      }
    }
  };

  // Apply filter when activeFilter changes
  useEffect(() => {
    setDateRange(activeFilter);
  }, [activeFilter, selectedCategory]);

  // Filter transactions based on date range, category, and search query - using useCallback to memoize
  const filterTransactionsByDate = useCallback((txns, start, end, categoryFilter, searchText) => {
    if (!start && !end && !categoryFilter && !searchText) {
      setFilteredTransactions(txns);
      return;
    }

    const startDateObj = start ? new Date(start) : null;
    const endDateObj = end ? new Date(end) : null;

    if (startDateObj) startDateObj.setHours(0, 0, 0, 0);
    if (endDateObj) endDateObj.setHours(23, 59, 59, 999);

    const filtered = txns.filter(tx => {
      // Date filtering
      const rawDate = tx.transaction_date;
      const txDate = rawDate instanceof Date
        ? rawDate
        : rawDate?.toDate?.() ?? null;

      if (!txDate) return false;

      const datePasses = (!startDateObj || txDate >= startDateObj) &&
                         (!endDateObj || txDate <= endDateObj);

      // Category filtering
      const categoryPasses = !categoryFilter || 
                            (tx.category_id === categoryFilter) || 
                            (categoryFilter === 'income' && tx.type_id === 'income') ||
                            (categoryFilter === 'expense' && tx.type_id === 'expense');

      // Search query filtering
      const searchPasses = !searchText || 
                          (tx.description && tx.description.toLowerCase().includes(searchText.toLowerCase()));

      return datePasses && categoryPasses && searchPasses;
    });

    console.log("Filtered transactions:", filtered.length, "of", txns.length, "with category:", categoryFilter, "search:", searchText);
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
          
          return { 
            id: doc.id, 
            amount: docData.amount,
            type_id: docData.type_id,
            category_id: docData.category_id,
            description: docData.description,
            transaction_date: docData.transaction_date?.toDate?.() || new Date(),
            user_id: docData.user_id
          };
        });
        setTransactions(data);
        
        // Apply filter to the new data
        filterTransactionsByDate(data, startDate, endDate, selectedCategory, searchQuery);
      },
      (error) => {
        console.error("Error listening to transactions:", error);
      }
    );

    return () => unsubscribe();
  }, [user, filterTransactionsByDate, startDate, endDate, selectedCategory, searchQuery]);

  // Update filtered transactions when dates, category, or search query change
  useEffect(() => {
    filterTransactionsByDate(transactions, startDate, endDate, selectedCategory, searchQuery);
  }, [transactions, startDate, endDate, selectedCategory, searchQuery, filterTransactionsByDate]);

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
    setSelectedCategory('');
    setSearchQuery('');
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const username = user?.email?.split('@')[0];

  return (
    <div className="dashboard-container">
      {/* Navbar */}
      <nav className="navbar">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <h1>Personal Finance Tracker</h1>
          <ul className="nav-tabs">
  <li className={location.pathname === '/' ? 'active' : ''}>
    <Link to="/" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center' }}>
      <FaTachometerAlt /> Dashboard
    </Link>
  </li>
  <li className={location.pathname === '/transactions' ? 'active' : ''}>
    <Link to="/transactions" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center' }}>
      <FaExchangeAlt /> Transactions
    </Link>
  </li>
  <li className={location.pathname === '/budgets' ? 'active' : ''}>
    <Link to="/budgets" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center' }}>
      <FaChartBar /> Visuals
    </Link>
  </li>
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

      {/* Transaction List Section - Full Width */}
      <div className="transaction-list-container" style={{ gridColumn: '1 / -1', marginTop: '20px' }}>
        <h2>All Transactions</h2>
        
        {/* Search Bar */}
        <div className="search-container" style={{ marginBottom: '20px' }}>
          <div className="search-box" style={{ position: 'relative', maxWidth: '400px' }}>
            <FaSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
            <input
              type="text"
              placeholder="Search by description..."
              value={searchQuery}
              onChange={handleSearchChange}
              style={{
                width: '100%',
                padding: '10px 40px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem'
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#666',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            )}
          </div>
        </div>
        
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
        
        {/* Date Filter */}
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

            <div className="filter-group">
              <label>Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="filter-input"
              >
                <option value="">All Categories</option>
                <optgroup label="Transaction Types">
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </optgroup>
                <optgroup label="Expense Categories">
                  <option value="Auto & Transport">Auto & Transport</option>
                  <option value="Bills">Bills</option>
                  <option value="Business">Business</option>
                  <option value="Donations">Donations</option>
                  <option value="Eating Out">Eating Out</option>
                  <option value="Education">Education</option>
                  <option value="Entertainment & Rec">Entertainment & Rec</option>
                  <option value="Gifts">Gifts</option>
                  <option value="Groceries">Groceries</option>
                  <option value="Health">Health</option>
                  <option value="Home">Home</option>
                  <option value="Medical">Medical</option>
                  <option value="Pets">Pets</option>
                  <option value="Tech">Tech</option>
                  <option value="Travel">Travel</option>
                </optgroup>
              </select>
            </div>

            <button 
              className="clear-filter-btn"
              onClick={clearFilters}
            >
              Reset All Filters
            </button>
          </div>

          {(startDate || endDate || selectedCategory || searchQuery) && (
            <p className="filter-info">
              Showing {filteredTransactions.length} transactions
              {activeFilter !== 'custom' && ` (${activeFilter})`}
              {selectedCategory && ` in category: ${selectedCategory}`}
              {searchQuery && ` matching: "${searchQuery}"`}
            </p>
          )}
        </div>
        
        {filteredTransactions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            <h3>No transactions found</h3>
            <p>{transactions.length > 0 ? 'Try adjusting your filters or search query.' : 'You haven\'t added any transactions yet.'}</p>
            {transactions.length === 0 && (
              <Link to="/" style={{ color: '#0053a0', textDecoration: 'none' }}>
                ← Go to Dashboard to add your first transaction
              </Link>
            )}
          </div>
        ) : (
          <div className="transactions">
            {filteredTransactions.map(tx => (
              <div key={tx.id} className={`transaction-item ${tx.type_id}`}>
                <div className="transaction-info">
                  <div className="transaction-desc">{tx.description}</div>
                  <div className="transaction-meta">
                    <span className="transaction-date">
                      {tx.transaction_date?.toLocaleDateString()}
                    </span>
                    {tx.category_id && tx.category_id !== 'income' && tx.category_id !== 'expense' && (
                      <span className="transaction-category">
                        • {tx.category_id}
                      </span>
                    )}
                    {tx.type_id && (
                      <span className={`transaction-type ${tx.type_id}`}>
                        • {tx.type_id.charAt(0).toUpperCase() + tx.type_id.slice(1)}
                      </span>
                    )}
                  </div>
                </div>
                <div className={`transaction-amount ${tx.type_id}`}>
                  {tx.type_id === 'income' ? '+' : '-'}${parseFloat(tx.amount || 0).toFixed(2)}
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
  );
};

export default Transactions;