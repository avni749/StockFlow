import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiFetch } from '../../api/apiClient';
import {
  ArrowLeft,
  CreditCard,
  User,
  Calendar,
  AlertTriangle,
  Package
} from 'lucide-react';
import Badge from '../../components/ui/Badge';
import ProductThumbnail from '../../components/ui/ProductThumbnail';

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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1080px' }}>
        <div style={{ width: '140px', height: '24px' }} className="skeleton" />
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1080px' }}>
      <div>
        <Link
          to="/orders"
          className="back-link"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--text-secondary)',
            fontSize: '13px',
            textDecoration: 'none',
            fontWeight: '500'
          }}
        >
          <ArrowLeft size={14} /> Back to Customer Orders
        </Link>
      </div>

      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 className="page-title">Order #{order._id.slice(-6).toUpperCase()}</h1>
            <Badge status={order.status} />
          </div>
          <div className="text-xs" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', color: 'var(--text-muted)' }}>
            <Calendar size={13} />
            <span className="mono">Placed on {new Date(order.createdAt).toLocaleString()}</span>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <span className="text-xs" style={{ color: 'var(--text-muted)', display: 'block' }}>Order Total</span>
          <div className="td-mono" style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)' }}>
            ${Number(order.totalAmount || 0).toFixed(2)}
          </div>
        </div>
      </div>

      {/* Two Column Layout: Line Items on Left, Context on Right */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', alignItems: 'start' }}>
        
        {/* Left Column: Ordered Line Items */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
            <h2 className="section-heading" style={{ fontSize: '15px' }}>Line Items</h2>
            <p className="text-xs" style={{ marginTop: '2px', color: 'var(--text-muted)' }}>
              Products and quantities captured at time of checkout
            </p>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th style={{ textAlign: 'right' }}>Qty</th>
                  <th style={{ textAlign: 'right' }}>Price</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {(order.items || []).map((item, index) => {
                  const lineTotal = (item.quantity || 1) * (item.price || item.sellingPrice || 0);
                  const productInfo = item.productId || {};
                  const productName = item.name || productInfo.name || 'Catalog Item';
                  const productSku = item.SKU || productInfo.SKU || '—';
                  const productImage = item.imageUrl || productInfo.imageUrl;

                  return (
                    <tr key={index}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <ProductThumbnail
                            src={productImage}
                            alt={productName}
                            size="sm"
                          />
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: '500', color: 'var(--text-primary)', fontSize: '13px' }}>
                              {productName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="mono text-xs" style={{ color: 'var(--text-secondary)' }}>
                          {productSku}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }} className="td-mono">
                        {item.quantity || 1}
                      </td>
                      <td style={{ textAlign: 'right' }} className="td-mono">
                        ${Number(item.price || item.sellingPrice || 0).toFixed(2)}
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

        {/* Right Column: Customer, Delivery, Payment & Context */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Customer & Delivery Card */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="card-header" style={{ marginBottom: 0, paddingBottom: '10px', borderBottom: '1px solid var(--border-color)' }}>
              <h3 className="card-title" style={{ fontSize: '14px', textTransform: 'none', color: 'var(--text-primary)' }}>Customer & Delivery</h3>
              <User size={16} color="var(--accent-primary)" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="flex-between">
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Customer Name</span>
                <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>
                  {order.customerName || 'Store Customer'}
                </span>
              </div>

              <div className="flex-between">
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Email Address</span>
                <span className="mono text-xs" style={{ color: order.customerEmail ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                  {order.customerEmail || '—'}
                </span>
              </div>

              <div className="flex-between" style={{ alignItems: 'flex-start' }}>
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Delivery Address</span>
                <span style={{ color: order.deliveryAddress ? 'var(--text-primary)' : 'var(--text-muted)', textAlign: 'right', maxWidth: '220px', fontSize: '13px' }}>
                  {typeof order.deliveryAddress === 'string' ? order.deliveryAddress : JSON.stringify(order.deliveryAddress) || '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Payment & Allocation Card */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="card-header" style={{ marginBottom: 0, paddingBottom: '10px', borderBottom: '1px solid var(--border-color)' }}>
              <h3 className="card-title" style={{ fontSize: '14px', textTransform: 'none', color: 'var(--text-primary)' }}>Payment & Allocation</h3>
              <CreditCard size={16} color="var(--info)" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="flex-between">
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Status</span>
                <Badge status={order.status} />
              </div>

              {order.payment && (
                <div className="flex-between">
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Transaction Status</span>
                  <span className="mono text-xs" style={{ color: 'var(--text-primary)', fontWeight: '500' }}>
                    {order.payment.status || 'VERIFIED'}
                  </span>
                </div>
              )}

              {order.expiresAt && order.status === 'PENDING_PAYMENT' && (
                <div className="flex-between">
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Hold Expiry</span>
                  <span className="mono text-xs" style={{ color: 'var(--warning)', fontWeight: '500' }}>
                    {new Date(order.expiresAt).toLocaleTimeString()}
                  </span>
                </div>
              )}

              <div className="flex-between">
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Order ID</span>
                <span className="mono text-xs" style={{ color: 'var(--text-muted)' }}>
                  {order._id}
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
