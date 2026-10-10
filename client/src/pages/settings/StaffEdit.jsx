import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { apiFetch } from '../../api/apiClient';
import { UserCog, ArrowLeft, ShieldAlert } from 'lucide-react';

export default function StaffEdit() {
  const { staffId } = useParams();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await apiFetch(`/business/staff/${staffId}`);
        if (!res.ok) {
          if (res.status === 404) throw new Error('Staff member not found');
          throw new Error('Failed to load staff details');
        }

        const data = await res.json();
        setName(data.staff.name || '');
        setEmail(data.staff.email || '');
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStaff();
  }, [staffId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await apiFetch(`/business/staff/${staffId}`, {
        method: 'PATCH',
        body: JSON.stringify({ name, email })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update staff account');

      navigate('/settings');
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '640px' }}>
        <div style={{ width: '140px', height: '24px' }} className="skeleton" />
        <div style={{ width: '240px', height: '36px' }} className="skeleton" />
        <div style={{ height: '240px' }} className="card skeleton" />
      </div>
    );
  }

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
          <UserCog size={22} style={{ color: 'var(--accent-primary)' }} /> Edit Staff Member
        </h1>
        <p className="body-text" style={{ marginTop: '2px' }}>
          Update profile details for this operator account.
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
            <label htmlFor="edit-staff-name" className="form-label">
              Full Name <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <input
              id="edit-staff-name"
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label htmlFor="edit-staff-email" className="form-label">
              Work Email <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <input
              id="edit-staff-email"
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="form-control"
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
              {submitting ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
