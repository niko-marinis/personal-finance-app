import React, { useState, useEffect, useCallback } from 'react';
import { getAuth, signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { db } from './firebase';
import { deleteTransaction } from './services/transactionService';
import Navigation from './components/Navigation';
import Filter from './components/Filter';
import { getDateRange } from './utils/dateUtils';
import './App.css';

const Transactions = ({ user }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [activeFilter, setActiveFilter] = useState('daily');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
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

  // Filter transactions based on date range, category, and search query
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
      } catch (error) {
        console.error("Error deleting transaction:", error);
        alert("Error deleting transaction: " + error.message);
      }
    }
  };

  const clearFilters = () => {
    setActiveFilter('daily');
    setSelectedCategory('');
    setSearchQuery('');
  };

  return (
    <div className="dashboard-container">
      <Navigation 
        user={user} 
        showDropdown={showDropdown} 
        setShowDropdown={setShowDropdown} 
        handleLogout={handleLogout} 
      />

      {/* Transaction List Section - Full Width */}
      <div className="transaction-list-container" style={{ gridColumn: '1 / -1', marginTop: '20px' }}>
        <h2>All Transactions</h2>
        
        <Filter
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          showSearch={true}
          onClearFilters={clearFilters}
        />

        {(startDate || endDate || selectedCategory || searchQuery) && (
          <p className="filter-info">
            Showing {filteredTransactions.length} transactions
            {activeFilter !== 'custom' && ` (${activeFilter})`}
            {selectedCategory && ` in category: ${selectedCategory}`}
            {searchQuery && ` matching: "${searchQuery}"`}
          </p>
        )}
        
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