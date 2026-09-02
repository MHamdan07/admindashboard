import React, { useState, useEffect } from 'react';
import { useAuth, PERMISSIONS } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  Users,
  UserPlus,
  ShieldCheck,
  ShieldAlert,
  Edit2,
  Trash2,
  Power,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Lock,
  Mail,
  User,
  KeyRound,
  FileCheck,
  Check,
  Sparkles
} from 'lucide-react';
import './StaffManagement.css';

const AVAILABLE_PERMISSIONS = [
  { id: PERMISSIONS.DASHBOARD_VIEW, label: 'Dashboard Overview', category: 'General' },
  { id: PERMISSIONS.PRODUCTS_VIEW, label: 'View Products & Catalog', category: 'Catalog' },
  { id: PERMISSIONS.PRODUCTS_CREATE, label: 'Create Products', category: 'Catalog' },
  { id: PERMISSIONS.PRODUCTS_EDIT, label: 'Edit Products & Pricing', category: 'Catalog' },
  { id: PERMISSIONS.PRODUCTS_DELETE, label: 'Delete Products', category: 'Catalog' },
  { id: PERMISSIONS.INVENTORY_VIEW, label: 'View Inventory & Stock', category: 'Catalog' },
  { id: PERMISSIONS.INVENTORY_EDIT, label: 'Update Stock Levels', category: 'Catalog' },
  { id: PERMISSIONS.ORDERS_VIEW, label: 'View Orders', category: 'Orders' },
  { id: PERMISSIONS.ORDERS_EDIT, label: 'Edit Orders & Tracking', category: 'Orders' },
  { id: PERMISSIONS.ORDERS_UPDATE_STATUS, label: 'Update Order Status', category: 'Orders' },
  { id: PERMISSIONS.CUSTOMERS_VIEW, label: 'View Customer Profiles', category: 'Customers' },
  { id: PERMISSIONS.CUSTOMERS_EDIT, label: 'Edit Customer Information', category: 'Customers' },
  { id: PERMISSIONS.HOMEPAGE_CMS_VIEW, label: 'View Homepage CMS', category: 'CMS' },
  { id: PERMISSIONS.HOMEPAGE_CMS_EDIT, label: 'Edit Hero & Banner Media', category: 'CMS' },
  { id: PERMISSIONS.FOOTER_CMS_EDIT, label: 'Edit Footer CMS', category: 'CMS' },
  { id: PERMISSIONS.MEDIA_VIEW, label: 'View Media Library', category: 'Media' },
  { id: PERMISSIONS.MEDIA_UPLOAD, label: 'Upload Media Assets', category: 'Media' },
  { id: PERMISSIONS.SETTINGS_VIEW, label: 'View Global Settings', category: 'Settings' },
  { id: PERMISSIONS.SETTINGS_EDIT, label: 'Edit Brand & Shipping Settings', category: 'Settings' },
  { id: PERMISSIONS.STAFF_VIEW, label: 'View Staff Members', category: 'Administration' },
  { id: PERMISSIONS.STAFF_CREATE, label: 'Add / Invite Staff', category: 'Administration' },
  { id: PERMISSIONS.STAFF_EDIT, label: 'Edit Staff Permissions', category: 'Administration' },
  { id: PERMISSIONS.STAFF_DISABLE, label: 'Disable / Enable Staff', category: 'Administration' },
  { id: PERMISSIONS.STAFF_DELETE, label: 'Remove Staff Members', category: 'Administration' },
  { id: PERMISSIONS.AUDIT_LOG_VIEW, label: 'View Security Audit Logs', category: 'Security' }
];

export default function StaffManagement() {
  const { user, token, isSuperAdmin, hasPermission } = useAuth();
  const [staffMembers, setStaffMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [deletingStaff, setDeletingStaff] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    role: 'STAFF',
    status: 'active',
    permissions: [
      PERMISSIONS.DASHBOARD_VIEW,
      PERMISSIONS.ORDERS_VIEW,
      PERMISSIONS.PRODUCTS_VIEW
    ]
  });

  const loadStaff = async () => {
    setLoading(true);
    try {
      const res = await api.getStaffMembers(token);
      if (res.success) {
        setStaffMembers(res.staff || []);
      }
    } catch (err) {
      console.error('Failed to load staff members:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, [token]);

  const handleOpenAddModal = () => {
    setEditingStaff(null);
    setFormData({
      displayName: '',
      email: '',
      password: '',
      role: 'STAFF',
      status: 'active',
      permissions: [
        PERMISSIONS.DASHBOARD_VIEW,
        PERMISSIONS.ORDERS_VIEW,
        PERMISSIONS.PRODUCTS_VIEW
      ]
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (staff) => {
    setEditingStaff(staff);
    setFormData({
      displayName: staff.display_name || staff.displayName,
      email: staff.email,
      password: '',
      role: staff.role || 'STAFF',
      status: staff.status || 'active',
      permissions: Array.isArray(staff.permissions) ? staff.permissions : []
    });
    setError('');
    setIsModalOpen(true);
  };

  const handlePermissionToggle = (permId) => {
    setFormData(prev => {
      const exists = prev.permissions.includes(permId);
      return {
        ...prev,
        permissions: exists
          ? prev.permissions.filter(p => p !== permId)
          : [...prev.permissions, permId]
      };
    });
  };

  const handleSelectAllCategory = (category) => {
    const categoryPermIds = AVAILABLE_PERMISSIONS.filter(p => p.category === category).map(p => p.id);
    const allSelected = categoryPermIds.every(id => formData.permissions.includes(id));

    setFormData(prev => ({
      ...prev,
      permissions: allSelected
        ? prev.permissions.filter(id => !categoryPermIds.includes(id))
        : Array.from(new Set([...prev.permissions, ...categoryPermIds]))
    }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.displayName.trim() || !formData.email.trim()) {
      setError('Please provide full name and email address.');
      return;
    }

    try {
      let res;
      if (editingStaff) {
        res = await api.updateStaffMember(editingStaff.id, formData, token);
      } else {
        res = await api.addStaffMember(formData, token);
      }

      if (res.success) {
        setSuccess(editingStaff ? 'Staff member updated successfully.' : 'Staff member invited and authorized successfully.');
        setIsModalOpen(false);
        await loadStaff();
        setTimeout(() => setSuccess(''), 4000);
      } else {
        setError(res.message || 'Operation failed. Please try again.');
      }
    } catch (err) {
      setError('Network error updating staff record.');
    }
  };

  const handleToggleStatus = async (staff) => {
    setError('');
    const res = await api.toggleStaffStatus(staff.id, staff.email, staff.status, token);
    if (res.success) {
      await loadStaff();
    } else {
      setError(res.message || 'Unable to update status.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingStaff) return;
    setError('');
    const res = await api.removeStaffMember(deletingStaff.id, deletingStaff.email, token);
    if (res.success) {
      setDeletingStaff(null);
      await loadStaff();
      setSuccess('Staff member removed successfully.');
      setTimeout(() => setSuccess(''), 4000);
    } else {
      setError(res.message || 'Unable to remove staff member.');
      setDeletingStaff(null);
    }
  };

  const categories = Array.from(new Set(AVAILABLE_PERMISSIONS.map(p => p.category)));

  return (
    <div className="staff-management-container">
      {/* Alerts */}
      {success && (
        <div className="staff-alert success">
          <CheckCircle size={16} />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="staff-alert error">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Super Admin Primary Privilege Card */}
      <div className="super-admin-card">
        <div className="super-admin-info">
          <div className="super-admin-avatar">
            <ShieldCheck size={26} className="gold-accent" />
          </div>
          <div>
            <div className="super-admin-tag">DESIGNATED ROOT SUPER ADMINISTRATOR</div>
            <div className="super-admin-name">M Hamdan (Project Owner)</div>
            <div className="super-admin-email">entermh07@gmail.com</div>
          </div>
        </div>
        <div className="super-admin-privilege">
          <span className="privilege-pill">FULL ROOT PRIVILEGE • UNRESTRICTED</span>
        </div>
      </div>

      {/* Staff Members List Card */}
      <div className="staff-table-section">
        <div className="staff-section-header">
          <div className="table-header-title">
            <Users size={20} className="gold-accent" />
            <div>
              <h3 className="section-title">Authorized Staff Directory ({staffMembers.length})</h3>
              <p className="section-subtext">Manage authorized personnel, role assignments, and active account status.</p>
            </div>
          </div>

          {(isSuperAdmin || hasPermission(PERMISSIONS.STAFF_CREATE)) && (
            <button onClick={handleOpenAddModal} className="add-staff-btn">
              <UserPlus size={15} />
              <span>+ ADD STAFF MEMBER</span>
            </button>
          )}
        </div>

        {loading ? (
          <div className="staff-empty-state">
            <div className="loading-spinner"></div>
            <p>Loading authorized staff directory...</p>
          </div>
        ) : staffMembers.length === 0 ? (
          <div className="staff-empty-state">
            <Users size={40} className="empty-icon" />
            <h4>No additional staff members have been added.</h4>
            <p>You can grant operational access to atelier managers, customer care, and inventory staff below.</p>
            {(isSuperAdmin || hasPermission(PERMISSIONS.STAFF_CREATE)) && (
              <button onClick={handleOpenAddModal} className="add-staff-pill-btn">
                <UserPlus size={15} />
                <span>+ ADD FIRST STAFF MEMBER</span>
              </button>
            )}
          </div>
        ) : (
          <div className="staff-table-responsive">
            <table className="staff-table">
              <thead>
                <tr>
                  <th>Staff Member</th>
                  <th>Role Tier</th>
                  <th>Status</th>
                  <th>Module Access</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {staffMembers.map(staff => (
                  <tr key={staff.id}>
                    <td>
                      <div className="staff-user-cell">
                        <div className="staff-user-avatar">
                          {staff.display_name?.charAt(0)?.toUpperCase() || 'S'}
                        </div>
                        <div>
                          <div className="staff-user-name">{staff.display_name}</div>
                          <div className="staff-user-email">{staff.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`role-badge ${staff.role?.toLowerCase()}`}>
                        {staff.role}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${staff.status}`}>
                        {staff.status === 'active' ? (
                          <>
                            <CheckCircle size={12} /> Active
                          </>
                        ) : (
                          <>
                            <XCircle size={12} /> Inactive
                          </>
                        )}
                      </span>
                    </td>
                    <td>
                      <div className="permissions-pill-summary">
                        {staff.role === 'ADMIN' ? (
                          <span className="perm-tag all">All Operational Modules</span>
                        ) : staff.permissions?.length > 0 ? (
                          <span className="perm-tag">{staff.permissions.length} Modules Granted</span>
                        ) : (
                          <span className="perm-tag none">No Permissions</span>
                        )}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="staff-action-buttons">
                        {(isSuperAdmin || hasPermission(PERMISSIONS.STAFF_EDIT)) && (
                          <button
                            onClick={() => handleOpenEditModal(staff)}
                            className="staff-icon-btn edit"
                            title="Edit Permissions"
                          >
                            <Edit2 size={14} />
                          </button>
                        )}

                        {(isSuperAdmin || hasPermission(PERMISSIONS.STAFF_DISABLE)) && (
                          <button
                            onClick={() => handleToggleStatus(staff)}
                            className={`staff-icon-btn toggle ${staff.status}`}
                            title={staff.status === 'active' ? 'Disable Access' : 'Activate Access'}
                          >
                            <Power size={14} />
                          </button>
                        )}

                        {(isSuperAdmin || hasPermission(PERMISSIONS.STAFF_DELETE)) && (
                          <button
                            onClick={() => setDeletingStaff(staff)}
                            className="staff-icon-btn delete"
                            title="Remove Staff Access"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dynamic Permission Matrix Table */}
      <div className="permission-matrix-section">
        <div className="table-header-title" style={{ marginBottom: '16px' }}>
          <FileCheck size={20} className="gold-accent" />
          <div>
            <h3 className="section-title">Live Role &amp; Permission Matrix</h3>
            <p className="section-subtext">Real-time module access breakdown across administrative roles and personnel.</p>
          </div>
        </div>

        <div className="matrix-table-responsive">
          <table className="matrix-table">
            <thead>
              <tr>
                <th>Module / Permission Name</th>
                <th style={{ textAlign: 'center' }}>SUPER ADMIN</th>
                <th style={{ textAlign: 'center' }}>ADMIN</th>
                {staffMembers.map(s => (
                  <th key={s.id} style={{ textAlign: 'center' }}>{s.display_name?.split(' ')[0]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {AVAILABLE_PERMISSIONS.map(perm => (
                <tr key={perm.id}>
                  <td>
                    <div className="perm-matrix-label">
                      <span className="perm-name">{perm.label}</span>
                      <span className="perm-code">{perm.id}</span>
                    </div>
                  </td>
                  <td className="matrix-check active"><Check size={16} /></td>
                  <td className="matrix-check active">
                    {perm.category !== 'Administration' && perm.id !== PERMISSIONS.SECURITY_MANAGE ? <Check size={16} /> : <span className="dash">-</span>}
                  </td>
                  {staffMembers.map(s => {
                    const isGranted = s.role === 'ADMIN'
                      ? (perm.category !== 'Administration' && perm.id !== PERMISSIONS.SECURITY_MANAGE)
                      : s.permissions?.includes(perm.id);
                    return (
                      <td key={s.id} className={`matrix-check ${isGranted ? 'active' : ''}`}>
                        {isGranted ? <Check size={16} /> : <span className="dash">-</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Staff Modal */}
      {isModalOpen && (
        <div className="staff-modal-overlay">
          <div className="staff-modal-card">
            <div className="staff-modal-header">
              <div className="modal-header-icon">
                <UserPlus size={20} className="gold-accent" />
              </div>
              <div>
                <h3>{editingStaff ? 'Edit Staff Authorization' : 'Authorize New Staff Member'}</h3>
                <p>Assign role level and select granular operational permissions.</p>
              </div>
            </div>

            <form onSubmit={handleFormSubmit} className="staff-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Atelier Manager"
                    value={formData.displayName}
                    onChange={e => setFormData({ ...formData, displayName: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Staff Email *</label>
                  <input
                    type="email"
                    placeholder="staff@aydara.com"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    disabled={Boolean(editingStaff)}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group" style={{ width: '100%' }}>
                  <label>
                    {editingStaff ? 'Reset Account Password (leave blank to keep unchanged)' : 'Account Password * (Min. 6 characters)'}
                  </label>
                  <input
                    type="password"
                    placeholder={editingStaff ? 'Enter new password to reset' : 'Create secure staff password'}
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    minLength={6}
                    required={!editingStaff}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Role Tier</label>
                  <select
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                  >
                    <option value="STAFF">STAFF (Restricted to assigned permissions)</option>
                    <option value="ADMIN">ADMIN (Full operational manager)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Account Status</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="active">Active (Permitted to log in)</option>
                    <option value="inactive">Inactive (Access suspended)</option>
                  </select>
                </div>
              </div>

              {formData.role === 'STAFF' && (
                <div className="permissions-selector-section">
                  <div className="perm-selector-head">
                    <label>Module Access Permissions</label>
                    <span className="selected-counter">{formData.permissions.length} Selected</span>
                  </div>

                  <div className="categories-permissions-grid">
                    {categories.map(cat => {
                      const catPerms = AVAILABLE_PERMISSIONS.filter(p => p.category === cat);
                      const allCatSelected = catPerms.every(p => formData.permissions.includes(p.id));

                      return (
                        <div key={cat} className="permission-category-block">
                          <div className="category-block-header">
                            <span className="category-title">{cat}</span>
                            <button
                              type="button"
                              onClick={() => handleSelectAllCategory(cat)}
                              className="select-all-btn"
                            >
                              {allCatSelected ? 'Deselect All' : 'Select All'}
                            </button>
                          </div>

                          <div className="permissions-checklist">
                            {catPerms.map(perm => (
                              <label key={perm.id} className="permission-checkbox-label">
                                <input
                                  type="checkbox"
                                  checked={formData.permissions.includes(perm.id)}
                                  onChange={() => handlePermissionToggle(perm.id)}
                                />
                                <span className="checkbox-text">{perm.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="modal-cancel-btn"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="modal-submit-btn"
                >
                  {editingStaff ? 'SAVE CHANGES' : 'AUTHORIZE STAFF MEMBER'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingStaff && (
        <div className="staff-modal-overlay">
          <div className="staff-modal-card confirm-delete">
            <div className="delete-modal-head">
              <AlertTriangle size={32} className="warning-icon" />
              <h3>Remove Staff Member Access?</h3>
              <p>
                Are you sure you want to revoke all administrative access for <strong>{deletingStaff.display_name}</strong> ({deletingStaff.email})?
              </p>
            </div>

            <div className="delete-modal-actions">
              <button
                onClick={() => setDeletingStaff(null)}
                className="modal-cancel-btn"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="modal-danger-btn"
              >
                CONFIRM REMOVAL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
