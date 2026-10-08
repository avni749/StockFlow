import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { apiFetch } from '../../api/apiClient';
import { CreditCard, Lock } from 'lucide-react';

export default function StorefrontCheckout() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { cart, getCartTotal, clearCart } = useCart();
  
  const [customer, setCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: ''
  });

  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  // Load Razorpay Script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  if (cart.length === 0) {
    navigate(`/${slug}`);
    return null;
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCustomer(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    setProcessing(true);
    setError(null);

    try {
      // 1. Create the Order (Reserves Inventory)
      const orderPayload = {
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        deliveryAddress: `${customer.street}, ${customer.city}, ${customer.state} ${customer.zipCode}, ${customer.country}`,
        items: cart.map(item => ({
          productId: item.product.id,
          quantity: item.quantity
        }))
      };

      const orderRes = await apiFetch(`/storefront/${slug}/orders`, {
        method: 'POST',
        body: JSON.stringify(orderPayload)
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.message || 'Failed to place order');
      
      const orderId = orderData.order.id;

      // 2. Initiate Payment
      const payRes = await apiFetch(`/storefront/${slug}/orders/${orderId}/payment/create`, {
        method: 'POST'
      });
      const payData = await payRes.json();
      if (!payRes.ok) throw new Error(payData.message || 'Failed to initiate payment');

      // 3. Open Razorpay Checkout
      const options = {
        key: payData.keyId,
        amount: payData.amount,
        currency: payData.currency,
        name: 'StockFlow Store',
        description: `Order #${orderId.slice(-6).toUpperCase()}`,
        order_id: payData.id,
        handler: async function (response) {
          // 4. Verify Payment on Backend
          try {
            const verifyRes = await apiFetch(`/storefront/${slug}/orders/${orderId}/payment/verify`, {
              method: 'POST',
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });
            
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) throw new Error(verifyData.message || 'Payment verification failed');
            
            // Success
            clearCart();
            navigate(`/${slug}/order-status/${orderId}`);
          } catch (err) {
            setError('Payment verification failed. Please contact support.');
            setProcessing(false);
          }
        },
        prefill: {
          name: customer.name,
          email: customer.email,
          contact: customer.phone
        },
        theme: {
          color: '#D8FF2C'
        },
        modal: {
          ondismiss: function() {
            setProcessing(false);
            setError('Payment cancelled. Your items are reserved temporarily. Please try again.');
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        setProcessing(false);
        setError(response.error.description || 'Payment failed');
      });
      rzp.open();

    } catch (err) {
      setError(err.message);
      setProcessing(false);
    }
  };

  const inputStyles = {
    width: '100%', padding: '10px 14px', backgroundColor: 'var(--bg-primary)',
    border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)',
    fontSize: '14px', outline: 'none', boxSizing: 'border-box'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '900px', margin: '0 auto' }}>
      
      <div>
        <Link to={`/${slug}/cart`} style={{ color: 'var(--text-secondary)', fontSize: '14px', textDecoration: 'none', marginBottom: '16px', display: 'inline-block' }}>
          &larr; Back to Cart
        </Link>
        <h1 style={{ fontSize: '32px', fontWeight: '700', letterSpacing: '-1px' }}>Checkout</h1>
      </div>

      {error && (
        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--error-color)', padding: '16px', borderRadius: '8px', color: 'var(--error-color)' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '32px', alignItems: 'start' }}>
        
        {/* Checkout Form */}
        <form onSubmit={handleCheckoutSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Contact Information</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>Full Name *</label>
                <input type="text" name="name" value={customer.name} onChange={handleInputChange} style={inputStyles} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>Email *</label>
                  <input type="email" name="email" value={customer.email} onChange={handleInputChange} style={inputStyles} required />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>Phone *</label>
                  <input type="tel" name="phone" value={customer.phone} onChange={handleInputChange} style={inputStyles} required />
                </div>
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Shipping Address</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>Street Address *</label>
                <input type="text" name="street" value={customer.street} onChange={handleInputChange} style={inputStyles} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>City *</label>
                  <input type="text" name="city" value={customer.city} onChange={handleInputChange} style={inputStyles} required />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>State/Province *</label>
                  <input type="text" name="state" value={customer.state} onChange={handleInputChange} style={inputStyles} required />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>ZIP/Postal Code *</label>
                  <input type="text" name="zipCode" value={customer.zipCode} onChange={handleInputChange} style={inputStyles} required />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>Country *</label>
                  <input type="text" name="country" value={customer.country} onChange={handleInputChange} style={inputStyles} required />
                </div>
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={processing}
            style={{ width: '100%', padding: '16px', backgroundColor: 'var(--accent-lime)', color: 'var(--bg-primary)', borderRadius: '8px', fontWeight: '700', border: 'none', cursor: processing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '16px', opacity: processing ? 0.7 : 1 }}
          >
            {processing ? 'Processing...' : (
              <>
                <CreditCard size={20} /> Pay ${(getCartTotal()).toFixed(2)} Securely
              </>
            )}
          </button>
          
          <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
            <Lock size={12} /> Payments are processed securely via Razorpay.
          </p>
        </form>

        {/* Order Summary Sidebar */}
        <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)', position: 'sticky', top: '100px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Order Summary</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px', maxHeight: '300px', overflowY: 'auto' }}>
            {cart.map(item => (
              <div key={item.product.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>{item.quantity}x {item.product.name}</span>
                <span style={{ fontFamily: '"IBM Plex Mono", monospace' }}>${(item.product.sellingPrice * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>Subtotal</span>
              <span style={{ fontFamily: '"IBM Plex Mono", monospace' }}>${getCartTotal().toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', fontSize: '18px' }}>
              <span>Total</span>
              <span style={{ fontFamily: '"IBM Plex Mono", monospace', color: 'var(--accent-lime)' }}>${getCartTotal().toFixed(2)}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
