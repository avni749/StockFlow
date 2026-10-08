import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiFetch } from '../../api/apiClient';
import { CheckCircle, Clock, XCircle, ShoppingBag } from 'lucide-react';

export default function StorefrontOrderStatus() {
  const { slug, orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const res = await apiFetch(`/storefront/${slug}/orders/${orderId}`);
        if (!res.ok) {
          if (res.status === 404) throw new Error('Order not found');
          throw new Error('Failed to load order status');
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
  }, [slug, orderId]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid var(--border-color)', borderTopColor: 'var(--accent-lime)', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div style={{ padding: '64px 24px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '24px', color: 'var(--error-color)', marginBottom: '16px' }}>{error || 'Order not found'}</h2>
        <Link to={`/${slug}`} style={{ color: 'var(--accent-lime)', textDecoration: 'none' }}>Return to Store</Link>
      </div>
    );
  }

  const isPaid = order.status === 'PAID';
  const isCancelled = order.status === 'CANCELLED' || order.status === 'EXPIRED';

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      <div style={{ textAlign: 'center', backgroundColor: 'var(--bg-secondary)', padding: '48px 32px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
        {isPaid ? (
          <CheckCircle size={64} color="var(--accent-lime)" style={{ margin: '0 auto 16px' }} />
        ) : isCancelled ? (
          <XCircle size={64} color="var(--error-color)" style={{ margin: '0 auto 16px' }} />
        ) : (
          <Clock size={64} color="var(--warning-color, #F59E0B)" style={{ margin: '0 auto 16px' }} />
        )}
        
        <h1 style={{ fontSize: '32px', fontWeight: '700', letterSpacing: '-1px', marginBottom: '8px' }}>
          {isPaid ? 'Payment Successful!' : isCancelled ? 'Order Cancelled' : 'Order Pending'}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '16px', marginBottom: '24px' }}>
          Thank you, {order.customerName}. Your order <span style={{ fontFamily: '"IBM Plex Mono", monospace', color: 'var(--text-primary)' }}>#{order._id.slice(-6).toUpperCase()}</span> has been placed.
        </p>

        <Link to={`/${slug}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', backgroundColor: 'transparent', color: 'var(--text-primary)', borderRadius: '8px', textDecoration: 'none', fontWeight: '600', border: '1px solid var(--border-color)' }}>
          <ShoppingBag size={18} /> Continue Shopping
        </Link>
      </div>

      <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Order Details</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Status</span>
            <span style={{ fontWeight: '600', color: isPaid ? 'var(--accent-lime)' : isCancelled ? 'var(--error-color)' : 'var(--warning-color, #F59E0B)' }}>
              {order.status.replace('_', ' ')}
            </span>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Email Receipt To</span>
            <span>{order.customerEmail}</span>
          </div>

          <div>
            <h3 style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px' }}>Items</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {order.items.map(item => (
                <div key={item._id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                  <span>{item.quantity}x {item.productId?.name || 'Product'}</span>
                  <span style={{ fontFamily: '"IBM Plex Mono", monospace' }}>${(item.priceSnapshot * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '16px', borderTop: '1px solid var(--border-color)', fontWeight: '700', fontSize: '18px' }}>
            <span>Total Paid</span>
            <span style={{ fontFamily: '"IBM Plex Mono", monospace', color: 'var(--accent-lime)' }}>${order.totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>

    </div>
  );
}
