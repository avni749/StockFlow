import { useState, useEffect } from 'react';
import { apiFetch } from '../../api/apiClient';
import { useAuth } from '../../context/AuthContext';
import {
  TrendingUp,
  Package,
  AlertTriangle,
  DollarSign,
  ShoppingCart,
  XCircle,
  Clock,
  ShieldAlert
} from 'lucide-react';

export default function AnalyticsHome() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'BUSINESS_ADMIN';

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [stockData, setStockData] = useState(null);
  const [salesData, setSalesData] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  
  const [loadingStock, setLoadingStock] = useState(true);
  const [loadingSales, setLoadingSales] = useState(isAdmin);
  const [error, setError] = useState(null);

  const fetchStock = async () => {
    try {
      setLoadingStock(true);
      const res = await apiFetch('/business/insights/stock-overview');
      if (res.ok) {
        const data = await res.json();
        setStockData(data);
      }
    } catch (err) {
      console.error("Failed to load stock overview", err);
    } finally {
      setLoadingStock(false);
    }
  };

  useEffect(() => {
    fetchStock();
  }, []);

  const fetchAdminInsights = async () => {
    if (!isAdmin) return;

    try {
      setLoadingSales(true);
      setError(null);
      
      let query = '';
      if (startDate || endDate) {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        query = `?${params.toString()}`;
      }

      const [salesRes, topRes] = await Promise.all([
        apiFetch(`/business/insights/sales${query}`),
        apiFetch(`/business/insights/top-selling${query}`)
      ]);

      if (!salesRes.ok || !topRes.ok) {
        throw new Error('Failed to load sales analytics');
      }

      const sales = await salesRes.json();
      const top = await topRes.json();

      setSalesData(sales);
      setTopProducts(top.topProducts || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingSales(false);
    }
  };

  useEffect(() => {
    fetchAdminInsights();
  }, [isAdmin, startDate, endDate]);

  const handleDateClear = () => {
    setStartDate('');
    setEndDate('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header & Date Range Controls */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <h1 className="page-title">Analytics & Intelligence</h1>
          <p className="body-text" style={{ marginTop: '2px' }}>
            Inventory turnover velocity, sales conversion rates, and gross margins.
          </p>
        </div>
        
        {isAdmin && (
          <div className="card" style={{ padding: '8px 14px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label className="text-xs" style={{ color: 'var(--text-secondary)' }}>From:</label>
              <input 
                type="date" 
                value={startDate} 
                onChange={e => setStartDate(e.target.value)}
                className="form-control td-mono"
                style={{ height: '30px', fontSize: '11.5px', padding: '0 8px', width: '130px' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label className="text-xs" style={{ color: 'var(--text-secondary)' }}>To:</label>
              <input 
                type="date" 
                value={endDate} 
                onChange={e => setEndDate(e.target.value)}
                className="form-control td-mono"
                style={{ height: '30px', fontSize: '11.5px', padding: '0 8px', width: '130px' }}
              />
            </div>
            {(startDate || endDate) && (
              <button 
                onClick={handleDateClear}
                className="btn btn-secondary btn-sm"
                style={{ height: '30px', fontSize: '11px', padding: '0 8px' }}
                title="Reset Date Range"
              >
                Reset
              </button>
            )}
          </div>
        )}
      </div>

      {error && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 16px',
          backgroundColor: 'var(--danger-bg)',
          border: '1px solid var(--danger-border)',
          color: 'var(--danger)',
          borderRadius: '5px',
          fontSize: '12.5px'
        }}>
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Section 1: Inventory Health (All Roles) */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Package size={16} style={{ color: 'var(--accent-primary)' }} />
          <h2 className="section-heading">Inventory Health & Stock Velocity</h2>
        </div>
        
        {loadingStock ? (
          <div className="grid-kpi">
            {[1, 2, 3, 4].map(i => <div key={i} style={{ height: '112px' }} className="card skeleton" />)}
          </div>
        ) : stockData ? (
          <div className="grid-kpi">
            <div className="kpi-card">
              <div className="kpi-card-header">
                <span className="kpi-title">Available for Sale</span>
                <div className="kpi-icon-wrap" style={{ color: 'var(--success)' }}>
                  <Package size={15} />
                </div>
              </div>
              <div className="kpi-value" style={{ color: 'var(--success)' }}>{stockData.totalAvailable?.toLocaleString() || 0}</div>
              <div className="kpi-subtitle">Uncommitted stock units</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-card-header">
                <span className="kpi-title">Customer Reserved</span>
                <div className="kpi-icon-wrap" style={{ color: 'var(--warning)' }}>
                  <Clock size={15} />
                </div>
              </div>
              <div className="kpi-value" style={{ color: (stockData.totalReserved || 0) > 0 ? 'var(--warning)' : 'var(--text-primary)' }}>
                {stockData.totalReserved?.toLocaleString() || 0}
              </div>
              <div className="kpi-subtitle">Allocated to pending orders</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-card-header">
                <span className="kpi-title">Total Units Dispatched</span>
                <div className="kpi-icon-wrap" style={{ color: 'var(--info)' }}>
                  <ShoppingCart size={15} />
                </div>
              </div>
              <div className="kpi-value">{stockData.totalSold?.toLocaleString() || 0}</div>
              <div className="kpi-subtitle">Historical completed shipments</div>
            </div>

            <div className="kpi-card" style={{
              borderColor: (stockData.lowStockProductCount || 0) > 0 ? 'var(--warning-border)' : 'var(--border-color)',
              backgroundColor: (stockData.lowStockProductCount || 0) > 0 ? 'rgba(232, 168, 78, 0.04)' : 'var(--bg-card)'
            }}>
              <div className="kpi-card-header">
                <span className="kpi-title">Low Stock Alerts</span>
                <div className="kpi-icon-wrap" style={{ color: (stockData.lowStockProductCount || 0) > 0 ? 'var(--warning)' : 'var(--text-muted)' }}>
                  <AlertTriangle size={15} />
                </div>
              </div>
              <div className="kpi-value" style={{ color: (stockData.lowStockProductCount || 0) > 0 ? 'var(--warning)' : 'var(--text-primary)' }}>
                {stockData.lowStockProductCount || 0}
              </div>
              <div className="kpi-subtitle">
                <span>{(stockData.lowStockProductCount || 0) > 0 ? 'Reorder action required' : 'Adequately stocked'}</span>
              </div>
            </div>
          </div>
        ) : null}
      </section>

      {/* Section 2: Sales Performance (BUSINESS_ADMIN Only) */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TrendingUp size={16} style={{ color: 'var(--accent-primary)' }} />
          <h2 className="section-heading">Financial Revenue & Conversions</h2>
        </div>

        {!isAdmin ? (
          <div className="card state-container" style={{ padding: '32px' }}>
            <div className="state-icon" style={{ width: '40px', height: '40px' }}>
              <ShieldAlert size={20} />
            </div>
            <div className="state-title" style={{ fontSize: '13.5px' }}>Restricted Financial Analytics</div>
            <div className="state-description" style={{ fontSize: '12px' }}>
              Gross revenue figures and sales transaction metrics are restricted to business administrators.
            </div>
          </div>
        ) : loadingSales ? (
          <div className="grid-kpi">
            {[1, 2, 3, 4].map(i => <div key={i} style={{ height: '112px' }} className="card skeleton" />)}
          </div>
        ) : salesData ? (
          <div className="grid-kpi">
            <div className="kpi-card">
              <div className="kpi-card-header">
                <span className="kpi-title">Gross Paid Revenue</span>
                <div className="kpi-icon-wrap" style={{ color: 'var(--accent-primary)' }}>
                  <DollarSign size={15} />
                </div>
              </div>
              <div className="kpi-value" style={{ color: 'var(--accent-primary)' }}>
                ${(salesData.grossRevenue || 0).toFixed(2)}
              </div>
              <div className="kpi-subtitle">Settled customer payments</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-card-header">
                <span className="kpi-title">Total Orders Initiated</span>
                <div className="kpi-icon-wrap">
                  <ShoppingCart size={15} />
                </div>
              </div>
              <div className="kpi-value">{salesData.totalOrders || 0}</div>
              <div className="kpi-subtitle">All cart checkout sessions</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-card-header">
                <span className="kpi-title">Paid Conversions</span>
                <div className="kpi-icon-wrap" style={{ color: 'var(--success)' }}>
                  <TrendingUp size={15} />
                </div>
              </div>
              <div className="kpi-value" style={{ color: 'var(--success)' }}>{salesData.paidOrders || 0}</div>
              <div className="kpi-subtitle">Conversion: {salesData.totalOrders > 0 ? Math.round(((salesData.paidOrders || 0) / salesData.totalOrders) * 100) : 0}%</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-card-header">
                <span className="kpi-title">Cancelled / Expired</span>
                <div className="kpi-icon-wrap" style={{ color: 'var(--danger)' }}>
                  <XCircle size={15} />
                </div>
              </div>
              <div className="kpi-value" style={{ color: (salesData.cancelledOrders || 0) > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
                {salesData.cancelledOrders || 0}
              </div>
              <div className="kpi-subtitle">Unfulfilled checkouts</div>
            </div>
          </div>
        ) : null}
      </section>

      {/* Section 3: Top Selling Products (BUSINESS_ADMIN Only) */}
      {isAdmin && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 className="section-heading" style={{ fontSize: '13.5px' }}>Top Performing Products</h2>
                <p className="text-xs" style={{ marginTop: '2px' }}>SKUs ranked by gross revenue</p>
              </div>
              <span className="badge badge-neutral text-xs">
                {topProducts.length} Ranked
              </span>
            </div>

            {topProducts.length === 0 ? (
              <div className="state-container" style={{ padding: '36px 16px' }}>
                <div className="state-icon" style={{ width: '40px', height: '40px' }}>
                  <TrendingUp size={20} />
                </div>
                <div className="state-title" style={{ fontSize: '13.5px' }}>No Sales Records in Range</div>
                <div className="state-description" style={{ fontSize: '12px' }}>
                  Widen your date range or verify that customer orders have reached PAID status.
                </div>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '60px', textAlign: 'center' }}>Rank</th>
                      <th>Product Description</th>
                      <th>SKU Identifier</th>
                      <th style={{ textAlign: 'right' }}>Units Sold</th>
                      <th style={{ textAlign: 'right' }}>Gross Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topProducts.map((p, idx) => (
                      <tr key={p._id || idx}>
                        <td style={{ textAlign: 'center' }} className="td-mono">
                          <span className={`badge ${idx === 0 ? 'badge-success' : idx < 3 ? 'badge-info' : 'badge-neutral'}`} style={{ width: '22px', height: '22px', padding: 0, justifyContent: 'center' }}>
                            {idx + 1}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{p.name}</span>
                        </td>
                        <td>
                          <span className="td-mono text-xs" style={{ color: 'var(--accent-primary)' }}>
                            {p.sku || p._id}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }} className="td-mono">
                          <span style={{ fontWeight: '600' }}>{p.totalSold}</span>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: '600', color: 'var(--text-primary)' }} className="td-mono">
                          ${Number(p.totalRevenue || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}

    </div>
  );
}
