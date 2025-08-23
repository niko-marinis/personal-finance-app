import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, setPersistence, browserSessionPersistence, signOut } from 'firebase/auth';
import { auth } from './firebase';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './Home';
import Transactions from './Transactions';
import Visuals from './Visuals';
import Login from './components/Login';
import Register from './components/Register';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set session persistence so user is logged out when tab/window closes
    setPersistence(auth, browserSessionPersistence)
      .then(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          setUser(user);
          setLoading(false);
        });

        // Sign out when closing window/tab
        const handleUnload = () => {
          signOut(auth).catch((err) => console.error('Sign out error:', err));
        };

        window.addEventListener('beforeunload', handleUnload);

        return () => {
          unsubscribe();
          window.removeEventListener('beforeunload', handleUnload);
        };
      })
      .catch((error) => {
        console.error('Persistence setup error:', error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={user ? <Home user={user} /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/transactions"
          element={user ? <Transactions user={user} /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/budgets"
          element={user ? <Visuals user={user} /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/login"
          element={!user ? <Login /> : <Navigate to="/" replace />}
        />
        <Route
          path="/register"
          element={!user ? <Register /> : <Navigate to="/" replace />}
        />
      </Routes>
    </Router>
  );
}

export default App;