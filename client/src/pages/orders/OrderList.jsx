import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiFetch } from '../../api/apiClient';
import {
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  Search,
  RefreshCw,
  AlertTriangle,
  Eye,
  Calendar
} from 'lucide-react';

export default function OrderList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const statusFilter = searchParams.get('status') || '';

  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 20 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let url = `/business/orders?page=${currentPage}&limit=20`;
      if (statusFilter) url += `&status=${statusFilter}`;

      const res = await apiFetch(url);
      if (!res.ok) throw new Error('Failed to load customer orders');
      
      const data = await res.json();
      setOrders(data.orders || []);
      if (data.pagination) setPagination(data.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [currentPage, statusFilter]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setSearchParams(prev => {
        prev.set('page', newPage.toString());
        return prev;
      });
    }
  };

  const handleTabClick = (status) => {
    setSearchParams(prev => {
      if (status) prev.set('status', status);
      else prev.delete('status');
      prev.set('page', '1');
      return prev;
    });
  };

  const tabs = [
    { label: 'All Orders', value: '' },
    { label: 'Paid', value: 'PAID' },
    { label: 'Pending Payment', value: 'PENDING_PAYMENT' },
    { label: 'Cancelled', value: 'CANCELLED' },
    { label: 'Expired', value: 'EXPIRED' }
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PAID':
        return <span className="badge badge-success">PAID</span>;
      case 'PENDING_PAYMENT':
        return <span className="badge badge-warning">PENDING</span>;
      case 'CANCELLED':
        return <span className="badge badge-danger">CANCELLED</span>;
      case 'EXPIRED':
        return <span className="badge badge-neutral">EXPIRED</span>;
      default:
        return <span className="badge badge-neutral">{status}</span>;
    }
  };

  const displayOrders = orders.filter(o => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const id = (o._id || '').toLowerCase();
    const email = (o.customerEmail || o.email || '').toLowerCase();
    const name = (o.customerName || '').toLowerCase();
    return id.includes(term) || email.includes(term) || name.includes(term);
  });

  if (loading && orders.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ width: '220px', height: '32px' }} className="skeleton" />
          <div style={{ width: '120px', height: '32px' }} className="skeleton" />
        </div>
        <div style={{ height: '40px' }} className="card skeleton" />
        <div style={{ height: '400px' }} className="card skeleton" />
      </div>
    );
  }

  if (error && orders.length === 0) {
    return (
      <div className="card state-container" style={{ margin: '32px auto', maxWidth: '460px' }}>
        <div className="state-icon" style={{ color: 'var(--danger)', backgroundColor: 'var(--danger-bg)' }}>
          <AlertTriangle size={20} />
        </div>
        <div className="state-title">Orders Retrieval Error</div>
        <div className="state-description">{error}</div>
        <button onClick={fetchOrders} className="btn btn-primary btn-sm" style={{ marginTop: '8px' }}>
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
          <h1 className="page-title">Customer Orders</h1>
          <p className="body-text" style={{ marginTop: '2px' }}>
            Sales orders, checkout payment status, and customer allocation history.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={fetchOrders} className="btn btn-secondary btn-sm" title="Refresh">
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {/* Status Tabs Navigation */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: '0',
        overflowX: 'auto'
      }}>
        {tabs.map((tab) => {
          const isActive = statusFilter === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => handleTabClick(tab.value)}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: isActive ? '2px solid var(--accent-primary)' : '2px solid transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: isActive ? '600' : '400',
                padding: '8px 14px',
                fontSize: '12.5px',
                cursor: 'pointer',
                transition: 'all 0.12s ease',
                whiteSpace: 'nowrap'
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '12px 16px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="search-box" style={{ minWidth: '240px', flex: 1, maxWidth: '380px' }}>
          <Search size={14} />
          <input
            type="text"
            placeholder="Search by Order ID or customer email..."
            className="form-control"
            style={{ height: '34px', fontSize: '12px' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="text-xs">
          Total: <strong style={{ color: 'var(--text-primary)' }}>{pagination.total}</strong> orders recorded
        </div>
      </div>

      {/* Orders Table Container */}
      <div className="table-container">
        {displayOrders.length === 0 ? (
          <div className="state-container" style={{ padding: '40px 20px' }}>
            <div className="state-icon" style={{ width: '40px', height: '40px' }}>
              <ShoppingBag size={20} />
            </div>
            <div className="state-title" style={{ fontSize: '13.5px' }}>
              {orders.length === 0 ? 'No Orders Recorded' : 'No Matching Orders'}
            </div>
            <div className="state-description" style={{ fontSize: '12px' }}>
              {orders.length === 0
                ? 'Storefront purchases placed by customers will automatically populate here.'
                : 'No orders match your active search term or filter.'}
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order Reference</th>
                  <th>Order Date</th>
                  <th>Customer Information</th>
                  <th style={{ textAlign: 'center' }}>Units</th>
                  <th style={{ textAlign: 'right' }}>Total Amount</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayOrders.map((order) => {
                  const itemsCount = order.items ? order.items.reduce((acc, i) => acc + (i.quantity || 1), 0) : 0;

                  return (
                    <tr key={order._id}>
                      <td>
                        <Link
                          to={`/orders/${order._id}`}
                          style={{ fontWeight: '500', color: 'var(--text-primary)' }}
                        >
                          <span className="mono">#{order._id.slice(-6).toUpperCase()}</span>
                        </Link>
                      </td>
                      <td>
                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          {new Date(order.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>
                          {order.customerName || 'Customer'}
                        </div>
                        <div className="mono text-xs" style={{ color: 'var(--text-muted)' }}>
                          {order.customerEmail || '—'}
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="text-xs">
                          {itemsCount} {itemsCount === 1 ? 'unit' : 'units'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: '600' }} className="td-mono">
                        ${Number(order.totalAmount || 0).toFixed(2)}
                      </td>
                      <td>
                        {getStatusBadge(order.status)}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Link
                          to={`/orders/${order._id}`}
                          className="btn btn-secondary btn-sm"
                          style={{ height: '26px', padding: '0 8px', fontSize: '11px' }}
                          title="View Order Details"
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

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '10px 16px',
            borderTop: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-surface-secondary)'
          }}>
            <div className="text-xs">
              Page <strong style={{ color: 'var(--text-primary)' }}>{pagination.page}</strong> of {pagination.totalPages}
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="btn btn-secondary btn-sm"
              >
                <ChevronLeft size={13} /> Previous
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= pagination.totalPages}
                className="btn btn-secondary btn-sm"
              >
                Next <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
