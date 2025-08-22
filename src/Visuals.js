import React, { useState, useEffect } from 'react';
import { getAuth, signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { Link, useLocation } from 'react-router-dom';
import { db } from './firebase';
import { FaTachometerAlt, FaExchangeAlt, FaChartBar, FaUser } from 'react-icons/fa';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Visuals = ({ user }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [timeRange, setTimeRange] = useState('monthly');
  const location = useLocation();

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
            amount: parseFloat(docData.amount),
            type_id: docData.type_id,
            category_id: docData.category_id,
            description: docData.description,
            transaction_date: docData.transaction_date?.toDate?.() || new Date(),
          };
        });
        setTransactions(data);
      },
      (error) => {
        console.error("Error listening to transactions:", error);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Prepare data for charts
  const getChartData = () => {
    const now = new Date();
    let startDate;
    
    switch(timeRange) {
      case 'weekly':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'monthly':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'yearly':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        startDate = new Date(now.setMonth(now.getMonth() - 1));
    }

    const filteredTransactions = transactions.filter(tx => 
      tx.transaction_date >= startDate
    );

    // Calculate data for bar chart (monthly income vs expenses)
    const monthlyData = {};
    filteredTransactions.forEach(tx => {
      const monthYear = tx.transaction_date.toLocaleDateString('en-US', { 
        month: 'short', 
        year: 'numeric' 
      });
      
      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = { income: 0, expenses: 0 };
      }
      
      if (tx.type_id === 'income') {
        monthlyData[monthYear].income += tx.amount;
      } else {
        monthlyData[monthYear].expenses += tx.amount;
      }
    });

    // Calculate data for pie chart (expense categories)
    const categoryData = {};
    filteredTransactions.forEach(tx => {
      if (tx.type_id === 'expense' && tx.category_id && tx.category_id !== 'expense') {
        const category = tx.category_id;
        categoryData[category] = (categoryData[category] || 0) + tx.amount;
      }
    });

    return { monthlyData, categoryData, filteredTransactions };
  };

  const { monthlyData, categoryData, filteredTransactions } = getChartData();

  // Bar Chart Data
  const barChartData = {
    labels: Object.keys(monthlyData),
    datasets: [
      {
        label: 'Income',
        data: Object.values(monthlyData).map(data => data.income),
        backgroundColor: 'rgba(46, 204, 113, 0.8)',
        borderColor: 'rgba(46, 204, 113, 1)',
        borderWidth: 1,
      },
      {
        label: 'Expenses',
        data: Object.values(monthlyData).map(data => data.expenses),
        backgroundColor: 'rgba(231, 76, 60, 0.8)',
        borderColor: 'rgba(231, 76, 60, 1)',
        borderWidth: 1,
      },
    ],
  };

  // Pie Chart Data
  const pieChartData = {
    labels: Object.keys(categoryData),
    datasets: [
      {
        data: Object.values(categoryData),
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
          '#FF9F40', '#8AC926', '#1982C4', '#6A4C93', '#F15BB5',
          '#00BBF9', '#00F5D4', '#FEE440', '#9B5DE5', '#00F5D4'
        ],
        borderColor: '#fff',
        borderWidth: 2,
        hoverOffset: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          boxWidth: 12,
          font: {
            size: 10
          }
        }
      },
      title: {
        display: true,
        text: 'Income vs Expenses',
        font: {
          size: 14
        }
      },
    },
    scales: {
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          font: {
            size: 10
          }
        }
      },
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return '$' + value;
          }
        }
      }
    }
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          boxWidth: 10,
          font: {
            size: 9
          },
          padding: 8
        }
      },
      title: {
        display: true,
        text: 'Expense Categories',
        font: {
          size: 14
        }
      },
    },
  };

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

      <div className="visuals-header">
        <h1>Financial Visualizations</h1>
        <div className="time-filter">
          <label>Time Range: </label>
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="time-range-select"
          >
            <option value="weekly">Last 7 Days</option>
            <option value="monthly">Last 30 Days</option>
            <option value="yearly">Last Year</option>
          </select>
        </div>
      </div>

      {filteredTransactions.length === 0 ? (
        <div className="no-data-message">
          <h3>No transaction data available</h3>
          <p>Add some transactions on the dashboard to see visualizations.</p>
          <Link to="/" className="dashboard-link">
            Go to Dashboard
          </Link>
        </div>
      ) : (
        <>
          <div className="charts-container">
            <div className="chart-card">
              <h3>Income vs Expenses</h3>
              <div className="chart-wrapper">
                <Bar data={barChartData} options={chartOptions} />
              </div>
            </div>

            <div className="chart-card">
              <h3>Expense Breakdown</h3>
              <div className="chart-wrapper">
                <Pie data={pieChartData} options={pieChartOptions} />
              </div>
            </div>
          </div>

          <div className="stats-summary">
            <div className="stat-item">
              <h4>Total Transactions</h4>
              <p>{filteredTransactions.length}</p>
            </div>
            <div className="stat-item">
              <h4>Total Income</h4>
              <p style={{ color: '#2ecc71' }}>
                ${filteredTransactions
                  .filter(tx => tx.type_id === 'income')
                  .reduce((sum, tx) => sum + tx.amount, 0)
                  .toFixed(2)}
              </p>
            </div>
            <div className="stat-item">
              <h4>Total Expenses</h4>
              <p style={{ color: '#e74c3c' }}>
                ${filteredTransactions
                  .filter(tx => tx.type_id === 'expense')
                  .reduce((sum, tx) => sum + tx.amount, 0)
                  .toFixed(2)}
              </p>
            </div>
            <div className="stat-item">
              <h4>Net Balance</h4>
              <p style={{ 
                color: filteredTransactions
                  .filter(tx => tx.type_id === 'income')
                  .reduce((sum, tx) => sum + tx.amount, 0) -
                  filteredTransactions
                  .filter(tx => tx.type_id === 'expense')
                  .reduce((sum, tx) => sum + tx.amount, 0) >= 0 
                  ? '#2ecc71' : '#e74c3c' 
              }}>
                ${(
                  filteredTransactions
                    .filter(tx => tx.type_id === 'income')
                    .reduce((sum, tx) => sum + tx.amount, 0) -
                  filteredTransactions
                    .filter(tx => tx.type_id === 'expense')
                    .reduce((sum, tx) => sum + tx.amount, 0)
                ).toFixed(2)}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Visuals;