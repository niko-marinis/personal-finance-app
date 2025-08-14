import React, { useState } from 'react';
import TransactionList from './components/transactionList';
import TransactionForm from './components/transactionForm';
import { getAuth, signOut } from 'firebase/auth';
import './App.css'

const Home = ({ user }) => {
  const [userId] = useState(user?.uid || "demo-user-id");
  const [transactionToEdit, setTransactionToEdit] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);


  const handleSave = () => {
    setTransactionToEdit(null); // Clears form after save
  };

  
const handleLogout = () => {
    const auth = getAuth();
    signOut(auth)
      .then(() => {
        window.location.reload(); // or redirect to login page
      })
      .catch((error) => {
        alert("Logout failed: " + error.message);
      });
  };

const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  return (
    <div className="home-container">
      
<nav className="navbar">
  <h1>Personal Finance Tracker</h1>
  <div className="navbar-right">
    <ul>
      <li>Dashboard</li>
      <li>Transactions</li>
      <li>Budgets</li>
    </ul>
    <div className="user-menu">
      <div className="user-icon" onClick={toggleDropdown} title="User Menu">
        👤
      </div>
      {showDropdown && (
        <div className="dropdown-menu">
          <div className="dropdown-item" onClick={handleLogout}>Logout</div>
        </div>
      )}
    </div>
  </div>
</nav>

      <div className="summary-cards">
        <div className="card income">TOTAL INCOME: $1,400</div>
        <div className="card expenses">TOTAL EXPENSES: $750</div>
        <div className="card remaining">REMAINING BUDGET: $450</div>
      </div>

      <div className="actions">
        <button onClick={() => setTransactionToEdit(null)} className="add-transaction">
          ADD TRANSACTION
        </button>
      </div>

      <TransactionForm
        userId={userId}
        existingTransaction={transactionToEdit}
        onSave={handleSave}
      />

      <TransactionList
        userId={userId}
        onEdit={setTransactionToEdit}
      />
    </div>
  );
};

export default Home;
