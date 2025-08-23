import React, { useState, useEffect, useCallback } from 'react';
import { getAuth, signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from './firebase';
import { addTransaction, deleteTransaction } from './services/transactionService';
import Navigation from './components/Navigation';
import Filter from './components/Filter';
import { getDateRange } from './utils/dateUtils';
import './App.css';

const Home = ({ user }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('expense');
  const [isLoading, setIsLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState('daily');
  const [selectedCategory, setSelectedCategory] = useState('');
  
  // Set default dates based on active filter
  const { startDate: defaultStartDate, endDate: defaultEndDate } = getDateRange('daily');
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);

  // Apply filter when activeFilter changes
  useEffect(() => {
    const { startDate: newStartDate, endDate: newEndDate } = getDateRange(activeFilter);
    setStartDate(newStartDate);
    setEndDate(newEndDate);
  }, [activeFilter]);

  // Filter transactions based on date range and category
  const filterTransactionsByDate = useCallback((txns, start, end, categoryFilter) => {
    if (!start && !end && !categoryFilter) {
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

      return datePasses && categoryPasses;
    });

    setFilteredTransactions(filtered);
  }, []);

  useEffect(() => {
    if (!user?.uid) return;
    
    const q = query(
      collection(db, 'transactions'), 
      where('user_id', '==', user.uid),
      orderBy('transaction_date', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
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
        filterTransactionsByDate(data, startDate, endDate, selectedCategory);
      },
      (error) => {
        console.error("Error listening to transactions:", error);
      }
    );

    return () => unsubscribe();
  }, [user, filterTransactionsByDate, startDate, endDate, selectedCategory]);

  // Update filtered transactions when dates or category change
  useEffect(() => {
    filterTransactionsByDate(transactions, startDate, endDate, selectedCategory);
  }, [transactions, startDate, endDate, selectedCategory, filterTransactionsByDate]);

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
      await addTransaction(user.uid, amount, type, category, description);
      setAmount('');
      setCategory('');
      setDescription('');
      setType('expense');
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
      } catch (error) {
        console.error("Error deleting transaction:", error);
        alert("Error deleting transaction: " + error.message);
      }
    }
  };

  const clearFilters = () => {
    setActiveFilter('daily');
    setSelectedCategory('');
  };

  // Calculate totals for the stats cards based on filtered transactions
  const totalIncome = filteredTransactions
    .filter(tx => tx.type_id === 'income')
    .reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);
  
  const totalExpenses = filteredTransactions
    .filter(tx => tx.type_id === 'expense')
    .reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);
  
  const remainingBudget = totalIncome - totalExpenses;

  return (
    <div className="dashboard-container">
      <Navigation 
        user={user} 
        showDropdown={showDropdown} 
        setShowDropdown={setShowDropdown} 
        handleLogout={handleLogout} 
      />

      {/* Stat Cards Section */}
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
                value={type} 
                onChange={(e) => setType(e.target.value)}
                className="form-select"
              >
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>
            
            {type === 'expense' && (
              <div className="form-group">
                <label>Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="form-select"
                  required={type === 'expense'}
                >
                  <option value="">Select a category</option>
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
                </select>
              </div>
            )}

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
          
          <Filter
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            onClearFilters={clearFilters}
          />

          {(startDate || endDate || selectedCategory) && (
            <p className="filter-info">
              Showing {filteredTransactions.length} transactions
              {activeFilter !== 'custom' && ` (${activeFilter})`}
              {selectedCategory && ` in category: ${selectedCategory}`}
            </p>
          )}
          
          {filteredTransactions.length === 0 ? (
            <p>No transactions found. {transactions.length > 0 ? 'Try adjusting your filters.' : 'Try adding a transaction!'}</p>
          ) : (
            <div className="transactions">
              {filteredTransactions.map(tx => (
                <div key={tx.id} className={`transaction-item ${tx.type_id}`}>
                  <div className="transaction-info">
                    <div className="transaction-desc">{tx.description}</div>
                    <div className="transaction-date">
                      {tx.transaction_date?.toLocaleDateString()}
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
    </div>
  );
};

export default Home;