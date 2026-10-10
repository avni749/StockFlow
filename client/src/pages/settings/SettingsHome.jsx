import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../../api/apiClient';
import { useAuth } from '../../context/AuthContext';
import {
  User,
  Users,
  Building,
  LogOut,
  Plus,
  Edit3,
  ShieldAlert,
  RotateCcw,
  KeyRound,
  ChevronDown
} from 'lucide-react';
import Badge from '../../components/ui/Badge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

export default function SettingsHome() {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'BUSINESS_ADMIN';

  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(isAdmin);
  const [error, setError] = useState(null);
  const [actionInProgress, setActionInProgress] = useState(null);

  // Dialog States
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [suspendTarget, setSuspendTarget] = useState(null);

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

  const handleConfirmSuspend = async () => {
    if (!suspendTarget) return;
    const staffId = suspendTarget.id;
    try {
      setActionInProgress(staffId);
      const res = await apiFetch(`/business/staff/${staffId}/suspend`, { method: 'PATCH' });
      if (!res.ok) throw new Error('Failed to suspend staff member');
      await fetchStaff();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionInProgress(null);
      setSuspendTarget(null);
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
      
      {/* Header */}
      <div>
        <h1 className="page-title">Workspace Settings</h1>
        <p className="body-text" style={{ marginTop: '2px' }}>
          Operator credentials, access permissions, and system context.
        </p>
      </div>

      {/* SECTION 1: ACCOUNT & SECURITY */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        
        {/* Account Profile Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '24px' }}>
          <div className="card-header" style={{ marginBottom: 0, paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="kpi-icon-wrap" style={{ width: '32px', height: '32px' }}>
                <User size={16} />
              </div>
              <div>
                <h3 className="card-title" style={{ color: 'var(--text-primary)', textTransform: 'none', fontSize: '15px' }}>Operator Profile</h3>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Active session identity</span>
              </div>
            </div>
            <Badge status="ACTIVE" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="flex-between">
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Full Name</span>
              <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{user?.name || '—'}</span>
            </div>
            <div className="flex-between">
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Email Address</span>
              <span className="mono text-xs" style={{ color: 'var(--text-primary)' }}>{user?.email || '—'}</span>
            </div>
            <div className="flex-between">
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Assigned Role</span>
              <Badge status={user?.role || 'STAFF'} />
            </div>
          </div>
        </div>

        {/* Security & Active Session Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '24px' }}>
          <div className="card-header" style={{ marginBottom: 0, paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="kpi-icon-wrap" style={{ width: '32px', height: '32px' }}>
                <KeyRound size={16} />
              </div>
              <div>
                <h3 className="card-title" style={{ color: 'var(--text-primary)', textTransform: 'none', fontSize: '15px' }}>Security & Session</h3>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Token authentication</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p className="text-xs" style={{ color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              Your session is authenticated via tenant-scoped bearer tokens with encrypted headers. Terminating your session will revoke local access.
            </p>
          </div>

          <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="btn btn-outline btn-sm"
              style={{
                width: '100%',
                color: 'var(--danger)',
                borderColor: 'var(--danger-border)',
                fontWeight: '500'
              }}
            >
              <LogOut size={14} /> End Active Session
            </button>
          </div>
        </div>

      </div>

      {/* SECTION 2: TEAM & PERMISSIONS (BUSINESS_ADMIN only) */}
      {isAdmin && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 className="section-heading" style={{ fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={16} style={{ color: 'var(--accent-primary)' }} /> Team & Permissions
                </h2>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>({staffList.length} Accounts)</span>
              </div>
              <p className="text-xs" style={{ marginTop: '2px', color: 'var(--text-muted)' }}>
                Authorized team members for warehouse catalog and inventory operations
              </p>
            </div>
            <Link to="/settings/staff/new" className="btn btn-primary btn-sm">
              <Plus size={14} /> Add Staff Member
            </Link>
          </div>

          {error && (
            <div style={{ margin: '16px 24px', backgroundColor: 'var(--danger-bg)', border: '1px solid var(--danger-border)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={16} />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="state-container" style={{ padding: '40px 20px' }}>
              <div style={{ width: '28px', height: '28px', border: '3px solid var(--border-color)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
              <p className="text-sm" style={{ marginTop: '8px', color: 'var(--text-muted)' }}>Loading staff records...</p>
            </div>
          ) : staffList.length === 0 ? (
            <div className="state-container" style={{ padding: '40px 20px' }}>
              <div className="state-icon" style={{ width: '38px', height: '38px' }}>
                <Users size={18} />
              </div>
              <div className="state-title" style={{ fontSize: '13.5px' }}>No Staff Accounts Registered</div>
              <p className="text-xs" style={{ maxWidth: '380px', color: 'var(--text-muted)', marginTop: '4px' }}>
                You have not provisioned any staff accounts yet. Create team accounts to allow staff members to operate inventory.
              </p>
              <Link to="/settings/staff/new" className="btn btn-primary btn-sm" style={{ marginTop: '12px' }}>
                <Plus size={14} /> Add First Staff Member
              </Link>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Staff Member</th>
                    <th>Email Address</th>
                    <th>Role</th>
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
                          <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>
                            {staff.name}
                          </div>
                        </td>
                        <td>
                          <span className="mono text-xs" style={{ color: 'var(--text-secondary)' }}>
                            {staff.email}
                          </span>
                        </td>
                        <td>
                          <Badge status={staff.role || 'STAFF'} />
                        </td>
                        <td>
                          <Badge status={staff.status} />
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
                            <Link
                              to={`/settings/staff/${staff.id}/edit`}
                              className="quiet-view-link"
                              style={{
                                fontSize: '13px',
                                fontWeight: '500',
                                color: 'var(--text-secondary)',
                                textDecoration: 'none'
                              }}
                            >
                              Edit
                            </Link>

                            {isStaffActive ? (
                              <button
                                onClick={() => setSuspendTarget(staff)}
                                disabled={isBusy}
                                className="btn btn-outline btn-sm"
                                style={{
                                  padding: '0 8px',
                                  height: '26px',
                                  fontSize: '11.5px',
                                  color: 'var(--danger)',
                                  borderColor: 'var(--danger-border)'
                                }}
                              >
                                {isBusy ? 'Suspending...' : 'Suspend'}
                              </button>
                            ) : (
                              <button
                                onClick={() => handleReactivate(staff.id)}
                                disabled={isBusy}
                                className="btn btn-primary btn-sm"
                                style={{ padding: '0 8px', height: '26px', fontSize: '11.5px' }}
                              >
                                <RotateCcw size={11} /> {isBusy ? 'Activating...' : 'Reactivate'}
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

      {/* SECTION 3: SYSTEM INFORMATION (Collapsed Details Accordion) */}
      <details
        className="card"
        style={{
          padding: '16px 20px',
          cursor: 'pointer'
        }}
      >
        <summary
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontWeight: '600',
            fontSize: '13.5px',
            color: 'var(--text-primary)',
            userSelect: 'none'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building size={15} style={{ color: 'var(--text-muted)' }} />
            <span>System Information</span>
          </div>
          <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
        </summary>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-color)', cursor: 'default' }}>
          <div className="flex-between">
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Tenant Identifier</span>
            <span className="mono text-xs" style={{ color: 'var(--text-primary)' }}>{user?.tenantId || 'DEFAULT'}</span>
          </div>
          <div className="flex-between">
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Runtime Isolation</span>
            <Badge status="ACTIVE">STRICT MULTI-TENANT</Badge>
          </div>
          <div className="flex-between">
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Database Engine</span>
            <span className="mono text-xs" style={{ color: 'var(--text-secondary)' }}>MongoDB Atlas Enterprise</span>
          </div>
        </div>
      </details>

      {/* End Active Session ConfirmDialog */}
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        title="End Active Session?"
        description="End active session? You will be signed out from this session."
        confirmText="End Session"
        cancelText="Cancel"
        variant="danger"
        onConfirm={() => {
          setShowLogoutConfirm(false);
          logout();
        }}
        onClose={() => setShowLogoutConfirm(false)}
      />

      {/* Suspend Staff Member ConfirmDialog */}
      <ConfirmDialog
        isOpen={!!suspendTarget}
        title="Suspend Staff Member?"
        description={suspendTarget ? `Are you sure you want to suspend ${suspendTarget.name}? They will immediately lose access to StockFlow.` : ''}
        confirmText="Suspend Access"
        cancelText="Cancel"
        variant="danger"
        isLoading={actionInProgress === suspendTarget?.id}
        onConfirm={handleConfirmSuspend}
        onClose={() => setSuspendTarget(null)}
      />

    </div>
  );
}
