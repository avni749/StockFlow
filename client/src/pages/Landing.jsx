import { Link } from 'react-router-dom';
import { 
  Package, 
  Layers, 
  ShoppingCart, 
  BarChart3, 
  ArrowRight, 
  CheckCircle2, 
  Truck, 
  Activity, 
  Boxes, 
  TrendingUp,
  AlertTriangle,
  Clock
} from 'lucide-react';
import ThemeToggle from '../components/ui/ThemeToggle';

export default function Landing() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', overflowX: 'hidden' }}>
      
      {/* Global Navigation Bar */}
      <header style={{ 
        padding: '0 40px', 
        height: '60px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        position: 'sticky', 
        top: 0, 
        backgroundColor: 'var(--bg-primary)', 
        borderBottom: '1px solid var(--border-color)',
        zIndex: 50 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '5px', backgroundColor: 'var(--copper-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--on-copper)' }}>
              <Package size={16} strokeWidth={2.5} />
            </div>
            <span style={{ fontSize: '16px', fontWeight: '700', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              StockFlow
            </span>
          </Link>

          <nav className="landing-desktop-nav" style={{ display: 'flex', gap: '24px' }}>
            <a href="#product" style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500' }}>Product</a>
            <a href="#features" style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500' }}>Capabilities</a>
            <a href="#workflow" style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500' }}>How It Works</a>
          </nav>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ThemeToggle />
          <Link to="/login" className="btn btn-secondary btn-sm">
            Sign In
          </Link>
          <Link to="/register" className="btn btn-primary btn-sm">
            Create Workspace
          </Link>
        </div>
      </header>

      {/* Hero Section - Clean, Human-Written, Restrained */}
      <section style={{ padding: '80px 24px 48px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <div style={{ maxWidth: '780px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '3px 10px', borderRadius: '4px', backgroundColor: 'var(--bg-surface-secondary)', border: '1px solid var(--border-color)', marginBottom: '20px', fontSize: '11.5px', color: 'var(--text-secondary)' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--accent-primary)' }} />
            <span>StockFlow 2.4 &bull; Inventory Management for Modern Businesses</span>
          </div>

          <h1 style={{ fontSize: 'clamp(32px, 4.5vw, 48px)', fontWeight: '700', letterSpacing: '-0.03em', lineHeight: '1.2', color: 'var(--text-primary)', marginBottom: '16px' }}>
            Manage your inventory with clarity.
          </h1>

          <p style={{ fontSize: '15px', color: 'var(--text-secondary)', maxWidth: '620px', lineHeight: '1.6', marginBottom: '28px' }}>
            Track products, suppliers, purchases, and orders from one place. Know what you have, what is moving, and what needs attention.
          </p>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link to="/register" className="btn btn-primary" style={{ height: '40px', padding: '0 20px' }}>
              Create Your Workspace <ArrowRight size={14} />
            </Link>
            <Link to="/login" className="btn btn-secondary" style={{ height: '40px', padding: '0 18px' }}>
              Sign In to Existing Account
            </Link>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '28px', color: 'var(--text-muted)', fontSize: '12px' }}>
            <span>Multi-tenant isolation</span>
            <span>&bull;</span>
            <span>Real-time stock ledger</span>
            <span>&bull;</span>
            <span>Safety reorder alerts</span>
          </div>
        </div>
      </section>

      {/* Primary Visual: Real StockFlow Dashboard UI Console */}
      <section id="product" style={{ padding: '0 24px 80px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: '1080px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
          
          {/* Console Window Header */}
          <div style={{ height: '38px', backgroundColor: 'var(--bg-sidebar)', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: 'var(--border-color)' }} />
              <div style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: 'var(--border-color)' }} />
              <div style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: 'var(--border-color)' }} />
              <span className="td-mono text-xs" style={{ marginLeft: '10px', color: 'var(--text-muted)' }}>app.stockflow.internal/dashboard</span>
            </div>
            <span className="badge badge-success" style={{ fontSize: '10px', padding: '1px 5px' }}>CONNECTED</span>
          </div>

          {/* Console Interior */}
          <div style={{ display: 'flex', minHeight: '460px', backgroundColor: 'var(--bg-primary)' }}>
            
            {/* Sidebar Preview */}
            <div style={{ width: '190px', backgroundColor: 'var(--bg-sidebar)', borderRight: '1px solid var(--border-color)', padding: '14px 10px', display: 'flex', flexDirection: 'column', gap: '4px' }} className="landing-mock-sidebar">
              <div style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', padding: '0 6px 6px' }}>
                Navigation
              </div>
              {[
                { label: 'Dashboard', active: true, icon: BarChart3 },
                { label: 'Products', active: false, icon: Package },
                { label: 'Inventory', active: false, icon: Boxes },
                { label: 'Purchases', active: false, icon: ShoppingCart },
                { label: 'Suppliers', active: false, icon: Truck },
                { label: 'Orders', active: false, icon: Activity }
              ].map((item, idx) => {
                const IconComp = item.icon;
                return (
                  <div key={idx} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    padding: '7px 8px', 
                    borderRadius: '4px', 
                    backgroundColor: item.active ? 'var(--bg-card)' : 'transparent',
                    color: item.active ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontSize: '11.5px',
                    fontWeight: item.active ? '600' : '400'
                  }}>
                    <IconComp size={13} style={{ color: item.active ? 'var(--accent-primary)' : 'var(--text-muted)' }} />
                    <span>{item.label}</span>
                  </div>
                );
              })}
            </div>

            {/* Dashboard Content Preview */}
            <div style={{ flex: 1, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '14px', overflowX: 'auto' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>Good morning, Operations.</div>
                  <div className="text-xs">Live inventory and orders overview.</div>
                </div>
                <span className="badge badge-neutral text-xs">TENANT-PROD-01</span>
              </div>

              {/* KPI Strip */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                <div className="kpi-card" style={{ padding: '10px 12px', minHeight: '80px' }}>
                  <div className="kpi-title" style={{ fontSize: '11px' }}>Total Stock Units</div>
                  <div className="kpi-value" style={{ fontSize: '18px' }}>12,480</div>
                  <div className="kpi-subtitle" style={{ fontSize: '10.5px' }}>Across 142 SKUs</div>
                </div>
                <div className="kpi-card" style={{ padding: '10px 12px', minHeight: '80px' }}>
                  <div className="kpi-title" style={{ fontSize: '11px' }}>Available for Sale</div>
                  <div className="kpi-value" style={{ fontSize: '18px', color: 'var(--success)' }}>11,920</div>
                  <div className="kpi-subtitle" style={{ fontSize: '10.5px' }}>95.5% uncommitted</div>
                </div>
                <div className="kpi-card" style={{ padding: '10px 12px', minHeight: '80px' }}>
                  <div className="kpi-title" style={{ fontSize: '11px' }}>Reorder Alerts</div>
                  <div className="kpi-value" style={{ fontSize: '18px', color: 'var(--warning)' }}>3</div>
                  <div className="kpi-subtitle" style={{ fontSize: '10.5px' }}>Below safety minimum</div>
                </div>
                <div className="kpi-card" style={{ padding: '10px 12px', minHeight: '80px' }}>
                  <div className="kpi-title" style={{ fontSize: '11px' }}>Gross Revenue</div>
                  <div className="kpi-value" style={{ fontSize: '18px', color: 'var(--accent-primary)' }}>$84,210.00</div>
                  <div className="kpi-subtitle" style={{ fontSize: '10.5px' }}>148 confirmed orders</div>
                </div>
              </div>

              {/* Table Preview */}
              <div className="table-container" style={{ border: '1px solid var(--border-color)' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ padding: '8px 12px', fontSize: '10px' }}>Product</th>
                      <th style={{ padding: '8px 12px', fontSize: '10px' }}>SKU</th>
                      <th style={{ padding: '8px 12px', fontSize: '10px', textAlign: 'right' }}>Available</th>
                      <th style={{ padding: '8px 12px', fontSize: '10px', textAlign: 'right' }}>Reorder Level</th>
                      <th style={{ padding: '8px 12px', fontSize: '10px' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: 'Industrial Hydraulic Pump HP-40', sku: 'SKU-HYD-040', available: '1,420', threshold: '200', status: 'IN STOCK', badge: 'badge-success' },
                      { name: 'Micro Precision Bearing Set B-12', sku: 'SKU-BRG-012', available: '18', threshold: '50', status: 'LOW STOCK', badge: 'badge-warning' },
                      { name: 'Electronic Control Module ECM-08', sku: 'SKU-ECM-008', available: '840', threshold: '100', status: 'IN STOCK', badge: 'badge-success' }
                    ].map((row, i) => (
                      <tr key={i}>
                        <td style={{ padding: '9px 12px', fontSize: '11.5px', fontWeight: '500' }}>{row.name}</td>
                        <td className="td-mono" style={{ padding: '9px 12px', fontSize: '11px', color: 'var(--accent-primary)' }}>{row.sku}</td>
                        <td className="td-mono" style={{ padding: '9px 12px', fontSize: '11px', textAlign: 'right' }}>{row.available}</td>
                        <td className="td-mono" style={{ padding: '9px 12px', fontSize: '11px', textAlign: 'right', color: 'var(--text-muted)' }}>{row.threshold}</td>
                        <td style={{ padding: '9px 12px' }}>
                          <span className={`badge ${row.badge}`} style={{ fontSize: '10px' }}>{row.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Core Capabilities Section */}
      <section id="features" style={{ padding: '64px 24px', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}>
        <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <span className="badge badge-neutral" style={{ marginBottom: '8px' }}>SYSTEM CAPABILITIES</span>
            <h2 style={{ fontSize: '26px', fontWeight: '700', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              Built for warehouse operational discipline.
            </h2>
            <p className="body-text" style={{ maxWidth: '520px', margin: '6px auto 0' }}>
              Everything your team needs to track inventory from supplier dock to customer delivery.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            
            <div className="card" style={{ padding: '20px' }}>
              <div className="kpi-icon-wrap" style={{ marginBottom: '12px' }}>
                <Layers size={16} />
              </div>
              <h3 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)', textTransform: 'none', marginBottom: '6px' }}>
                Catalog & SKU Management
              </h3>
              <p className="body-text">
                Define unique SKUs, categories, unit prices, and custom reorder thresholds. Prevent duplicate entries and maintain strict catalog consistency.
              </p>
            </div>

            <div className="card" style={{ padding: '20px' }}>
              <div className="kpi-icon-wrap" style={{ marginBottom: '12px' }}>
                <Truck size={16} />
              </div>
              <h3 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)', textTransform: 'none', marginBottom: '6px' }}>
                Supplier Procurement & Receipts
              </h3>
              <p className="body-text">
                Maintain vendor records and generate purchase orders. Click "Receive Stock" when shipments arrive to automatically increment warehouse counts.
              </p>
            </div>

            <div className="card" style={{ padding: '20px' }}>
              <div className="kpi-icon-wrap" style={{ marginBottom: '12px' }}>
                <ShoppingCart size={16} />
              </div>
              <h3 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)', textTransform: 'none', marginBottom: '6px' }}>
                Order Fulfillment Protection
              </h3>
              <p className="body-text">
                Atomic database queries guarantee stock availability before payment confirmation. Prevent overselling by locking unit allocations immediately.
              </p>
            </div>

            <div className="card" style={{ padding: '20px' }}>
              <div className="kpi-icon-wrap" style={{ marginBottom: '12px' }}>
                <Activity size={16} />
              </div>
              <h3 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)', textTransform: 'none', marginBottom: '6px' }}>
                Immutable Movement Audit Trail
              </h3>
              <p className="body-text">
                Every stock shift—from restocks and manual reconciliations to order dispatches—records an unalterable audit log with timestamps and operators.
              </p>
            </div>

            <div className="card" style={{ padding: '20px' }}>
              <div className="kpi-icon-wrap" style={{ marginBottom: '12px' }}>
                <AlertTriangle size={16} />
              </div>
              <h3 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)', textTransform: 'none', marginBottom: '6px' }}>
                Safety Stock Alerts
              </h3>
              <p className="body-text">
                Configurable low-stock thresholds flag items requiring urgent replenishment before bays run dry. Proactively prevent revenue loss from stockouts.
              </p>
            </div>

            <div className="card" style={{ padding: '20px' }}>
              <div className="kpi-icon-wrap" style={{ marginBottom: '12px' }}>
                <BarChart3 size={16} />
              </div>
              <h3 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)', textTransform: 'none', marginBottom: '6px' }}>
                Turnover Velocity & Reports
              </h3>
              <p className="body-text">
                Analyze fast-moving vs slow-moving inventory, gross sales margins, and top-performing SKUs inside a clear business intelligence view.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="workflow" style={{ padding: '64px 24px', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-sidebar)' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <span className="badge badge-info" style={{ marginBottom: '8px' }}>WORKFLOW</span>
            <h2 style={{ fontSize: '26px', fontWeight: '700', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              How StockFlow runs your warehouse
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '4px', backgroundColor: 'var(--accent-primary)', color: '#0B161B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '12px' }}>
                  1
                </div>
                <h3 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)', textTransform: 'none' }}>Define Catalog</h3>
              </div>
              <p className="body-text">
                Register your products with SKU numbers, categories, unit prices, and safety reorder thresholds.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '4px', backgroundColor: 'var(--accent-primary)', color: '#0B161B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '12px' }}>
                  2
                </div>
                <h3 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)', textTransform: 'none' }}>Procure & Restock</h3>
              </div>
              <p className="body-text">
                Generate purchase orders for suppliers. Receive deliveries into stock with 1-click receiving and automated valuation updates.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '4px', backgroundColor: 'var(--accent-primary)', color: '#0B161B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '12px' }}>
                  3
                </div>
                <h3 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)', textTransform: 'none' }}>Fulfill & Audit</h3>
              </div>
              <p className="body-text">
                Process customer sales seamlessly. Follow live allocation changes and inspect the complete movement history for each item.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section style={{ padding: '64px 24px', textAlign: 'center', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}>
        <div style={{ maxWidth: '540px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '26px', fontWeight: '700', letterSpacing: '-0.02em', color: 'var(--text-primary)', marginBottom: '10px' }}>
            Ready to organize your inventory?
          </h2>
          <p className="body-text" style={{ marginBottom: '24px' }}>
            Create an enterprise workspace in seconds and take control of your stock.
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <Link to="/register" className="btn btn-primary" style={{ height: '38px', padding: '0 20px' }}>
              Create Workspace
            </Link>
            <Link to="/login" className="btn btn-secondary" style={{ height: '38px', padding: '0 16px' }}>
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '32px 40px', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', fontSize: '12px', color: 'var(--text-secondary)' }}>
        <div style={{ maxWidth: '1080px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '20px', height: '20px', borderRadius: '4px', backgroundColor: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0B161B' }}>
              <Package size={12} strokeWidth={2.5} />
            </div>
            <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>StockFlow</span>
            <span style={{ color: 'var(--text-muted)' }}>— Inventory Management Software</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '11.5px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: 'var(--accent-primary)', display: 'inline-block' }} />
              <span style={{ color: 'var(--text-muted)' }}>Operational</span>
            </div>
            <span>&copy; {new Date().getFullYear()} StockFlow. All rights reserved.</span>
          </div>
        </div>
      </footer>

      <style>{`
        @media (max-width: 768px) {
          .landing-desktop-nav { display: none !important; }
          .landing-mock-sidebar { display: none !important; }
        }
      `}</style>

    </div>
  );
}
