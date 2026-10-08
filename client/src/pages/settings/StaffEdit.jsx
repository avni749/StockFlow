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
      <div className="state-container" style={{ padding: '64px 24px' }}>
        <div style={{ width: '32px', height: '32px', border: '3px solid var(--border-color)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <p className="text-sm" style={{ marginTop: '8px' }}>Loading staff account...</p>
      </div>
    );
  }

  if (error && !name) {
    return (
      <div style={{ maxWidth: '640px' }}>
        <div style={{ backgroundColor: 'var(--danger-bg)', border: '1px solid var(--danger-border)', padding: '20px', borderRadius: '8px', color: 'var(--danger)' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={18} /> Record Error
          </h2>
          <p className="text-sm">{error}</p>
          <Link to="/settings" className="btn btn-secondary btn-sm" style={{ marginTop: '16px' }}>
            <ArrowLeft size={14} /> Back to Settings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '640px' }}>
      
      <div>
        <Link 
          to="/settings" 
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '12px' }}
        >
          <ArrowLeft size={14} /> Back to Workspace Settings
        </Link>
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <UserCog size={24} style={{ color: 'var(--accent-primary)' }} /> Edit Staff Member
        </h1>
        <p className="body-text" style={{ marginTop: '4px' }}>
          Update name or email address for this operator account.
        </p>
      </div>

      <div className="card" style={{ padding: '28px' }}>
        {error && (
          <div style={{ backgroundColor: 'var(--danger-bg)', border: '1px solid var(--danger-border)', padding: '12px 16px', borderRadius: '6px', color: 'var(--danger)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <ShieldAlert size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)}
              className="form-control"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)}
              className="form-control td-mono"
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid var(--border-color)', marginTop: '8px' }}>
            <Link 
              to="/settings"
              className="btn btn-secondary"
            >
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
