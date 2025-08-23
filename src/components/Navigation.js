import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaTachometerAlt, FaExchangeAlt, FaChartBar, FaUser } from 'react-icons/fa';

const Navigation = ({ user, showDropdown, setShowDropdown, handleLogout }) => {
  const location = useLocation();
  const username = user?.email?.split('@')[0];

  return (
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
  );
};

export default Navigation;