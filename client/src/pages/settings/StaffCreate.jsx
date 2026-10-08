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
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '12px' }}
        >
          <ArrowLeft size={14} /> Back to Workspace Settings
        </Link>
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <UserPlus size={24} style={{ color: 'var(--accent-primary)' }} /> Provision Staff Account
        </h1>
        <p className="body-text" style={{ marginTop: '4px' }}>
          Create credentials for a team member to perform inventory updates and warehouse operations.
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
              placeholder="e.g. Marcus Vance"
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
              placeholder="marcus@warehouse.acme.com"
            />
            <span className="text-xs" style={{ marginTop: '4px' }}>
              The email will serve as the operator's primary login credential.
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">Initial Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              className="form-control"
              required
              placeholder="Minimum 6 characters"
              minLength={6}
            />
            <span className="text-xs" style={{ marginTop: '4px' }}>
              Provide this temporary password to the staff member for initial login.
            </span>
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
              {submitting ? 'Provisioning Account...' : 'Provision Staff Account'}
            </button>
          </div>
          
        </form>
      </div>
    </div>
  );
}
