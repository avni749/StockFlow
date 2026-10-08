import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiFetch } from '../../api/apiClient';
import {
  ArrowLeft,
  Activity,
  Layers,
  Clock,
  Calendar,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  RotateCcw
} from 'lucide-react';

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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '780px' }}>
        <div style={{ width: '120px', height: '24px' }} className="skeleton" />
        <div style={{ width: '280px', height: '36px' }} className="skeleton" />
        <div style={{ height: '280px' }} className="card skeleton" />
      </div>
    );
  }

  if (error || !movement) {
    return (
      <div className="card state-container" style={{ margin: '40px auto', maxWidth: '500px' }}>
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

  const getMovementBadge = (type) => {
    switch (type) {
      case 'PURCHASE_RECEIVED':
        return <span className="badge badge-success"><ArrowDownLeft size={11} /> Stock In (Purchase)</span>;
      case 'ORDER_RESERVED':
        return <span className="badge badge-warning"><Clock size={11} /> Stock Reserved</span>;
      case 'ORDER_RELEASED':
        return <span className="badge badge-info"><RotateCcw size={11} /> Reservation Released</span>;
      case 'ORDER_SHIPPED':
        return <span className="badge badge-neutral"><ArrowUpRight size={11} /> Order Shipped</span>;
      default:
        return <span className="badge badge-neutral">{type}</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px' }}>
      <div>
        <Link to="/inventory-movements" className="text-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
          <ArrowLeft size={14} /> Back to Movement History
        </Link>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 className="page-title">Event #{String(movement.id || movement._id).slice(-6).toUpperCase()}</h1>
            {getMovementBadge(movement.type)}
          </div>
          <div className="text-xs" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
            <Calendar size={13} color="var(--text-muted)" />
            <span>Logged on {new Date(movement.createdAt).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Movement Specification Card */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="card-header" style={{ marginBottom: 0, paddingBottom: '10px', borderBottom: '1px solid var(--border-color)' }}>
          <h3 className="card-title">Movement Audit Log Record</h3>
          <Activity size={16} color="var(--accent-primary)" />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="flex-between">
            <span className="text-sm">Classification</span>
            <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{movement.type}</span>
          </div>

          <div className="flex-between">
            <span className="text-sm">Target Product Reference</span>
            <Link to={`/products/${movement.productId}`} style={{ color: 'var(--accent-primary)', fontWeight: '600' }} className="mono text-sm">
              PROD-{String(movement.productId).slice(-6).toUpperCase()}
            </Link>
          </div>

          <div className="flex-between">
            <span className="text-sm">Stock Quantity Shift</span>
            <span className="mono" style={{ fontSize: '18px', fontWeight: '700', color: movement.type === 'PURCHASE_RECEIVED' ? 'var(--success)' : 'var(--text-primary)' }}>
              {movement.type === 'PURCHASE_RECEIVED' ? '+' : ''}{movement.quantity} units
            </span>
          </div>

          <div className="flex-between">
            <span className="text-sm">Business Reference / Trigger</span>
            <span className="mono text-xs" style={{ color: 'var(--text-secondary)' }}>
              {movement.reference || 'SYSTEM_INTERNAL'}
            </span>
          </div>

          <div className="flex-between">
            <span className="text-sm">Ledger Hash ID</span>
            <span className="mono text-xs" style={{ color: 'var(--text-muted)' }}>
              {movement.id || movement._id}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
