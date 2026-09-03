import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Eye, EyeOff, Lock, AlertCircle, Loader2 } from 'lucide-react';
import './Login.css';

export default function AdminLogin() {
  const { user, isAdmin, adminLogin, loading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user && isAdmin) {
      navigate('/', { replace: true });
    }
  }, [user, isAdmin, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please provide administrative credentials.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await adminLogin(email, password);
      if (res.success && res.user) {
        navigate('/', { replace: true });
      } else {
        setError(res.message || 'Invalid administrative credentials or insufficient privileges.');
      }
    } catch {
      setError('Administrative server connection failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="aydara-login-container">
      <div className="login-light-beam"></div>
      <div className="login-light-beam-secondary"></div>

      <div className="login-glass-card">
        <div className="login-icon-wrap">
          <img
            src="/brand/aydara-logo-gold.svg"
            alt="AYDARA Maison"
            className="login-brand-icon"
            onError={(e) => {
              e.currentTarget.src = '/aydara-logo-gold.svg';
            }}
          />
        </div>

        <div className="login-card-head">
          <div className="login-access-badge">
            <ShieldCheck size={14} color="#C8A96B" />
            <span className="login-access-text">
              MAISON CMS • RESTRICTED ACCESS
            </span>
          </div>
          <h1 className="login-title">ADMINISTRATIVE ACCESS</h1>
          <p className="login-subtitle">
            Secure administrative portal. Authorized personnel only.
          </p>
        </div>

        {error && (
          <div className="login-error-badge">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-input-group">
            <input
              type="email"
              placeholder="Admin email"
              className="login-input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="login-input-group password-group">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Administrative password"
              className="login-input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              tabIndex="-1"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <button
            type="submit"
            className="login-submit-pill-btn"
            disabled={isSubmitting || loading}
          >
            {isSubmitting || loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>VERIFYING CREDENTIALS...</span>
              </>
            ) : (
              <span>SIGN IN TO CMS</span>
            )}
          </button>
        </form>

        <div className="login-card-footer">
          <div className="login-footer-security-note">
            <Lock size={12} color="#C8A96B" />
            <span>256-bit TLS Encrypted Session • Maison CMS</span>
          </div>
        </div>
      </div>
    </div>
  );
}
