import React, { useState } from 'react';
import { login } from '../services/authService';
import { signInWithGoogle } from '../services/authService';
import { Link, useNavigate } from 'react-router-dom';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/'); // Navigate to home after successful login
    } catch (error) {
      alert(error.message);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
      navigate('/'); // Navigate to home after successful login
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1 className="login-title">Welcome</h1>
        <p className="login-subtitle">Sign in to continue to your personal finance dashboard</p>
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
          <p>Don't have an account? <Link to="/register">Sign up</Link></p>
          <button className="google-login" onClick={handleGoogleLogin}>
            <img src="https://logos-world.net/wp-content/uploads/2020/09/Google-Symbol.png" width={50} alt="Google logo" />
            Sign in with Google
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;