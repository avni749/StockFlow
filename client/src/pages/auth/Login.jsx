import { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Package, ShieldAlert, ArrowRight } from 'lucide-react';
import ThemeToggle from '../../components/ui/ThemeToggle';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loadingState, setLoadingState] = useState(false);
  const [error, setError] = useState('');
  
  const { login, user } = useAuth();
  const navigate = useNavigate();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoadingState(true);

    const result = await login(email, password);
    if (result.success) {
      navigate('/dashboard', { replace: true });
    } else {
      setError(result.message);
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
      
      <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '28px 24px' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h1 style={{ fontSize: '18px', fontWeight: '700', letterSpacing: '-0.02em', color: 'var(--text-primary)', marginBottom: '4px' }}>
            Sign in to your workspace
          </h1>
          <p className="text-xs">Access your real-time inventory management console.</p>
        </div>

        {error && (
          <div style={{ backgroundColor: 'var(--danger-bg)', border: '1px solid var(--danger-border)', padding: '10px 12px', borderRadius: '5px', color: 'var(--danger)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}>
            <ShieldAlert size={14} />
            <span>{error}</span>
          </div>
        )}
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input 
              type="email" 
              className="form-control td-mono"
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              placeholder="operator@company.com"
              autoComplete="email"
            />
          </div>
          
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label">Password</label>
            </div>
            <input 
              type="password" 
              className="form-control"
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              placeholder="••••••••••••"
              autoComplete="current-password"
            />
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
                Authenticating...
              </span>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                Sign In <ArrowRight size={14} />
              </span>
            )}
          </button>
        </form>
        
        <div style={{ textAlign: 'center', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)', fontSize: '12px', color: 'var(--text-secondary)' }}>
          <span>Need a new organization instance? </span>
          <Link to="/register" style={{ color: 'var(--accent-primary)', fontWeight: '500', textDecoration: 'none' }}>
            Create Workspace
          </Link>
        </div>

      </div>

      <div style={{ marginTop: '20px', fontSize: '11.5px', color: 'var(--text-muted)' }}>
        Encrypted at rest &bull; Multi-tenant tenant isolation
      </div>

    </div>
  );
}
