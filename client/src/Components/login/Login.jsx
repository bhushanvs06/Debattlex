import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const LoginPage = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState('login'); // 'login' or 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [message, setMessage] = useState('');
  const url = 'https://debattlex.onrender.com'
  
  const navigate = useNavigate();

  const handleSubmit = async () => {
    const endpoint = mode === 'signup' ? '/api/signup' : '/api/login';
    const fullURL = `${url}${endpoint}`;
    const payload = mode === 'signup'
      ? { email, password, displayName }
      : { email, password };

    try {
      const res = await axios.post(fullURL, payload);
      console.log((url,`${endpoint} hiiii`))
      setMessage(res.data.message);

      if (res.data.user) {
        localStorage.setItem("userEmail", res.data.user.email);
        if (res.data.token) localStorage.setItem("token", res.data.token);

        onLoginSuccess(res.data.user);

        if (mode === 'signup') {
          navigate('/list'); // ✅ Redirect after signup
        }
      } else {
        onLoginSuccess({ email });
      }
    } catch (err) {
      setMessage(err.response?.data?.error || 'Something went wrong');
    }
  };

  return (
    <div className='login-page'>
      <div
        style={{
          maxWidth: '400px',
          margin: '50px auto',
          padding: '3em',
          background: '#1e1e2f',
          borderRadius: '15px',
          boxShadow: '0 8px 20px rgba(0, 0, 0, 0.4)',
          fontFamily: 'Arial, sans-serif',
          textAlign: 'center',
          color: '#e0e0e0',
        }}
      >
        <h2 style={{ marginBottom: '20px', color: '#ffffff', marginLeft: '2.4em' }}>
          {mode === 'signup' ? 'Sign Up' : 'Login'}
        </h2>

        {mode === 'signup' && (
          <input
            type="text"
            placeholder="Full Name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              marginBottom: '15px',
              borderRadius: '8px',
              border: '1px solid #555',
              backgroundColor: '#2c2c3e',
              color: '#fff',
              fontSize: '16px',
            }}
          />
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            width: '100%',
            padding: '10px',
            marginBottom: '15px',
            borderRadius: '8px',
            border: '1px solid #555',
            backgroundColor: '#2c2c3e',
            color: '#fff',
            fontSize: '16px',
          }}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: '100%',
            padding: '10px',
            marginBottom: '20px',
            borderRadius: '8px',
            border: '1px solid #555',
            backgroundColor: '#2c2c3e',
            color: '#fff',
            fontSize: '16px',
          }}
        />

        <button
          onClick={handleSubmit}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#9b5de5',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '16px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            marginBottom: '15px',
            transition: '0.3s',
          }}
        >
          {mode === 'signup' ? 'Create Account' : 'Login'}
        </button>

        <p style={{ color: '#3ee86f', margin: '10px 0' }}>{message}</p>

        <p style={{ fontSize: '14px', color: '#aaa' }}>
          {mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')}
            style={{
              background: 'none',
              border: 'none',
              color: '#76a9fa',
              cursor: 'pointer',
              fontWeight: 'bold',
              textDecoration: 'underline',
              padding: 0,
            }}
          >
            {mode === 'signup' ? 'Login' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
