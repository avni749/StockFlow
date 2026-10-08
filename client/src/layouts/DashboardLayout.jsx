import { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Package,
  Layers,
  ShoppingCart,
  Truck,
  ShoppingBag,
  ArrowLeftRight,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Search,
  Bell,
  ChevronRight,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import ThemeToggle from '../components/ui/ThemeToggle';

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Auto-collapse sidebar on smaller screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setCollapsed(true);
      } else {
        setCollapsed(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const navGroups = [
    {
      group: 'OVERVIEW',
      items: [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard }
      ]
    },
    {
      group: 'OPERATIONS',
      items: [
        { name: 'Products', path: '/products', icon: Package },
        { name: 'Inventory', path: '/inventory', icon: Layers },
        { name: 'Purchases', path: '/purchases', icon: ShoppingCart },
        { name: 'Suppliers', path: '/suppliers', icon: Truck },
        { name: 'Orders', path: '/orders', icon: ShoppingBag },
        { name: 'Movements', path: '/inventory-movements', icon: ArrowLeftRight }
      ]
    },
    {
      group: 'INSIGHTS',
      items: [
        { name: 'Analytics', path: '/analytics', icon: BarChart3 }
      ]
    },
    {
      group: 'SYSTEM',
      items: [
        { name: 'Settings', path: '/settings', icon: Settings }
      ]
    }
  ];

  // Resolve current page title and breadcrumb
  const getPageContext = () => {
    const path = location.pathname;
    if (path.startsWith('/dashboard')) return { title: 'Dashboard', section: 'Overview' };
    if (path.startsWith('/products/new')) return { title: 'Add Product', section: 'Products' };
    if (path.includes('/products/') && path.endsWith('/edit')) return { title: 'Edit Product', section: 'Products' };
    if (path.startsWith('/products/')) return { title: 'Product Details', section: 'Products' };
    if (path.startsWith('/products')) return { title: 'Product Catalog', section: 'Inventory' };
    if (path.startsWith('/inventory-movements/')) return { title: 'Movement Audit', section: 'Inventory' };
    if (path.startsWith('/inventory-movements')) return { title: 'Inventory Movements', section: 'Inventory' };
    if (path.startsWith('/inventory')) return { title: 'Stock Management', section: 'Inventory' };
    if (path.startsWith('/purchases/new')) return { title: 'New Purchase Order', section: 'Procurement' };
    if (path.startsWith('/purchases/')) return { title: 'Purchase Details', section: 'Procurement' };
    if (path.startsWith('/purchases')) return { title: 'Purchase Orders', section: 'Procurement' };
    if (path.startsWith('/suppliers/new')) return { title: 'New Supplier', section: 'Vendors' };
    if (path.includes('/suppliers/') && path.endsWith('/edit')) return { title: 'Edit Supplier', section: 'Vendors' };
    if (path.startsWith('/suppliers/')) return { title: 'Supplier Profile', section: 'Vendors' };
    if (path.startsWith('/suppliers')) return { title: 'Suppliers', section: 'Vendors' };
    if (path.startsWith('/orders/')) return { title: 'Order Details', section: 'Sales' };
    if (path.startsWith('/orders')) return { title: 'Customer Orders', section: 'Sales' };
    if (path.startsWith('/analytics')) return { title: 'Analytics & Reports', section: 'Insights' };
    if (path.startsWith('/settings')) return { title: 'Settings', section: 'System' };
    return { title: 'Overview', section: 'StockFlow' };
  };

  const pageContext = getPageContext();

  const handleGlobalSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  const initials = user?.name ? user.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : 'SF';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div 
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(3px)',
            zIndex: 90
          }}
        />
      )}

      {/* Sidebar */}
      <aside className={`dashboard-sidebar ${mobileOpen ? 'mobile-open' : ''}`} style={{
        width: collapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-width)',
        backgroundColor: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        height: '100vh',
        zIndex: 100,
        transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        ...(mobileOpen ? {
          position: 'fixed',
          left: 0,
          width: '260px',
          boxShadow: '10px 0 30px rgba(0,0,0,0.5)'
        } : {})
      }}>
        {/* Brand Header */}
        <div style={{
          height: 'var(--navbar-height)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed && !mobileOpen ? 'center' : 'space-between',
          padding: collapsed && !mobileOpen ? '0' : '0 20px',
          borderBottom: '1px solid var(--border-color)'
        }}>
          {(!collapsed || mobileOpen) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'var(--copper-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--on-copper)',
                fontWeight: '700',
                fontSize: '16px'
              }}>
                SF
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>StockFlow</span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Enterprise</span>
              </div>
            </div>
          )}

          {mobileOpen && (
            <button
              onClick={() => setMobileOpen(false)}
              title="Close Navigation"
              className="btn-icon"
              style={{ border: 'none' }}
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Navigation Groups */}
        <nav style={{
          flex: 1,
          padding: '16px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          overflowY: 'auto'
        }}>
          {navGroups.map((group) => (
            <div key={group.group} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {(!collapsed || mobileOpen) && (
                <div style={{
                  fontSize: '10px',
                  fontWeight: '600',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  padding: '4px 10px 4px',
                  userSelect: 'none'
                }}>
                  {group.group}
                </div>
              )}
              {group.items.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.path}
                  title={collapsed && !mobileOpen ? item.name : undefined}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: collapsed && !mobileOpen ? 'center' : 'flex-start',
                    gap: '10px',
                    height: '34px',
                    padding: collapsed && !mobileOpen ? '0' : '0 10px',
                    borderRadius: '5px',
                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                    backgroundColor: isActive ? 'var(--bg-card)' : 'transparent',
                    fontWeight: isActive ? '600' : '400',
                    fontSize: '12.5px',
                    position: 'relative',
                    transition: 'all 0.12s ease'
                  })}
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <div style={{
                          position: 'absolute',
                          left: 0,
                          top: '6px',
                          bottom: '6px',
                          width: '3px',
                          backgroundColor: 'var(--copper-primary)',
                          borderRadius: '0 3px 3px 0'
                        }} />
                      )}
                      <item.icon
                        size={17}
                        style={{
                          minWidth: '17px',
                          color: isActive ? 'var(--copper-primary)' : 'inherit'
                        }}
                      />
                      {(!collapsed || mobileOpen) && <span>{item.name}</span>}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* User Block & Logout */}
        <div style={{
          padding: '16px 12px',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          {(!collapsed || mobileOpen) && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '6px 8px',
              borderRadius: '6px',
              backgroundColor: 'var(--bg-card)'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                backgroundColor: 'var(--bg-surface-secondary)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '600',
                fontSize: '12px',
                color: 'var(--accent-primary)'
              }}>
                {initials}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <span style={{
                  fontSize: '13px',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {user?.name || 'Administrator'}
                </span>
                <span style={{
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  {user?.role === 'BUSINESS_ADMIN' ? (
                    <><ShieldCheck size={11} color="var(--accent-primary)" /> Admin</>
                  ) : (
                    <><UserCheck size={11} /> Staff</>
                  )}
                </span>
              </div>
            </div>
          )}

          <button
            onClick={logout}
            className="btn btn-outline"
            style={{
              width: '100%',
              justifyContent: collapsed && !mobileOpen ? 'center' : 'flex-start',
              height: '36px',
              fontSize: '12px'
            }}
            title="Sign out"
          >
            <LogOut size={15} />
            {(!collapsed || mobileOpen) && <span>Sign out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top Utility Bar */}
        <header style={{
          height: 'var(--navbar-height)',
          backgroundColor: 'var(--bg-sidebar)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          position: 'sticky',
          top: 0,
          zIndex: 80
        }}>
          {/* Left: Mobile hamburger & Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button
              onClick={() => setMobileOpen(true)}
              className="btn-icon"
              style={{ display: window.innerWidth < 1024 ? 'flex' : 'none' }}
              title="Open Navigation"
            >
              <Menu size={18} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
              <span style={{ color: 'var(--text-muted)' }}>{pageContext.section}</span>
              <ChevronRight size={14} color="var(--text-muted)" />
              <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{pageContext.title}</span>
            </div>
          </div>

          {/* Right: Search, Notifications & Context */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {/* Search Input */}
            <form onSubmit={handleGlobalSearch} className="search-box topbar-search" style={{ width: '260px' }}>
              <Search size={15} />
              <input
                type="text"
                placeholder="Search products, SKU, category..."
                className="form-control"
                style={{ height: '36px', fontSize: '12px' }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Notification Bell */}
            <button 
              className="btn-icon" 
              style={{ position: 'relative' }}
              title="System Alerts"
            >
              <Bell size={16} />
              <span style={{
                position: 'absolute',
                top: '7px',
                right: '7px',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: 'var(--copper-primary)'
              }} />
            </button>

            {/* User status badge */}
            <div className="topbar-status-badge" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '4px 10px',
              borderRadius: '20px',
              backgroundColor: 'var(--bg-surface-secondary)',
              border: '1px solid var(--border-color)',
              fontSize: '12px',
              color: 'var(--text-secondary)'
            }}>
              <span style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: 'var(--success)'
              }} />
              <span>Online</span>
            </div>
          </div>
        </header>

        {/* Page View Outlet */}
        <main className="dashboard-main-content" style={{
          flex: 1,
          padding: '28px 32px',
          overflowY: 'auto'
        }}>
          <div style={{ maxWidth: '1360px', margin: '0 auto', width: '100%' }}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
