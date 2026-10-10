import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../../api/apiClient';
import {
  Activity,
  Search,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import Badge from '../../components/ui/Badge';
import ProductThumbnail from '../../components/ui/ProductThumbnail';

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

  const filteredMovements = useMemo(() => {
    return movements.filter(m => {
      const prodId = String(m.productId || '').toLowerCase();
      const ref = String(m.reference || '').toLowerCase();
      const sTerm = searchTerm.toLowerCase();

      const matchesSearch = !searchTerm || prodId.includes(sTerm) || ref.includes(sTerm);
      const matchesType = typeFilter === 'ALL' || m.type === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [movements, searchTerm, typeFilter]);

  if (loading && movements.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ width: '220px', height: '32px' }} className="skeleton" />
          <div style={{ width: '100px', height: '32px' }} className="skeleton" />
        </div>
        <div style={{ height: '48px' }} className="card skeleton" />
        <div style={{ height: '380px' }} className="card skeleton" />
      </div>
    );
  }

  if (error && movements.length === 0) {
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
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div>
          <h1 className="page-title">Stock Movements Audit</h1>
          <p className="body-text" style={{ marginTop: '2px' }}>
            Immutable ledger tracking warehouse inflows, allocations, orders, and adjustments.
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
              placeholder="Filter by product or reference ID..."
              className="form-control"
              style={{ height: '34px', fontSize: '13px' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ width: '200px' }}>
            <select
              className="form-control"
              style={{ height: '34px', fontSize: '13px' }}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="ALL">All Types</option>
              <option value="PURCHASE_RECEIVED">Stock In (Purchase)</option>
              <option value="ORDER_RESERVED">Reserved</option>
              <option value="ORDER_SOLD">Stock Out (Sold)</option>
              <option value="ORDER_RELEASED">Released</option>
            </select>
          </div>
        </div>

        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Showing <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{filteredMovements.length}</span> of {movements.length} events
        </div>
      </div>

      {/* Ledger Table Container */}
      <div className="table-container">
        {filteredMovements.length === 0 ? (
          <div className="state-container" style={{ padding: '36px 20px' }}>
            <div className="state-icon" style={{ width: '38px', height: '38px' }}>
              <Activity size={18} />
            </div>
            <div className="state-title" style={{ fontSize: '13.5px' }}>No Movements Recorded</div>
            <div className="state-description" style={{ fontSize: '12.5px' }}>
              {movements.length === 0
                ? 'When inventory is received via purchases or allocated for orders, immutable logs appear here.'
                : 'No movement logs match your active filters.'}
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Product</th>
                  <th>Type</th>
                  <th style={{ textAlign: 'right' }}>Quantity</th>
                  <th>Reference</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMovements.map((m) => {
                  const mId = m.id || m._id;
                  const prodLabel = `PROD-${String(m.productId || '').slice(-6).toUpperCase()}`;

                  return (
                    <tr key={mId}>
                      <td>
                        <span className="mono text-xs" style={{ color: 'var(--text-primary)', fontWeight: '500' }}>
                          {new Date(m.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span className="mono text-xs" style={{ color: 'var(--text-muted)', marginLeft: '6px' }}>
                          {new Date(m.createdAt).toLocaleTimeString()}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <ProductThumbnail
                            alt={prodLabel}
                            size="xs"
                          />
                          <Link
                            to={`/products/${m.productId}`}
                            className="mono text-xs"
                            style={{
                              color: 'var(--text-secondary)',
                              textDecoration: 'none',
                              fontWeight: '500'
                            }}
                          >
                            {prodLabel}
                          </Link>
                        </div>
                      </td>
                      <td>
                        <Badge status={m.type} />
                      </td>
                      <td style={{ textAlign: 'right' }} className="td-mono">
                        <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                          {m.quantity}
                        </span>
                      </td>
                      <td>
                        <span className="mono text-xs" style={{ color: m.reference ? 'var(--text-secondary)' : 'var(--text-muted)' }}>
                          {m.reference ? `#${String(m.reference).slice(-6).toUpperCase()}` : 'SYSTEM'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Link
                          to={`/inventory-movements/${mId}`}
                          className="quiet-view-link"
                          style={{
                            fontSize: '13px',
                            fontWeight: '500',
                            color: 'var(--text-secondary)',
                            textDecoration: 'none'
                          }}
                        >
                          View
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
