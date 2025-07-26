import React, { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import Home from './Home';
import Login from './components/Login';
import Register from './components/Register';
import './App.css'

function App() {
  const [user, setUser] = useState(null);
  const [showRegister, setShowRegister] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  if (!user) {
    return showRegister ? (
      <>
        <Register onRegister={setUser} />
        <p>Already have an account? <button onClick={() => setShowRegister(false)}>Login</button></p>
      </>
    ) : (
      <>
        <Login onLogin={setUser} />
        <p>Don't have an account? <button onClick={() => setShowRegister(true)}>Register</button></p>
      </>
    );
  }

  return <Home user={user} />;
}

export default App;
