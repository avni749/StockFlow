import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiFetch } from '../../api/apiClient';
import { UserPlus, ArrowLeft, ShieldAlert } from 'lucide-react';

export default function StaffCreate() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await apiFetch('/business/staff', {
        method: 'POST',
        body: JSON.stringify({ name, email, password })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create staff account');

      navigate('/settings');
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '640px' }}>
      <div>
        <Link
          to="/settings"
          className="back-link"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--text-secondary)',
            fontSize: '13px',
            textDecoration: 'none',
            fontWeight: '500',
            marginBottom: '12px'
          }}
        >
          <ArrowLeft size={14} /> Back to Workspace Settings
        </Link>
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <UserPlus size={22} style={{ color: 'var(--accent-primary)' }} /> Add Staff Member
        </h1>
        <p className="body-text" style={{ marginTop: '2px' }}>
          Provision credentials for an operator to process inventory and catalog workflows.
        </p>
      </div>

      <div className="card" style={{ padding: '28px' }}>
        {error && (
          <div
            role="alert"
            style={{
              backgroundColor: 'var(--danger-bg)',
              border: '1px solid var(--danger-border)',
              padding: '12px 16px',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--danger)',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '20px'
            }}
          >
            <ShieldAlert size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="form-group">
            <label htmlFor="staff-name" className="form-label">
              Full Name <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <input
              id="staff-name"
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="form-control"
              placeholder="e.g. Alex Morgan"
            />
          </div>

          <div className="form-group">
            <label htmlFor="staff-email" className="form-label">
              Work Email <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <input
              id="staff-email"
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="form-control"
              placeholder="alex@company.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="staff-password" className="form-label">
              Initial Password <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <input
              id="staff-password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="form-control"
              placeholder="Minimum 6 characters"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
            <Link to="/settings" className="btn btn-secondary">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
            >
              {submitting ? 'Creating Account...' : 'Add Staff Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
