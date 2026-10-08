import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../../api/apiClient';
import { useAuth } from '../../context/AuthContext';
import { 
  User, 
  Users, 
  Building, 
  LogOut, 
  CheckCircle2, 
  XCircle, 
  Plus, 
  Edit3, 
  ShieldAlert,
  RotateCcw,
  KeyRound
} from 'lucide-react';

export default function SettingsHome() {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'BUSINESS_ADMIN';

  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(isAdmin);
  const [error, setError] = useState(null);
  const [actionInProgress, setActionInProgress] = useState(null);

  const fetchStaff = async () => {
    if (!isAdmin) return;
    try {
      setLoading(true);
      setError(null);
      const res = await apiFetch('/business/staff');
      if (!res.ok) throw new Error('Failed to load staff list');
      const data = await res.json();
      setStaffList(data.staff || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [isAdmin]);

  const handleSuspend = async (staffId) => {
    if (!window.confirm("Are you sure you want to suspend this staff member? They will lose access immediately.")) return;
    try {
      setActionInProgress(staffId);
      const res = await apiFetch(`/business/staff/${staffId}/suspend`, { method: 'PATCH' });
      if (!res.ok) throw new Error('Failed to suspend staff member');
      await fetchStaff();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleReactivate = async (staffId) => {
    try {
      setActionInProgress(staffId);
      const res = await apiFetch(`/business/staff/${staffId}/reactivate`, { method: 'PATCH' });
      if (!res.ok) throw new Error('Failed to reactivate staff member');
      await fetchStaff();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionInProgress(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '1080px' }}>
      
      {/* Page Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '13px', marginBottom: '6px' }}>
          <span>System</span>
          <span>/</span>
          <span style={{ color: 'var(--text-secondary)' }}>Settings & Team</span>
        </div>
        <h1 className="page-title">Workspace Settings</h1>
        <p className="body-text" style={{ marginTop: '4px' }}>
          Manage your operator credentials, organization parameters, and staff permissions.
        </p>
      </div>

      {/* Top 2 Cards: Profile & Organization Context */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        
        {/* Profile Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card-header" style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="kpi-icon-wrap" style={{ width: '32px', height: '32px' }}>
                <User size={16} />
              </div>
              <div>
                <h3 className="card-title" style={{ color: 'var(--text-primary)', textTransform: 'none', fontSize: '15px' }}>Operator Profile</h3>
                <span className="text-xs">Active session credentials</span>
              </div>
            </div>
            <span className="badge badge-success">ACTIVE</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px solid var(--border-subtle)' }}>
              <span className="text-sm">Full Name</span>
              <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{user?.name || '—'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px solid var(--border-subtle)' }}>
              <span className="text-sm">Email Address</span>
              <span className="td-mono" style={{ color: 'var(--text-primary)', fontSize: '12px' }}>{user?.email || '—'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px solid var(--border-subtle)' }}>
              <span className="text-sm">Assigned Role</span>
              <span className={`badge ${isAdmin ? 'badge-info' : 'badge-neutral'}`}>
                {user?.role ? user.role.replace('_', ' ') : 'USER'}
              </span>
            </div>
          </div>

          <div style={{ marginTop: 'auto', paddingTop: '12px' }}>
            <button 
              onClick={logout} 
              className="btn btn-outline btn-sm"
              style={{ width: '100%', color: 'var(--danger)', borderColor: 'var(--danger-border)' }}
            >
              <LogOut size={14} /> End Active Session
            </button>
          </div>
        </div>

        {/* Business/Tenant Context */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card-header" style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="kpi-icon-wrap" style={{ width: '32px', height: '32px' }}>
                <Building size={16} />
              </div>
              <div>
                <h3 className="card-title" style={{ color: 'var(--text-primary)', textTransform: 'none', fontSize: '15px' }}>Tenant Environment</h3>
                <span className="text-xs">Isolation & runtime context</span>
              </div>
            </div>
            <span className="badge badge-info">ENTERPRISE</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px solid var(--border-subtle)' }}>
              <span className="text-sm">Tenant Identifier</span>
              <span className="td-mono" style={{ color: 'var(--accent-primary)', fontSize: '12px' }}>{user?.tenantId || 'DEFAULT'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px solid var(--border-subtle)' }}>
              <span className="text-sm">Runtime Isolation</span>
              <span className="badge badge-success">STRICT MULTI-TENANT</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px solid var(--border-subtle)' }}>
              <span className="text-sm">Database Engine</span>
              <span className="td-mono text-xs" style={{ color: 'var(--text-secondary)' }}>MongoDB Atlas Enterprise</span>
            </div>
          </div>

          <div style={{ marginTop: 'auto', paddingTop: '12px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '12px' }}>
            <KeyRound size={14} style={{ color: 'var(--accent-primary)' }} />
            <span>Encrypted at rest with tenant-scoped query filters.</span>
          </div>
        </div>

      </div>

      {/* Staff Management - Visible to BUSINESS_ADMIN */}
      {isAdmin && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 className="section-heading" style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={18} style={{ color: 'var(--accent-primary)' }} /> Staff Directory & Access Control
                </h2>
                <span className="badge badge-neutral" style={{ fontSize: '11px' }}>{staffList.length} Accounts</span>
              </div>
              <p className="text-xs" style={{ marginTop: '4px' }}>
                Manage team members authorized to process inventory movements and catalog operations.
              </p>
            </div>
            <Link to="/settings/staff/new" className="btn btn-primary btn-sm">
              <Plus size={14} /> Add Staff Member
            </Link>
          </div>

          {error && (
            <div style={{ margin: '16px 24px', backgroundColor: 'var(--danger-bg)', border: '1px solid var(--danger-border)', padding: '12px 16px', borderRadius: '6px', color: 'var(--danger)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={16} />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="state-container" style={{ padding: '48px 24px' }}>
              <div style={{ width: '32px', height: '32px', border: '3px solid var(--border-color)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
              <p className="text-sm" style={{ marginTop: '8px' }}>Loading staff records...</p>
            </div>
          ) : staffList.length === 0 ? (
            <div className="state-container" style={{ padding: '48px 24px' }}>
              <div className="state-icon">
                <Users size={24} />
              </div>
              <h4 className="state-title">No Staff Accounts Registered</h4>
              <p className="text-sm" style={{ maxWidth: '380px' }}>
                You have not provisioned any staff accounts yet. Create staff members to allow your team to operate warehouse inventory.
              </p>
              <Link to="/settings/staff/new" className="btn btn-secondary btn-sm" style={{ marginTop: '8px' }}>
                <Plus size={14} /> Create First Staff Member
              </Link>
            </div>
          ) : (
            <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Staff Member</th>
                    <th>Email Address</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {staffList.map((staff) => {
                    const isStaffActive = staff.status === 'ACTIVE';
                    const isBusy = actionInProgress === staff.id;
                    return (
                      <tr key={staff.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--bg-surface-secondary)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '600', color: 'var(--accent-primary)' }}>
                              {staff.name ? staff.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{staff.name}</span>
                          </div>
                        </td>
                        <td>
                          <span className="td-mono text-xs" style={{ color: 'var(--text-secondary)' }}>{staff.email}</span>
                        </td>
                        <td>
                          <span className={`badge ${isStaffActive ? 'badge-success' : 'badge-danger'}`}>
                            {isStaffActive ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                            {staff.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                            <Link 
                              to={`/settings/staff/${staff.id}/edit`}
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '0 10px', height: '28px', fontSize: '12px' }}
                            >
                              <Edit3 size={12} /> Edit
                            </Link>

                            {isStaffActive ? (
                              <button 
                                onClick={() => handleSuspend(staff.id)}
                                disabled={isBusy}
                                className="btn btn-danger btn-sm"
                                style={{ padding: '0 10px', height: '28px', fontSize: '12px' }}
                              >
                                <XCircle size={12} /> {isBusy ? 'Suspending...' : 'Suspend'}
                              </button>
                            ) : (
                              <button 
                                onClick={() => handleReactivate(staff.id)}
                                disabled={isBusy}
                                className="btn btn-primary btn-sm"
                                style={{ padding: '0 10px', height: '28px', fontSize: '12px' }}
                              >
                                <RotateCcw size={12} /> {isBusy ? 'Reactivating...' : 'Reactivate'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
