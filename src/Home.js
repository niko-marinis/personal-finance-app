import React, { useState } from 'react';
import { getAuth, signOut } from 'firebase/auth';
import './App.css';
import { FaTachometerAlt, FaExchangeAlt, FaWallet, FaUser } from 'react-icons/fa';

const Home = ({ user }) => {
  const [showDropdown, setShowDropdown] = useState(false);

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

  const username = user?.email?.split('@')[0];

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
          <div className="stat-amount">$1,400</div>
        </div>
        <div className="stat-card">
          <h3>Total Expenses</h3>
          <div className="stat-amount">$750</div>
        </div>
        <div className="stat-card">
          <h3>Remaining Budget</h3>
          <div className="stat-amount">$450</div>
        </div>
      </div>

      </div>
  );
};

export default Home;