import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../../api/apiClient';
import {
  ShoppingCart,
  Plus,
  Search,
  RefreshCw,
  AlertTriangle,
  Eye,
  Calendar
} from 'lucide-react';
import Badge from '../../components/ui/Badge';

export default function PurchaseList() {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await apiFetch('/business/purchases');
      if (!res.ok) throw new Error('Failed to retrieve purchase orders');
      const data = await res.json();
      
      const sorted = (data.purchases || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setPurchases(sorted);
    } catch (err) {
      setError(err.message || 'Could not load purchases. Please check connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, []);

  const filteredPurchases = useMemo(() => {
    return purchases.filter(p => {
      const pId = (p.id || p._id || '').toLowerCase();
      const supId = (p.supplierId || '').toLowerCase();
      const sTerm = searchTerm.toLowerCase();

      const matchesSearch = !searchTerm || pId.includes(sTerm) || supId.includes(sTerm);
      const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [purchases, searchTerm, statusFilter]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ width: '220px', height: '32px' }} className="skeleton" />
          <div style={{ width: '160px', height: '32px' }} className="skeleton" />
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
        <div className="state-title">Purchases Error</div>
        <div className="state-description">{error}</div>
        <button onClick={fetchPurchases} className="btn btn-primary btn-sm" style={{ marginTop: '8px' }}>
          <RefreshCw size={13} /> Try again
        </button>
      </div>
    );
  }

  const pendingCount = purchases.filter(p => p.status === 'PENDING').length;
  const receivedCount = purchases.filter(p => p.status === 'RECEIVED').length;

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
          <h1 className="page-title">Purchase Orders</h1>
          <p className="body-text" style={{ marginTop: '2px' }}>
            Supplier replenishment orders and incoming warehouse receipts.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={fetchPurchases} className="btn btn-secondary btn-sm" title="Refresh">
            <RefreshCw size={13} />
          </button>
          <Link to="/purchases/new" className="btn btn-primary btn-sm">
            <Plus size={13} /> Create Purchase Order
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar - Clean Toolbar */}
      <div className="card" style={{ padding: '12px 16px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', flex: 1 }}>
          <div className="search-box" style={{ minWidth: '240px', flex: 1, maxWidth: '380px' }}>
            <Search size={14} />
            <input
              type="text"
              placeholder="Search by PO reference or vendor ID..."
              className="form-control"
              style={{ height: '34px', fontSize: '12px' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ width: '160px' }}>
            <select
              className="form-control"
              style={{ height: '34px', fontSize: '12px' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses ({purchases.length})</option>
              <option value="PENDING">Pending Delivery ({pendingCount})</option>
              <option value="RECEIVED">Received into Stock ({receivedCount})</option>
            </select>
          </div>
        </div>

        <div className="text-xs" style={{ whiteSpace: 'nowrap' }}>
          Showing <strong style={{ color: 'var(--text-primary)' }}>{filteredPurchases.length}</strong> of {purchases.length} orders
        </div>
      </div>

      {/* Purchases Table Container */}
      <div className="table-container">
        {filteredPurchases.length === 0 ? (
          <div className="state-container" style={{ padding: '40px 20px' }}>
            <div className="state-icon" style={{ width: '40px', height: '40px' }}>
              <ShoppingCart size={20} />
            </div>
            <div className="state-title" style={{ fontSize: '13.5px' }}>
              {purchases.length === 0 ? 'No Purchase Orders Found' : 'No Matching Orders'}
            </div>
            <div className="state-description" style={{ fontSize: '12px' }}>
              {purchases.length === 0
                ? 'Issue your first supplier purchase order to re-stock warehouse quantities.'
                : 'No purchase orders match your current search and filter selections.'}
            </div>
            {purchases.length === 0 ? (
              <Link to="/purchases/new" className="btn btn-primary btn-sm" style={{ marginTop: '8px' }}>
                <Plus size={13} /> New Purchase Order
              </Link>
            ) : (
              <button
                onClick={() => { setSearchTerm(''); setStatusFilter('ALL'); }}
                className="btn btn-secondary btn-sm"
                style={{ marginTop: '8px' }}
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>PO Reference</th>
                  <th>Order Date</th>
                  <th>Vendor Identifier</th>
                  <th style={{ textAlign: 'center' }}>Lines</th>
                  <th style={{ textAlign: 'right' }}>Total Cost</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPurchases.map((p) => {
                  const itemCount = p.items ? p.items.length : 0;
                  const totalUnits = p.items ? p.items.reduce((acc, curr) => acc + (curr.quantity || 0), 0) : 0;

                  return (
                    <tr key={p.id || p._id}>
                      <td>
                        <Link
                          to={`/purchases/${p.id || p._id}`}
                          style={{ fontWeight: '500', color: 'var(--text-primary)' }}
                        >
                          <span className="mono">PO-{String(p.id || p._id).slice(-6).toUpperCase()}</span>
                        </Link>
                      </td>
                      <td>
                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '—'}
                        </span>
                      </td>
                      <td>
                        <span className="td-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
                          {p.supplierId ? `VND-${String(p.supplierId).slice(-6).toUpperCase()}` : '—'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="text-xs">
                          {itemCount} lines <span style={{ color: 'var(--text-muted)' }}>({totalUnits} units)</span>
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: '600' }} className="td-mono">
                        ${Number(p.totalCost || 0).toFixed(2)}
                      </td>
                      <td>
                        <Badge status={p.status} />
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Link
                          to={`/purchases/${p.id || p._id}`}
                          className="row-view-link"
                          title="View Order Details"
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
