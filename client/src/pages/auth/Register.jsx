import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../api/apiClient';
import { Package, ShieldAlert, CheckCircle2, ArrowRight } from 'lucide-react';
import ThemeToggle from '../../components/ui/ThemeToggle';

export default function Register() {
  const [formData, setFormData] = useState({
    businessName: '',
    slug: '',
    name: '',
    email: '',
    password: ''
  });
  const [loadingState, setLoadingState] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { user } = useAuth();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoadingState(true);

    try {
      const res = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      if (!res.ok) throw res;
      
      setSuccess('Business workspace provisioned successfully. You can now sign in.');
      setFormData({ businessName: '', slug: '', name: '', email: '', password: '' });
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoadingState(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', backgroundColor: 'var(--bg-primary)', position: 'relative' }}>
      
      {/* Top right theme toggle */}
      <div style={{ position: 'absolute', top: '20px', right: '20px' }}>
        <ThemeToggle />
      </div>

      {/* Brand Header */}
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', marginBottom: '24px' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '6px', backgroundColor: 'var(--copper-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--on-copper)' }}>
          <Package size={18} strokeWidth={2.5} />
        </div>
        <span style={{ fontSize: '20px', fontWeight: '700', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
          StockFlow
        </span>
      </Link>
      
      <div className="card" style={{ width: '100%', maxWidth: '480px', padding: '28px 24px' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h1 style={{ fontSize: '18px', fontWeight: '700', letterSpacing: '-0.02em', color: 'var(--text-primary)', marginBottom: '4px' }}>
            Create your business workspace
          </h1>
          <p className="text-xs">Set up an isolated instance and admin credentials.</p>
        </div>

        {error && (
          <div style={{ backgroundColor: 'var(--danger-bg)', border: '1px solid var(--danger-border)', padding: '10px 12px', borderRadius: '5px', color: 'var(--danger)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}>
            <ShieldAlert size={14} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div style={{ backgroundColor: 'var(--success-bg)', border: '1px solid var(--success-border)', padding: '10px 12px', borderRadius: '5px', color: 'var(--success)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}>
            <CheckCircle2 size={14} />
            <span>{success}</span>
          </div>
        )}
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }} className="register-grid">
            
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Business Name</label>
              <input 
                type="text" 
                name="businessName"
                className="form-control"
                value={formData.businessName} 
                onChange={handleChange} 
                required 
                placeholder="Acme Supply Ltd."
              />
            </div>
            
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Workspace Slug</label>
              <input 
                type="text" 
                name="slug"
                className="form-control td-mono"
                value={formData.slug} 
                onChange={handleChange} 
                required 
                placeholder="acme-supply"
              />
              <span className="text-xs" style={{ marginTop: '2px' }}>
                Unique tenant identifier (letters, numbers, hyphens).
              </span>
            </div>
            
            <div className="form-group">
              <label className="form-label">Admin Name</label>
              <input 
                type="text" 
                name="name"
                className="form-control"
                value={formData.name} 
                onChange={handleChange} 
                required 
                placeholder="Jane Doe"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Work Email</label>
              <input 
                type="email" 
                name="email"
                className="form-control td-mono"
                value={formData.email} 
                onChange={handleChange} 
                required 
                placeholder="jane@acme.com"
              />
            </div>
            
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Password</label>
              <input 
                type="password" 
                name="password"
                className="form-control"
                value={formData.password} 
                onChange={handleChange} 
                required 
                placeholder="At least 6 characters"
                minLength={6}
              />
            </div>

          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={loadingState}
            style={{ width: '100%', height: '36px', marginTop: '6px' }}
          >
            {loadingState ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '14px', height: '14px', border: '2px solid #0B161B', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                Provisioning...
              </span>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                Create Workspace <ArrowRight size={14} />
              </span>
            )}
          </button>
        </form>
        
        <div style={{ textAlign: 'center', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)', fontSize: '12px', color: 'var(--text-secondary)' }}>
          <span>Already registered? </span>
          <Link to="/login" style={{ color: 'var(--accent-primary)', fontWeight: '500', textDecoration: 'none' }}>
            Sign In
          </Link>
        </div>

      </div>

      <style>{`
        @media (max-width: 520px) {
          .register-grid {
            grid-template-columns: 1fr !important;
          }
          .register-grid > div {
            grid-column: span 1 !important;
          }
        }
      `}</style>

    </div>
  );
}
