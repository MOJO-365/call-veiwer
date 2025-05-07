import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/login.css';

const Login = ({ setIsAuthenticated }) => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isAuthenticated');
    if (isLoggedIn === 'true') {
      setIsAuthenticated(true);
      navigate('/calls');
    }
  }, [navigate, setIsAuthenticated]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    setTimeout(() => {
      const { username, password } = credentials;
      if ((username === 'admin' && password === 'admin123') || (username === 'user' && password === 'user123')) {
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('username', username); 
        setIsAuthenticated(true);
        navigate('/calls');
      } else {
        setError('Invalid username or password');
      }
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="login-container">
      {/* Fullscreen loader overlay */}
      {loading && (
        <div className="overlay">
          <div className="spinner"></div>
        </div>
      )}

      <form className="login-card" onSubmit={handleLogin}>
        <h2>Welcome Back</h2>
        <p className="subtitle">Please login to your account</p>

        <input
          type="text"
          placeholder="Username"
          value={credentials.username}
          onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={credentials.password}
          onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
          required
        />

        {error && <p className="error-text">{error}</p>}

        <button type="submit" disabled={loading}>
          Login
        </button>
      </form>
    </div>
  );
};

export default Login;
