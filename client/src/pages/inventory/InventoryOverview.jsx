import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiFetch } from '../../api/apiClient';
import {
  Layers,
  Package,
  ShoppingCart,
  Activity,
  Search,
  AlertTriangle,
  RefreshCw,
  Eye,
  CheckCircle2,
  Clock,
  Boxes
} from 'lucide-react';
import ProductThumbnail from '../../components/ui/ProductThumbnail';
import Badge from '../../components/ui/Badge';

export default function InventoryOverview() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatusParam = searchParams.get('status') || 'ALL';

  const [overview, setOverview] = useState(null);
  const [inventoryStates, setInventoryStates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [stockStatusFilter, setStockStatusFilter] = useState(initialStatusParam);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [overviewRes, invRes] = await Promise.all([
        apiFetch('/business/insights/stock-overview'),
        apiFetch('/business/inventory')
      ]);

      if (!overviewRes.ok || !invRes.ok) {
        throw new Error('Failed to load inventory management datasets');
      }

      setOverview(await overviewRes.json());
      const invData = await invRes.json();
      setInventoryStates(invData.inventory || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Sync state if query parameter changes
  useEffect(() => {
    const status = searchParams.get('status');
    if (status) {
      setStockStatusFilter(status);
    }
  }, [searchParams]);

  // Filtered inventory rows
  const filteredInventory = useMemo(() => {
    return inventoryStates.filter(item => {
      const p = item.product || {};
      const matchesSearch = !searchTerm ||
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.SKU?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category?.toLowerCase().includes(searchTerm.toLowerCase());

      const available = item.available || 0;
      const threshold = p.lowStockThreshold !== null && p.lowStockThreshold !== undefined ? p.lowStockThreshold : 5;
      
      let status = 'IN_STOCK';
      if (available === 0) status = 'OUT_OF_STOCK';
      else if (available < threshold) status = 'LOW_STOCK';

      const matchesStatus = stockStatusFilter === 'ALL' || status === stockStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [inventoryStates, searchTerm, stockStatusFilter]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ width: '220px', height: '32px' }} className="skeleton" />
          <div style={{ width: '240px', height: '32px' }} className="skeleton" />
        </div>
        <div className="grid-kpi">
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{ height: '112px' }} className="card skeleton" />
          ))}
        </div>
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
        <div className="state-title">Inventory Loading Error</div>
        <div className="state-description">{error}</div>
        <button onClick={fetchData} className="btn btn-primary btn-sm" style={{ marginTop: '8px' }}>
          <RefreshCw size={13} /> Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Page Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <h1 className="page-title">Inventory Overview</h1>
          <p className="body-text" style={{ marginTop: '2px' }}>
            Live stock balances, reservation queues, and reorder levels.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <Link to="/purchases" className="btn btn-secondary btn-sm">
            <ShoppingCart size={13} /> Purchase Orders
          </Link>
          <Link to="/inventory-movements" className="btn btn-secondary btn-sm">
            <Activity size={13} /> Movement Logs
          </Link>
          <button onClick={fetchData} className="btn btn-icon btn-sm" title="Refresh">
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {/* KPI Row - Uniform Heights */}
      {overview && (
        <div className="grid-kpi">
          
          <div className="kpi-card">
            <div className="kpi-card-header">
              <span className="kpi-title">Warehouse Stock</span>
              <div className="kpi-icon-wrap">
                <Boxes size={15} />
              </div>
            </div>
            <div className="kpi-value">{overview.totalStock?.toLocaleString() || 0}</div>
            <div className="kpi-subtitle">Total physical units on hand</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-card-header">
              <span className="kpi-title">Available for Sale</span>
              <div className="kpi-icon-wrap" style={{ color: 'var(--success)' }}>
                <CheckCircle2 size={15} />
              </div>
            </div>
            <div className="kpi-value" style={{ color: 'var(--success)' }}>
              {overview.totalAvailable?.toLocaleString() || 0}
            </div>
            <div className="kpi-subtitle">Uncommitted stock ready to ship</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-card-header">
              <span className="kpi-title">Customer Reserved</span>
              <div className="kpi-icon-wrap" style={{ color: 'var(--warning)' }}>
                <Clock size={15} />
              </div>
            </div>
            <div className="kpi-value" style={{ color: (overview.totalReserved || 0) > 0 ? 'var(--warning)' : 'var(--text-primary)' }}>
              {overview.totalReserved?.toLocaleString() || 0}
            </div>
            <div className="kpi-subtitle">Allocated to pending orders</div>
          </div>

          <div className="kpi-card" style={{
            borderColor: (overview.lowStockCount || 0) > 0 ? 'var(--warning-border)' : 'var(--border-color)',
            backgroundColor: (overview.lowStockCount || 0) > 0 ? 'rgba(232, 168, 78, 0.04)' : 'var(--bg-card)'
          }}>
            <div className="kpi-card-header">
              <span className="kpi-title">Reorder Alerts</span>
              <div className="kpi-icon-wrap" style={{
                color: (overview.lowStockCount || 0) > 0 ? 'var(--warning)' : 'var(--text-muted)'
              }}>
                <AlertTriangle size={15} />
              </div>
            </div>
            <div className="kpi-value" style={{
              color: (overview.lowStockCount || 0) > 0 ? 'var(--warning)' : 'var(--text-primary)'
            }}>
              {overview.lowStockCount || 0}
            </div>
            <div className="kpi-subtitle">
              <span>{(overview.lowStockCount || 0) > 0 ? 'SKUs below threshold' : 'All items sufficiently stocked'}</span>
            </div>
          </div>

        </div>
      )}

      {/* Filter and Search Bar - Clean Single Toolbar */}
      <div className="card" style={{ padding: '12px 16px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', flex: 1 }}>
          <div className="search-box" style={{ minWidth: '240px', flex: 1, maxWidth: '380px' }}>
            <Search size={14} />
            <input
              type="text"
              placeholder="Filter by product name, SKU, or category..."
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
              value={stockStatusFilter}
              onChange={(e) => {
                setStockStatusFilter(e.target.value);
                setSearchParams(e.target.value === 'ALL' ? {} : { status: e.target.value });
              }}
            >
              <option value="ALL">All Stock Statuses</option>
              <option value="IN_STOCK">In Stock</option>
              <option value="LOW_STOCK">Low Stock</option>
              <option value="OUT_OF_STOCK">Out of Stock</option>
            </select>
          </div>
        </div>

        <div className="text-xs" style={{ whiteSpace: 'nowrap' }}>
          Showing <strong style={{ color: 'var(--text-primary)' }}>{filteredInventory.length}</strong> of {inventoryStates.length} SKUs
        </div>
      </div>

      {/* Main Inventory Table */}
      <div className="table-container">
        {filteredInventory.length === 0 ? (
          <div className="state-container" style={{ padding: '40px 20px' }}>
            <div className="state-icon" style={{ width: '40px', height: '40px' }}>
              <Package size={20} />
            </div>
            <div className="state-title" style={{ fontSize: '13.5px' }}>No Inventory Records Found</div>
            <div className="state-description" style={{ fontSize: '12px' }}>
              {inventoryStates.length === 0
                ? 'Create a product and receive purchase orders to establish inventory tracking.'
                : 'No inventory items match your current search and filter settings.'}
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th style={{ textAlign: 'right' }}>Available</th>
                  <th style={{ textAlign: 'right' }}>Reserved</th>
                  <th style={{ textAlign: 'right' }}>Reorder Level</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.map((item) => {
                  const p = item.product || {};
                  const available = Number(item.available || 0);
                  const reserved = Number(item.reserved || 0);
                  const threshold = p.lowStockThreshold !== null && p.lowStockThreshold !== undefined ? Number(p.lowStockThreshold) : 5;

                  const statusKey = available === 0 ? 'OUT_OF_STOCK' : available < threshold ? 'LOW_STOCK' : 'IN_STOCK';

                  return (
                    <tr key={item._id || p._id || p.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <ProductThumbnail src={p.image} alt={p.name} size="md" />
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <Link 
                              to={`/products/${p.id || p._id}`} 
                              style={{ fontWeight: '500', color: 'var(--text-primary)' }}
                            >
                              {p.name || 'Unnamed Product'}
                            </Link>
                            {p.description && (
                              <span className="text-xs" style={{ color: 'var(--text-secondary)', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {p.description}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="td-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
                          {p.SKU || '—'}
                        </span>
                      </td>
                      <td>
                        <span className="text-xs" style={{ color: p.category ? 'var(--text-secondary)' : 'var(--text-secondary)' }}>
                          {p.category || '—'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }} className="td-mono">
                        <span style={{
                          fontWeight: '600',
                          color: available === 0 ? 'var(--danger)' : available < threshold ? 'var(--warning)' : 'var(--text-primary)'
                        }}>
                          {available.toLocaleString()}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }} className="td-mono">
                        <span style={{ color: reserved > 0 ? 'var(--warning)' : 'var(--text-secondary)' }}>
                          {reserved.toLocaleString()}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }} className="td-mono">
                        <span style={{ color: 'var(--text-secondary)' }}>
                          {threshold.toLocaleString()}
                        </span>
                      </td>
                      <td>
                        <Badge status={statusKey} />
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Link
                          to={`/products/${p.id || p._id}`}
                          className="row-view-link"
                          title="View Product Details"
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
