import { useState, useEffect } from 'react';
import { apiFetch } from '../../api/apiClient';
import { useAuth } from '../../context/AuthContext';
import {
  DollarSign,
  ShoppingBag,
  Clock,
  Package,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import Badge from '../../components/ui/Badge';

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
      console.error('Failed to load stock overview', err);
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
      const list = Array.isArray(top) ? top : (top.topProducts || []);
      setTopProducts(list);
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

  // Find max quantity for proportional bars in Top Products
  const maxSold = topProducts.length > 0
    ? Math.max(...topProducts.map(p => Number(p.quantitySold || 0)), 1)
    : 1;

  // Stock overview totals for segmented bar
  const totalStock = stockData ? (Number(stockData.totalStock) || 0) : 0;
  const availableStock = stockData ? (Number(stockData.totalAvailable) || 0) : 0;
  const reservedStock = stockData ? (Number(stockData.totalReserved) || 0) : 0;
  const soldStock = stockData ? (Number(stockData.totalSold) || 0) : 0;

  const availablePct = totalStock > 0 ? (availableStock / totalStock) * 100 : 0;
  const reservedPct = totalStock > 0 ? (reservedStock / totalStock) * 100 : 0;
  const soldPct = totalStock > 0 ? (soldStock / totalStock) * 100 : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1080px' }}>
      
      {/* Header with Date Filter */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="page-title">Operational Analytics</h1>
          <p className="body-text" style={{ marginTop: '2px' }}>
            Confirmed commercial revenue, fulfillment throughput, and warehouse inventory distribution.
          </p>
        </div>

        {isAdmin && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <input
                type="date"
                className="form-control"
                style={{ height: '32px', fontSize: '12px', padding: '0 8px', width: '130px' }}
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                title="Start Date"
              />
              <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>to</span>
              <input
                type="date"
                className="form-control"
                style={{ height: '32px', fontSize: '12px', padding: '0 8px', width: '130px' }}
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                title="End Date"
              />
            </div>
            {(startDate || endDate) && (
              <button
                onClick={handleDateClear}
                className="btn btn-secondary btn-sm"
                style={{ height: '32px', padding: '0 10px', fontSize: '12px' }}
              >
                Clear
              </button>
            )}
          </div>
        )}
      </div>

      {error && (
        <div style={{ backgroundColor: 'var(--danger-bg)', border: '1px solid var(--danger-border)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Row 1: KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        
        {/* Confirmed Revenue */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="text-xs" style={{ color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: '600' }}>
              Confirmed Revenue
            </span>
            <div className="kpi-icon-wrap" style={{ width: '30px', height: '30px' }}>
              <DollarSign size={15} />
            </div>
          </div>
          <div className="kpi-value" style={{ marginTop: '8px', marginBottom: 0 }}>
            ${salesData ? Number(salesData.grossRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
            Sum of fully paid storefront orders
          </p>
        </div>

        {/* Total Orders */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="text-xs" style={{ color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: '600' }}>
              Total Orders
            </span>
            <div className="kpi-icon-wrap" style={{ width: '30px', height: '30px' }}>
              <ShoppingBag size={15} />
            </div>
          </div>
          <div className="kpi-value" style={{ marginTop: '8px', marginBottom: 0 }}>
            {salesData ? Number(salesData.totalOrders || 0).toLocaleString() : '0'}
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
            All customer checkout attempts
          </p>
        </div>

        {/* Paid Orders */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="text-xs" style={{ color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: '600' }}>
              Paid Orders
            </span>
            <div className="kpi-icon-wrap" style={{ width: '30px', height: '30px' }}>
              <CheckCircle2 size={15} />
            </div>
          </div>
          <div className="kpi-value" style={{ marginTop: '8px', marginBottom: 0 }}>
            {salesData ? Number(salesData.paidOrders || 0).toLocaleString() : '0'}
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
            Completed transactions
          </p>
        </div>

        {/* Pending Payment */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="text-xs" style={{ color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: '600' }}>
              Pending Payment
            </span>
            <div className="kpi-icon-wrap" style={{ width: '30px', height: '30px' }}>
              <Clock size={15} />
            </div>
          </div>
          <div className="kpi-value" style={{ marginTop: '8px', marginBottom: 0 }}>
            {salesData ? Number(salesData.pendingOrders || 0).toLocaleString() : '0'}
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
            Active checkout holds
          </p>
        </div>

      </div>

      {/* Row 2: Top Performing Products */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 className="section-heading" style={{ fontSize: '15px' }}>Top Performing Products</h2>
            <p className="text-xs" style={{ marginTop: '2px', color: 'var(--text-muted)' }}>
              Highest volume catalog items based on confirmed paid orders
            </p>
          </div>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Ranked by units sold
          </span>
        </div>

        {topProducts.length === 0 ? (
          <div className="state-container" style={{ padding: '36px 20px' }}>
            <div className="state-icon" style={{ width: '38px', height: '38px' }}>
              <Package size={18} />
            </div>
            <div className="state-title" style={{ fontSize: '13.5px' }}>No Sales Recorded</div>
            <div className="state-description" style={{ fontSize: '12.5px' }}>
              Top selling product rankings appear here once customer purchases are confirmed.
            </div>
          </div>
        ) : (
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {topProducts.map((prod, index) => {
              const pName = prod.productName || prod.productDetails?.[0]?.name || `Product #${String(prod.productId || '').slice(-6).toUpperCase()}`;
              const pSku = prod.sku || prod.productDetails?.[0]?.SKU || '—';
              const sold = Number(prod.quantitySold || 0);
              const rev = Number(prod.revenue || 0);
              const widthPct = Math.max(Math.round((sold / maxSold) * 100), 4);

              return (
                <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: '13px' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                      <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{pName}</span>
                      <span className="mono text-xs" style={{ color: 'var(--text-muted)' }}>({pSku})</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <span className="td-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
                        <strong style={{ color: 'var(--text-primary)' }}>{sold}</strong> {sold === 1 ? 'unit' : 'units'} sold
                      </span>
                      <span className="td-mono text-xs" style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                        ${rev.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Proportional Bar */}
                  <div
                    style={{
                      width: '100%',
                      height: '8px',
                      backgroundColor: 'var(--bg-surface-secondary)',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    <div
                      style={{
                        width: `${widthPct}%`,
                        height: '100%',
                        backgroundColor: 'var(--accent-primary)',
                        borderRadius: '3px'
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Row 3: Inventory Status Distribution */}
      <div className="card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div>
            <h2 className="section-heading" style={{ fontSize: '15px' }}>Warehouse Inventory Distribution</h2>
            <p className="text-xs" style={{ marginTop: '2px', color: 'var(--text-muted)' }}>
              Proportion of physical inventory available, reserved in cart checkout holds, and historically fulfilled
            </p>
          </div>

          {stockData && stockData.lowStockProductCount > 0 && (
            <span className="badge badge-warning">
              <AlertTriangle size={12} />
              {stockData.lowStockProductCount} {stockData.lowStockProductCount === 1 ? 'Product' : 'Products'} Low on Stock
            </span>
          )}
        </div>

        {totalStock === 0 ? (
          <div className="state-container" style={{ padding: '28px 20px' }}>
            <div className="state-icon" style={{ width: '38px', height: '38px' }}>
              <Package size={18} />
            </div>
            <div className="state-title" style={{ fontSize: '13.5px' }}>No Inventory Tracked</div>
            <div className="state-description" style={{ fontSize: '12.5px' }}>
              Receive stock via Purchase Orders to view distribution metrics.
            </div>
          </div>
        ) : (
          <div>
            {/* Segmented Bar */}
            <div
              style={{
                display: 'flex',
                height: '14px',
                borderRadius: '6px',
                overflow: 'hidden',
                backgroundColor: 'var(--bg-surface-secondary)',
                border: '1px solid var(--border-color)',
                marginBottom: '16px'
              }}
            >
              {availablePct > 0 && (
                <div
                  style={{
                    width: `${availablePct}%`,
                    backgroundColor: 'var(--success)',
                    title: `Available: ${availableStock}`
                  }}
                />
              )}
              {reservedPct > 0 && (
                <div
                  style={{
                    width: `${reservedPct}%`,
                    backgroundColor: 'var(--warning)',
                    title: `Reserved: ${reservedStock}`
                  }}
                />
              )}
              {soldPct > 0 && (
                <div
                  style={{
                    width: `${soldPct}%`,
                    backgroundColor: 'var(--info)',
                    title: `Sold: ${soldStock}`
                  }}
                />
              )}
            </div>

            {/* Segment Breakdown Legend with Explicit Text Numbers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: 'var(--success)' }} />
                <div>
                  <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Available Stock</div>
                  <div className="td-mono" style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>
                    {availableStock.toLocaleString()} units
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: 'var(--warning)' }} />
                <div>
                  <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Reserved in Holds</div>
                  <div className="td-mono" style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>
                    {reservedStock.toLocaleString()} units
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: 'var(--info)' }} />
                <div>
                  <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Fulfilled / Sold</div>
                  <div className="td-mono" style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>
                    {soldStock.toLocaleString()} units
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
