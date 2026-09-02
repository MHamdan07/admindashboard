import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Eye, EyeOff, ArrowRight } from 'lucide-react';
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
      navigate('/admin', { replace: true });
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
        navigate('/admin', { replace: true });
      } else {
        setError(res.message || 'Invalid administrative credentials or insufficient privileges.');
      }
    } catch {
      setError('Administrative server connection failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="aydara-login-container" style={{ background: '#0a030e' }}>
      <div className="login-light-beam" style={{ background: 'radial-gradient(ellipse at top right, rgba(200, 169, 107, 0.2) 0%, rgba(36, 17, 47, 0) 70%)' }}></div>

      <div className="login-glass-card" style={{ maxWidth: '460px', border: '1px solid rgba(200, 169, 107, 0.25)' }}>
        <div className="login-icon-wrap" style={{ width: '52px', height: '52px' }}>
          <img src="/brand/aydara-logo-gold.svg" alt="AYDARA Maison" className="login-brand-icon" />
        </div>

        <div className="login-card-head">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(200, 169, 107, 0.15)', padding: '4px 10px', borderRadius: '4px', marginBottom: '12px' }}>
            <ShieldCheck size={14} className="gold-accent" />
            <span style={{ fontSize: '0.68rem', fontWeight: '700', letterSpacing: '0.12em', color: 'var(--color-gold)' }}>
              MAISON CMS • RESTRICTED ACCESS
            </span>
          </div>
          <h1 className="login-title" style={{ fontSize: '1.75rem' }}>ADMINISTRATIVE ACCESS</h1>
          <p className="login-subtitle">
            Secure administrative portal. Authorized personnel only.
          </p>
        </div>

        {error && (
          <div className="login-error-badge" style={{ background: 'rgba(220, 38, 38, 0.2)', border: '1px solid rgba(220, 38, 38, 0.4)' }}>
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
              tabIndex="-1"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <button
            type="submit"
            className="login-submit-pill-btn"
            style={{ background: 'var(--color-gold)', color: '#160B1C', fontWeight: '700' }}
            disabled={isSubmitting || loading}
          >
            {isSubmitting || loading ? 'VERIFYING CREDENTIALS...' : 'SIGN IN TO CMS'}
          </button>
        </form>

        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', width: '100%', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <Link to="/" style={{ color: '#A99FAD', fontSize: '0.75rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>Storefront</span>
            <ArrowRight size={12} />
          </Link>
        </div>
      </div>
    </div>
  );
}
