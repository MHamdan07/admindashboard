import React, { useState, useEffect } from 'react';
import { useAuth, PERMISSIONS } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  ShieldCheck,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle,
  AlertTriangle,
  History,
  Lock,
  LogOut,
  UserCheck,
  Shield,
  Clock,
  ExternalLink
} from 'lucide-react';
import './SecuritySettings.css';

export default function SecuritySettings({ onNavigateTab }) {
  const { user, token, isSuperAdmin, hasPermission, changePassword, logout } = useAuth();

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);

  useEffect(() => {
    const loadLogs = async () => {
      setLoadingLogs(true);
      try {
        const res = await api.getAuditLogs(token);
        if (res.success) {
          setAuditLogs(res.logs || []);
        }
      } catch (err) {
        console.error('Failed to load audit logs:', err);
      } finally {
        setLoadingLogs(false);
      }
    };

    loadLogs();
  }, [token]);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');

    if (newPassword.length < 6) {
      setPassError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassError('New passwords do not match. Please re-enter.');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const res = await changePassword(currentPassword, newPassword);
      if (res.success) {
        setPassSuccess('Your master password has been updated securely.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPassSuccess(''), 4000);
      } else {
        setPassError(res.message || 'Password update failed. Verify current credentials.');
      }
    } catch {
      setPassError('Error updating password.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="security-settings-container">
      <div className="security-grid-layout">
        {/* Section 1: Master Account Credentials */}
        <div className="security-card">
          <div className="card-head-title">
            <KeyRound size={20} className="gold-accent" />
            <div>
              <h3 className="section-title">Master Account Credentials</h3>
              <p className="section-subtext">Update authentication credentials and master portal access key.</p>
            </div>
          </div>

          <form onSubmit={handlePasswordSubmit} className="password-update-form">
            {passSuccess && (
              <div className="security-alert success">
                <CheckCircle size={15} />
                <span>{passSuccess}</span>
              </div>
            )}

            {passError && (
              <div className="security-alert error">
                <AlertTriangle size={15} />
                <span>{passError}</span>
              </div>
            )}

            <div className="sec-input-group">
              <label>Current Password</label>
              <div className="sec-input-wrap">
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="sec-input-group">
              <label>New Password (min. 6 characters)</label>
              <div className="sec-input-wrap">
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Enter new master password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="sec-pass-toggle"
                  tabIndex="-1"
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div className="sec-input-group">
              <label>Confirm New Password</label>
              <div className="sec-input-wrap">
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Re-enter new master password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="update-password-btn"
              disabled={isUpdatingPassword}
            >
              {isUpdatingPassword ? 'UPDATING CREDENTIALS...' : 'UPDATE PASSWORD'}
            </button>
          </form>
        </div>

        {/* Section 2: Active Session & Role Profile */}
        <div className="security-card session-overview">
          <div className="card-head-title">
            <UserCheck size={20} className="gold-accent" />
            <div>
              <h3 className="section-title">Active Session &amp; Role Profile</h3>
              <p className="section-subtext">Current authenticated identity and cryptographic session status.</p>
            </div>
          </div>

          <div className="session-details-list">
            <div className="session-detail-item">
              <span className="detail-label">Authenticated Account</span>
              <span className="detail-value">{user?.email || 'entermh07@gmail.com'}</span>
            </div>

            <div className="session-detail-item">
              <span className="detail-label">Role Tier</span>
              <span className="detail-value role-pill">{user?.role || (isSuperAdmin ? 'SUPER_ADMIN' : 'STAFF')}</span>
            </div>

            <div className="session-detail-item">
              <span className="detail-label">Security Protocol</span>
              <span className="detail-value">Row-Level Security (RLS) &amp; JWT Token</span>
            </div>

            <div className="session-detail-item">
              <span className="detail-label">Session Status</span>
              <span className="detail-value status-active">
                <CheckCircle size={14} /> Active &amp; Verified
              </span>
            </div>
          </div>

          <div className="session-card-actions">
            {onNavigateTab && (isSuperAdmin || hasPermission(PERMISSIONS.STAFF_VIEW)) && (
              <button
                type="button"
                onClick={() => onNavigateTab('staff')}
                className="goto-staff-btn"
              >
                <span>MANAGE STAFF &amp; PERMISSIONS</span>
                <ExternalLink size={14} />
              </button>
            )}

            <button
              type="button"
              onClick={logout}
              className="security-logout-btn"
            >
              <LogOut size={15} />
              <span>TERMINATE SESSION</span>
            </button>
          </div>
        </div>
      </div>

      {/* Section 3: Security & Administrative Audit Trail */}
      <div className="audit-trail-section">
        <div className="table-header-title" style={{ marginBottom: '16px' }}>
          <History size={20} className="gold-accent" />
          <div>
            <h3 className="section-title">Security &amp; Administrative Audit Trail</h3>
            <p className="section-subtext">Immutable activity ledger documenting authentication events and permission updates.</p>
          </div>
        </div>

        {loadingLogs ? (
          <div className="audit-empty-state">
            <p>Loading security audit logs...</p>
          </div>
        ) : auditLogs.length === 0 ? (
          <div className="audit-empty-state">
            <History size={40} className="empty-icon" />
            <h4>No security events recorded yet.</h4>
            <p>Authentication and administrative operations will be audited here in real time.</p>
          </div>
        ) : (
          <div className="audit-table-responsive">
            <table className="audit-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action / Event</th>
                  <th>Actor Identity</th>
                  <th>Target Resource</th>
                  <th>Event Details</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log, idx) => (
                  <tr key={log.id || idx}>
                    <td>
                      <div className="audit-time">
                        <Clock size={12} className="gold-accent" />
                        <span>{new Date(log.created_at).toLocaleString()}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`event-badge ${log.action?.toLowerCase()}`}>
                        {log.action}
                      </span>
                    </td>
                    <td>
                      <span className="actor-email">{log.actor_email || 'SYSTEM'}</span>
                    </td>
                    <td>
                      <span className="target-res">{log.target_resource || 'ADMIN_PORTAL'}</span>
                    </td>
                    <td>
                      <span className="details-json">
                        {typeof log.details === 'object' ? JSON.stringify(log.details) : String(log.details)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
