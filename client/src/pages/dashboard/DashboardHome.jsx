import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../../api/apiClient';
import { useAuth } from '../../context/AuthContext';
import {
  Package,
  Layers,
  AlertTriangle,
  DollarSign,
  ShoppingBag,
  ArrowRight,
  Plus,
  RefreshCw,
  Clock,
  CheckCircle2,
  TrendingUp,
  Boxes
} from 'lucide-react';
import Badge from '../../components/ui/Badge';

export default function DashboardHome() {
  const { user } = useAuth();

  const [stock, setStock] = useState(null);
  const [sales, setSales] = useState(null);
  const [topSelling, setTopSelling] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [stockRes, salesRes, topRes, ordersRes] = await Promise.all([
        apiFetch('/business/insights/stock-overview'),
        apiFetch('/business/insights/sales'),
        apiFetch('/business/insights/top-selling?limit=5'),
        apiFetch('/business/orders?limit=5')
      ]);

      if (!stockRes.ok || !salesRes.ok || !topRes.ok || !ordersRes.ok) {
        throw new Error('Failed to retrieve inventory and sales metrics');
      }

      setStock(await stockRes.json());
      setSales(await salesRes.json());
      setTopSelling(await topRes.json());
      
      const ordersData = await ordersRes.json();
      setRecentOrders(ordersData.orders || []);
    } catch (err) {
      console.error("DASHBOARD FETCH ERROR:", err);
      setError(err.message || "Couldn't load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ width: '240px', height: '32px' }} className="skeleton" />
          <div style={{ width: '160px', height: '32px' }} className="skeleton" />
        </div>
        <div className="grid-kpi">
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{ height: '112px' }} className="card skeleton" />
          ))}
        </div>
        <div style={{ height: '72px' }} className="card skeleton" />
        <div className="grid-2col">
          <div style={{ height: '320px' }} className="card skeleton" />
          <div style={{ height: '320px' }} className="card skeleton" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card state-container" style={{ margin: '32px auto', maxWidth: '460px' }}>
        <div className="state-icon" style={{ color: 'var(--danger)', backgroundColor: 'var(--danger-bg)' }}>
          <AlertTriangle size={20} />
        </div>
        <div className="state-title">Dashboard Loading Error</div>
        <div className="state-description">{error}</div>
        <button onClick={fetchDashboardData} className="btn btn-primary btn-sm" style={{ marginTop: '8px' }}>
          <RefreshCw size={13} /> Retry Connection
        </button>
      </div>
    );
  }

  const totalStockCount = stock?.totalStock || (Number(stock?.totalAvailable || 0) + Number(stock?.totalReserved || 0));
  const availablePct = totalStockCount > 0 ? Math.round(((stock?.totalAvailable || 0) / totalStockCount) * 100) : 0;
  const reservedPct = totalStockCount > 0 ? Math.round(((stock?.totalReserved || 0) / totalStockCount) * 100) : 0;
  const lowStockCount = Number(stock?.lowStockCount || 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header section with Greeting and Quick Actions */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <h1 className="page-title">{getGreeting()}, {user?.name ? user.name.split(' ')[0] : 'Operator'}.</h1>
          <p className="body-text" style={{ marginTop: '2px' }}>
            Current inventory velocity and order pipeline overview.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={fetchDashboardData} className="btn btn-secondary btn-sm" title="Refresh metrics">
            <RefreshCw size={13} /> Refresh
          </button>
          <Link to="/products/new" className="btn btn-primary btn-sm">
            <Plus size={13} /> Add Product
          </Link>
        </div>
      </div>

      {/* "What Needs Attention?" Alert Banner */}
      {lowStockCount > 0 ? (
        <div style={{
          backgroundColor: 'var(--warning-bg)',
          border: '1px solid var(--warning-border)',
          borderRadius: '6px',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '4px', backgroundColor: 'var(--warning-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--warning)' }}>
              <AlertTriangle size={14} />
            </div>
            <div>
              <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
                {lowStockCount} {lowStockCount === 1 ? 'item requires' : 'items require'} immediate reordering
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginLeft: '8px' }}>
                Stock levels are below configured minimum safety thresholds.
              </span>
            </div>
          </div>
          <Link to="/inventory?status=LOW_STOCK" className="btn btn-secondary btn-sm" style={{ height: '28px', fontSize: '11.5px', borderColor: 'var(--warning-border)' }}>
            Review Low Stock <ArrowRight size={12} />
          </Link>
        </div>
      ) : totalStockCount > 0 ? (
        <div style={{
          backgroundColor: 'var(--success-bg)',
          border: '1px solid var(--success-border)',
          borderRadius: '6px',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '12.5px',
          color: 'var(--text-secondary)'
        }}>
          <CheckCircle2 size={15} style={{ color: 'var(--success)' }} />
          <span>All tracked SKUs are operating within normal inventory safety thresholds.</span>
        </div>
      ) : null}

      {/* KPI Cards Row - Perfectly Aligned & Uniform Heights */}
      <div className="grid-kpi">
        
        {/* Total Physical Stock */}
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">Total Units</span>
            <div className="kpi-icon-wrap">
              <Boxes size={15} />
            </div>
          </div>
          <div className="kpi-value">{totalStockCount.toLocaleString()}</div>
          <div className="kpi-subtitle">
            <span>Overall physical stock in warehouse</span>
          </div>
        </div>

        {/* Available Stock */}
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">Available for Sale</span>
            <div className="kpi-icon-wrap" style={{ color: 'var(--success)' }}>
              <Package size={15} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: totalStockCount > 0 ? 'var(--success)' : 'var(--text-primary)' }}>
            {(stock?.totalAvailable || 0).toLocaleString()}
          </div>
          <div className="kpi-subtitle">
            {totalStockCount > 0 ? (
              <><span className="mono">{availablePct}%</span> of inventory uncommitted</>
            ) : (
              <span>No stock recorded yet</span>
            )}
          </div>
        </div>

        {/* Reserved Stock */}
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">Customer Reserved</span>
            <div className="kpi-icon-wrap" style={{ color: 'var(--warning)' }}>
              <Clock size={15} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: reservedPct > 0 ? 'var(--warning)' : 'var(--text-primary)' }}>
            {(stock?.totalReserved || 0).toLocaleString()}
          </div>
          <div className="kpi-subtitle">
            {totalStockCount > 0 ? (
              <><span className="mono">{reservedPct}%</span> pending order checkout</>
            ) : (
              <span>No reserved allocations</span>
            )}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="kpi-card" style={{
          borderColor: lowStockCount > 0 ? 'var(--warning-border)' : 'var(--border-color)',
          backgroundColor: lowStockCount > 0 ? 'var(--warning-bg)' : 'var(--bg-card)'
        }}>
          <div className="kpi-card-header">
            <span className="kpi-title">Low Stock Alerts</span>
            <div className="kpi-icon-wrap" style={{
              color: lowStockCount > 0 ? 'var(--warning)' : 'var(--text-muted)'
            }}>
              <AlertTriangle size={15} />
            </div>
          </div>
          <div className="kpi-value" style={{
            color: lowStockCount > 0 ? 'var(--warning)' : 'var(--text-primary)'
          }}>
            {lowStockCount}
          </div>
          <div className="kpi-subtitle">
            <span>{lowStockCount > 0 ? 'Action required: reorder' : 'Healthy inventory state'}</span>
          </div>
        </div>

        {/* Gross Sales Revenue */}
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">Confirmed Revenue</span>
            <div className="kpi-icon-wrap">
              <DollarSign size={15} />
            </div>
          </div>
          <div className="kpi-value">
            ${(sales?.grossRevenue || 0).toFixed(2)}
          </div>
          <div className="kpi-subtitle">
            {Number(sales?.paidOrders || 0) > 0 ? (
              <><span className="mono">{sales?.paidOrders}</span> paid order transactions</>
            ) : (
              <span>No transactions recorded yet</span>
            )}
          </div>
        </div>

      </div>

      {/* Stock Allocation Breakdown Bar */}
      <div className="card" style={{ padding: '16px 18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: totalStockCount > 0 ? '10px' : '4px' }}>
          <div>
            <h2 className="section-heading" style={{ fontSize: '13.5px' }}>Inventory Allocation Ratio</h2>
            <p className="text-xs" style={{ marginTop: '2px' }}>Real-time proportion of active catalog allocations</p>
          </div>
          <Link to="/inventory" className="text-xs" style={{ color: 'var(--copper-text)', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '3px' }}>
            Open Inventory <ArrowRight size={12} />
          </Link>
        </div>

        {totalStockCount > 0 ? (
          <>
            {/* Distribution Progress Bar */}
            <div style={{
              height: '6px',
              width: '100%',
              backgroundColor: 'var(--bg-surface-secondary)',
              borderRadius: '3px',
              overflow: 'hidden',
              display: 'flex',
              marginBottom: '10px'
            }}>
              <div
                title={`Available: ${availablePct}%`}
                style={{
                  width: `${availablePct}%`,
                  backgroundColor: 'var(--success)',
                  transition: 'width 0.2s ease'
                }}
              />
              <div
                title={`Reserved: ${reservedPct}%`}
                style={{
                  width: `${reservedPct}%`,
                  backgroundColor: 'var(--warning)',
                  transition: 'width 0.2s ease'
                }}
              />
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', gap: '20px', fontSize: '11.5px', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: 'var(--success)' }} />
                <span>Available:</span>
                <span className="mono" style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{stock?.totalAvailable}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: 'var(--warning)' }} />
                <span>Reserved:</span>
                <span className="mono" style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{stock?.totalReserved}</span>
              </div>
              {Number(stock?.totalSold || 0) > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: 'var(--info)' }} />
                  <span>Dispatched / Sold:</span>
                  <span className="mono" style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{stock?.totalSold}</span>
                </div>
              )}
            </div>
          </>
        ) : (
          <div style={{ padding: '8px 0 2px', fontSize: '12px', color: 'var(--text-muted)' }}>
            No stock recorded yet. Add products and record purchase orders to populate allocation metrics.
          </div>
        )}
      </div>

      {/* Main Tables Grid: Best Sellers & Recent Orders */}
      <div className="grid-2col">
        
        {/* Top Selling Products */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <h2 className="section-heading" style={{ fontSize: '13.5px' }}>Top Selling Products</h2>
              <p className="text-xs" style={{ marginTop: '2px' }}>Highest revenue generators</p>
            </div>
            <Link to="/analytics" className="text-xs" style={{ color: 'var(--copper-text)', fontWeight: '500' }}>
              Detailed Report &rarr;
            </Link>
          </div>

          {(!topSelling?.topProducts || topSelling.topProducts.length === 0) ? (
            <div className="state-container" style={{ padding: '24px 16px', minHeight: '160px' }}>
              <div className="state-icon" style={{ width: '32px', height: '32px' }}>
                <ShoppingBag size={16} />
              </div>
              <div className="state-title" style={{ fontSize: '13px' }}>No Sales Logged Yet</div>
              <div className="state-description" style={{ fontSize: '11.5px' }}>
                Paid customer orders will automatically populate sales rankings.
              </div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th style={{ textAlign: 'right' }}>Units Sold</th>
                    <th style={{ textAlign: 'right' }}>Gross Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {topSelling.topProducts.map((p, idx) => (
                    <tr key={p._id || idx}>
                      <td>
                        <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{p.name}</div>
                        {p.sku && <span className="mono text-xs" style={{ color: 'var(--text-secondary)' }}>{p.sku}</span>}
                      </td>
                      <td style={{ textAlign: 'right' }} className="td-mono">
                        <span className="badge badge-success">{p.totalSold} sold</span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: '600' }} className="td-mono">
                        ${(p.totalRevenue || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <h2 className="section-heading" style={{ fontSize: '13.5px' }}>Recent Orders</h2>
              <p className="text-xs" style={{ marginTop: '2px' }}>Latest customer transactions</p>
            </div>
            <Link to="/orders" className="text-xs" style={{ color: 'var(--copper-text)', fontWeight: '500' }}>
              View All &rarr;
            </Link>
          </div>

          {!recentOrders || recentOrders.length === 0 ? (
            <div className="state-container" style={{ padding: '24px 16px', minHeight: '160px' }}>
              <div className="state-icon" style={{ width: '32px', height: '32px' }}>
                <Package size={16} />
              </div>
              <div className="state-title" style={{ fontSize: '13px' }}>No Orders Created</div>
              <div className="state-description" style={{ fontSize: '11.5px' }}>
                Customer orders from your storefront will be listed here.
              </div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Order Reference</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map(order => (
                    <tr key={order._id}>
                      <td>
                        <Link to={`/orders/${order._id}`} style={{ fontWeight: '500', color: 'var(--text-primary)' }}>
                          <span className="mono">#{order._id.slice(-6).toUpperCase()}</span>
                        </Link>
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {new Date(order.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td>
                        <Badge status={order.status} />
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: '600' }} className="td-mono">
                        ${order.totalAmount?.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
