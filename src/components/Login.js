import React, { useState } from 'react';
import { login } from '../services/authService';
import './Login.css';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await login(email, password);
      onLogin(userCredential.user);
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1 className="login-title">Welcome</h1>
        <p className="login-subtitle">Sign in to continue to your dashboard</p>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <button type="submit">Login</button>
        </form>
        <div className="login-footer">
          <p>Don't have an account? <a href="/register">Sign up</a></p>
          <button className="microsoft-login">Sign in with Microsoft</button>
        </div>
      </div>
    </div>
  );
};

export default Login;
