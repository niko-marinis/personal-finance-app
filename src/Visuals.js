import React, { useState, useEffect } from 'react';
import { getAuth, signOut } from 'firebase/auth'; // Add this import
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { db } from './firebase';
import Navigation from './components/Navigation';
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

  return (
    <div className="dashboard-container">
      <Navigation 
        user={user} 
        showDropdown={showDropdown} 
        setShowDropdown={setShowDropdown} 
        handleLogout={handleLogout} 
      />

      <div className="visuals-container">
        <h2>Financial Visualizations</h2>
        
        <div className="time-range-selector">
          <label>Time Range:</label>
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="time-range-select"
          >
            <option value="weekly">Last 7 Days</option>
            <option value="monthly">Last 30 Days</option>
            <option value="yearly">Last 12 Months</option>
          </select>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="no-data-message">
            <h3>No transaction data available</h3>
            <p>Add some transactions to see visualizations of your finances</p>
            <Link to="/" className="cta-button">
              Add Transactions
            </Link>
          </div>
        ) : (
          <>
            <div className="chart-grid">
              <div className="chart-container">
                <Bar data={barChartData} options={chartOptions} />
              </div>
              
              <div className="chart-container">
                <Pie data={pieChartData} options={pieChartOptions} />
              </div>
            </div>

            <div className="stats-overview">
              <div className="stat-card">
                <h3>Total Income</h3>
                <div className="stat-amount">
                  ${Object.values(monthlyData).reduce((sum, data) => sum + data.income, 0).toFixed(2)}
                </div>
              </div>
              <div className="stat-card">
                <h3>Total Expenses</h3>
                <div className="stat-amount">
                  ${Object.values(monthlyData).reduce((sum, data) => sum + data.expenses, 0).toFixed(2)}
                </div>
              </div>
              <div className="stat-card">
                <h3>Net Balance</h3>
                <div className="stat-amount">
                  ${(Object.values(monthlyData).reduce((sum, data) => sum + data.income, 0) - 
                     Object.values(monthlyData).reduce((sum, data) => sum + data.expenses, 0)).toFixed(2)}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Visuals;