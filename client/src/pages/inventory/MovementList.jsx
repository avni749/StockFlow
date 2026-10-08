import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../../api/apiClient';
import {
  Activity,
  Search,
  RefreshCw,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  Eye,
  Clock,
  RotateCcw
} from 'lucide-react';

export default function MovementList() {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const fetchMovements = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await apiFetch('/business/inventory-movements');
      if (!res.ok) throw new Error('Failed to load inventory movement audit trail');
      const data = await res.json();
      
      setMovements(data.inventoryMovements || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovements();
  }, []);

  const getMovementBadge = (type) => {
    switch (type) {
      case 'PURCHASE_RECEIVED':
        return (
          <span className="badge badge-success" style={{ gap: '4px' }}>
            <ArrowDownLeft size={11} /> INFLOW
          </span>
        );
      case 'ORDER_RESERVED':
        return (
          <span className="badge badge-warning" style={{ gap: '4px' }}>
            <Clock size={11} /> RESERVED
          </span>
        );
      case 'ORDER_RELEASED':
        return (
          <span className="badge badge-info" style={{ gap: '4px' }}>
            <RotateCcw size={11} /> RELEASED
          </span>
        );
      case 'ORDER_SHIPPED':
        return (
          <span className="badge badge-neutral" style={{ gap: '4px' }}>
            <ArrowUpRight size={11} /> SHIPPED
          </span>
        );
      default:
        return <span className="badge badge-neutral">{type}</span>;
    }
  };

  const filteredMovements = useMemo(() => {
    return movements.filter(m => {
      const prodId = (m.productId || '').toLowerCase();
      const ref = (m.reference || '').toLowerCase();
      const sTerm = searchTerm.toLowerCase();

      const matchesSearch = !searchTerm || prodId.includes(sTerm) || ref.includes(sTerm);
      const matchesType = typeFilter === 'ALL' || m.type === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [movements, searchTerm, typeFilter]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ width: '220px', height: '32px' }} className="skeleton" />
          <div style={{ width: '120px', height: '32px' }} className="skeleton" />
        </div>
        <div style={{ height: '48px' }} className="card skeleton" />
        <div style={{ height: '400px' }} className="card skeleton" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="card state-container" style={{ margin: '32px auto', maxWidth: '460px' }}>
        <div className="state-icon" style={{ color: 'var(--danger)', backgroundColor: 'var(--danger-bg)' }}>
          <AlertTriangle size={20} />
        </div>
        <div className="state-title">Audit Log Error</div>
        <div className="state-description">{error}</div>
        <button onClick={fetchMovements} className="btn btn-primary btn-sm" style={{ marginTop: '8px' }}>
          <RefreshCw size={13} /> Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <h1 className="page-title">Stock Movements Audit</h1>
          <p className="body-text" style={{ marginTop: '2px' }}>
            Immutable ledger tracking warehouse inflows, order reserves, and stock adjustments.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={fetchMovements} className="btn btn-secondary btn-sm" title="Refresh audit log">
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '12px 16px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', flex: 1 }}>
          <div className="search-box" style={{ minWidth: '240px', flex: 1, maxWidth: '380px' }}>
            <Search size={14} />
            <input
              type="text"
              placeholder="Filter by product reference or audit code..."
              className="form-control"
              style={{ height: '34px', fontSize: '12px' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ width: '180px' }}>
            <select
              className="form-control"
              style={{ height: '34px', fontSize: '12px' }}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="ALL">All Movement Types</option>
              <option value="PURCHASE_RECEIVED">Stock In (Purchase)</option>
              <option value="ORDER_RESERVED">Reserved (Pending Order)</option>
              <option value="ORDER_RELEASED">Released (Cancelled Order)</option>
              <option value="ORDER_SHIPPED">Shipped (Fulfilled Order)</option>
            </select>
          </div>
        </div>

        <div className="text-xs" style={{ whiteSpace: 'nowrap' }}>
          Showing <strong style={{ color: 'var(--text-primary)' }}>{filteredMovements.length}</strong> of {movements.length} logged events
        </div>
      </div>

      {/* Table Container */}
      <div className="table-container">
        {filteredMovements.length === 0 ? (
          <div className="state-container" style={{ padding: '40px 20px' }}>
            <div className="state-icon" style={{ width: '40px', height: '40px' }}>
              <Activity size={20} />
            </div>
            <div className="state-title" style={{ fontSize: '13.5px' }}>No Movements Recorded</div>
            <div className="state-description" style={{ fontSize: '12px' }}>
              {movements.length === 0
                ? 'When inventory is received via purchases or allocated for customer orders, immutable movement logs appear here.'
                : 'No movement logs match your current search and type filters.'}
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Movement Type</th>
                  <th>Product Identifier</th>
                  <th style={{ textAlign: 'right' }}>Quantity</th>
                  <th>Audit Reference</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMovements.map((m) => {
                  const qtyPrefix = m.type === 'PURCHASE_RECEIVED' || m.type === 'ORDER_RELEASED' ? '+' : '-';
                  const qtyColor = m.type === 'PURCHASE_RECEIVED' ? 'var(--success)' : m.type === 'ORDER_RESERVED' ? 'var(--warning)' : 'var(--text-primary)';

                  return (
                    <tr key={m.id || m._id}>
                      <td>
                        <span className="text-xs" style={{ color: 'var(--text-primary)', fontWeight: '500' }}>
                          {new Date(m.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span className="mono text-xs" style={{ color: 'var(--text-muted)', marginLeft: '6px' }}>
                          {new Date(m.createdAt).toLocaleTimeString()}
                        </span>
                      </td>
                      <td>
                        {getMovementBadge(m.type)}
                      </td>
                      <td>
                        <span className="td-mono text-xs" style={{ color: 'var(--accent-primary)' }}>
                          PROD-{String(m.productId || '').slice(-6).toUpperCase()}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }} className="td-mono">
                        <span style={{ fontWeight: '600', color: qtyColor }}>
                          {qtyPrefix}{Math.abs(m.quantity || 0)}
                        </span>
                      </td>
                      <td>
                        <span className="td-mono text-xs" style={{ color: m.reference ? 'var(--text-secondary)' : 'var(--text-muted)' }}>
                          {m.reference || 'SYSTEM_AUTO'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Link
                          to={`/inventory-movements/${m.id || m._id}`}
                          className="btn btn-secondary btn-sm"
                          style={{ height: '26px', padding: '0 8px', fontSize: '11px' }}
                          title="View Movement Details"
                        >
                          <Eye size={12} /> View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
