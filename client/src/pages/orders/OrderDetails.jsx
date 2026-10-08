import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiFetch } from '../../api/apiClient';
import {
  ArrowLeft,
  CreditCard,
  Truck,
  User,
  Clock,
  Calendar,
  AlertTriangle,
  Package,
  DollarSign,
  CheckCircle2
} from 'lucide-react';

export default function OrderDetails() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const res = await apiFetch(`/business/orders/${orderId}`);
        if (!res.ok) {
          if (res.status === 404) throw new Error('Order not found.');
          throw new Error('Failed to load order details.');
        }
        const data = await res.json();
        setOrder(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '960px' }}>
        <div style={{ width: '120px', height: '24px' }} className="skeleton" />
        <div style={{ width: '280px', height: '36px' }} className="skeleton" />
        <div style={{ height: '360px' }} className="card skeleton" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="card state-container" style={{ margin: '40px auto', maxWidth: '500px' }}>
        <div className="state-icon" style={{ color: 'var(--danger)', backgroundColor: 'var(--danger-bg)' }}>
          <AlertTriangle size={24} />
        </div>
        <div className="state-title">Order Record Error</div>
        <div className="state-description">{error || 'Order could not be located.'}</div>
        <Link to="/orders" className="btn btn-secondary btn-sm" style={{ marginTop: '8px' }}>
          <ArrowLeft size={14} /> Back to Orders
        </Link>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PAID':
        return <span className="badge badge-success">Paid & Confirmed</span>;
      case 'PENDING_PAYMENT':
        return <span className="badge badge-warning">Awaiting Payment</span>;
      case 'CANCELLED':
        return <span className="badge badge-danger">Cancelled</span>;
      case 'EXPIRED':
        return <span className="badge badge-neutral">Expired</span>;
      default:
        return <span className="badge badge-neutral">{status}</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '960px' }}>
      <div>
        <Link to="/orders" className="text-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
          <ArrowLeft size={14} /> Back to Customer Orders
        </Link>
      </div>

      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 className="page-title">Order #{order._id.slice(-6).toUpperCase()}</h1>
            {getStatusBadge(order.status)}
          </div>
          <div className="text-xs" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
            <Calendar size={13} color="var(--text-muted)" />
            <span>Placed on {new Date(order.createdAt).toLocaleString()}</span>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Total Amount</span>
          <div className="mono" style={{ fontSize: '24px', fontWeight: '700', color: 'var(--accent-primary)' }}>
            ${Number(order.totalAmount || 0).toFixed(2)}
          </div>
        </div>
      </div>

      {/* Order Context Cards */}
      <div className="grid-2col">
        {/* Customer & Delivery Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="card-header" style={{ marginBottom: 0, paddingBottom: '10px', borderBottom: '1px solid var(--border-color)' }}>
            <h3 className="card-title">Customer & Delivery</h3>
            <User size={16} color="var(--accent-primary)" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="flex-between">
              <span className="text-sm">Customer Name</span>
              <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                {order.customerName || 'Anonymous Customer'}
              </span>
            </div>

            <div className="flex-between">
              <span className="text-sm">Email Address</span>
              <span className="mono text-sm" style={{ color: order.customerEmail ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                {order.customerEmail || '—'}
              </span>
            </div>

            <div className="flex-between">
              <span className="text-sm">Delivery Address</span>
              <span style={{ color: order.deliveryAddress ? 'var(--text-primary)' : 'var(--text-muted)', textAlign: 'right', maxWidth: '240px' }}>
                {typeof order.deliveryAddress === 'string' ? order.deliveryAddress : JSON.stringify(order.deliveryAddress) || '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Payment & Reservation Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="card-header" style={{ marginBottom: 0, paddingBottom: '10px', borderBottom: '1px solid var(--border-color)' }}>
            <h3 className="card-title">Payment & Reservation</h3>
            <CreditCard size={16} color="var(--info)" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="flex-between">
              <span className="text-sm">Payment Status</span>
              {getStatusBadge(order.status)}
            </div>

            {order.payment && (
              <div className="flex-between">
                <span className="text-sm">Transaction Status</span>
                <span className="badge badge-neutral mono" style={{ textTransform: 'none' }}>
                  {order.payment.status || 'VERIFIED'}
                </span>
              </div>
            )}

            {order.expiresAt && order.status === 'PENDING_PAYMENT' && (
              <div className="flex-between">
                <span className="text-sm">Reservation Window</span>
                <span className="mono text-xs" style={{ color: 'var(--warning)' }}>
                  Expires {new Date(order.expiresAt).toLocaleTimeString()}
                </span>
              </div>
            )}

            <div className="flex-between">
              <span className="text-sm">Order Reference ID</span>
              <span className="mono text-xs" style={{ color: 'var(--text-muted)' }}>
                {order._id}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Itemized Order Products */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
          <h2 className="section-heading" style={{ fontSize: '15px' }}>Ordered Products</h2>
          <p className="text-xs" style={{ marginTop: '2px' }}>Items and quantities captured at time of checkout</p>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Product Description</th>
                <th>SKU</th>
                <th style={{ textAlign: 'right' }}>Quantity</th>
                <th style={{ textAlign: 'right' }}>Unit Price</th>
                <th style={{ textAlign: 'right' }}>Line Total</th>
              </tr>
            </thead>
            <tbody>
              {(order.items || []).map((item, index) => {
                const lineTotal = (item.quantity || 1) * (item.price || 0);

                return (
                  <tr key={index}>
                    <td>
                      <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                        {item.name || 'Catalog Item'}
                      </div>
                    </td>
                    <td>
                      <span className="mono badge badge-neutral text-xs" style={{ textTransform: 'none' }}>
                        {item.SKU || '—'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }} className="td-mono">
                      {item.quantity || 1}
                    </td>
                    <td style={{ textAlign: 'right' }} className="td-mono">
                      ${Number(item.price || 0).toFixed(2)}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: '600' }} className="td-mono">
                      ${lineTotal.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
