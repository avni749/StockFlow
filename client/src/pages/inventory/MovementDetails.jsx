import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiFetch } from '../../api/apiClient';
import {
  ArrowLeft,
  Activity,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import Badge from '../../components/ui/Badge';

export default function MovementDetails() {
  const { movementId } = useParams();
  const [movement, setMovement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMovement = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await apiFetch(`/business/inventory-movements/${movementId}`);
        if (!res.ok) {
          if (res.status === 404) throw new Error('Inventory movement event not found.');
          throw new Error('Failed to load inventory movement details.');
        }
        const data = await res.json();
        setMovement(data.inventoryMovement);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMovement();
  }, [movementId]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '680px' }}>
        <div style={{ width: '140px', height: '24px' }} className="skeleton" />
        <div style={{ width: '260px', height: '36px' }} className="skeleton" />
        <div style={{ height: '280px' }} className="card skeleton" />
      </div>
    );
  }

  if (error || !movement) {
    return (
      <div className="card state-container" style={{ margin: '40px auto', maxWidth: '480px' }}>
        <div className="state-icon" style={{ color: 'var(--danger)', backgroundColor: 'var(--danger-bg)' }}>
          <AlertTriangle size={24} />
        </div>
        <div className="state-title">Movement Audit Error</div>
        <div className="state-description">{error || 'Event could not be retrieved.'}</div>
        <Link to="/inventory-movements" className="btn btn-secondary btn-sm" style={{ marginTop: '8px' }}>
          <ArrowLeft size={14} /> Back to History
        </Link>
      </div>
    );
  }

  const mId = movement.id || movement._id;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '680px' }}>
      <div>
        <Link
          to="/inventory-movements"
          className="back-link"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--text-secondary)',
            fontSize: '13px',
            textDecoration: 'none',
            fontWeight: '500'
          }}
        >
          <ArrowLeft size={14} /> Back to Stock Movements
        </Link>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 className="page-title">Event #{String(mId).slice(-6).toUpperCase()}</h1>
            <Badge status={movement.type} />
          </div>
          <div className="text-xs" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', color: 'var(--text-muted)' }}>
            <Calendar size={13} />
            <span className="mono">Logged on {new Date(movement.createdAt).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Receipt-style Card */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '24px' }}>
        <div className="card-header" style={{ marginBottom: 0, paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
          <h3 className="card-title" style={{ fontSize: '14px', textTransform: 'none', color: 'var(--text-primary)' }}>
            Audit Record Voucher
          </h3>
          <Activity size={16} color="var(--accent-primary)" />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="flex-between">
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Event Type</span>
            <Badge status={movement.type} />
          </div>

          <div className="flex-between">
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Product Identifier</span>
            <Link
              to={`/products/${movement.productId}`}
              style={{ color: 'var(--text-secondary)', fontWeight: '500', textDecoration: 'none' }}
              className="mono text-sm"
            >
              PROD-{String(movement.productId).slice(-6).toUpperCase()}
            </Link>
          </div>

          <div className="flex-between">
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Movement Quantity</span>
            <span className="td-mono" style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>
              {movement.quantity} units
            </span>
          </div>

          <div className="flex-between">
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Reference ID</span>
            <span className="mono text-xs" style={{ color: movement.reference ? 'var(--text-primary)' : 'var(--text-muted)' }}>
              {movement.reference || 'SYSTEM_INTERNAL'}
            </span>
          </div>

          <div className="flex-between">
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Ledger Event ID</span>
            <span className="mono text-xs" style={{ color: 'var(--text-muted)' }}>
              {mId}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
