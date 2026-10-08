import { Link, useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { Trash2, ShoppingCart, ArrowRight } from 'lucide-react';

export default function StorefrontCart() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { cart, updateQuantity, removeFromCart, getCartTotal } = useCart();

  if (cart.length === 0) {
    return (
      <div style={{ padding: '64px 24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <ShoppingCart size={64} style={{ margin: '0 auto 24px', opacity: 0.5 }} />
        <h2 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>Your cart is empty</h2>
        <p style={{ fontSize: '16px', marginBottom: '24px' }}>Looks like you haven't added anything yet.</p>
        <Link to={`/${slug}`} style={{ display: 'inline-flex', padding: '12px 24px', backgroundColor: 'var(--accent-lime)', color: 'var(--bg-primary)', borderRadius: '8px', textDecoration: 'none', fontWeight: '600' }}>
          Browse Products
        </Link>
      </div>
    );
  }

  const handleCheckout = () => {
    navigate(`/${slug}/checkout`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '900px', margin: '0 auto' }}>
      
      <div>
        <Link to={`/${slug}`} style={{ color: 'var(--text-secondary)', fontSize: '14px', textDecoration: 'none', marginBottom: '16px', display: 'inline-block' }}>
          &larr; Continue Shopping
        </Link>
        <h1 style={{ fontSize: '32px', fontWeight: '700', letterSpacing: '-1px' }}>Your Cart</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '32px', alignItems: 'start' }}>
        
        {/* Cart Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {cart.map((item) => (
            <div key={item.product.id} style={{ display: 'flex', gap: '16px', padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <div style={{ width: '80px', height: '80px', backgroundColor: 'var(--bg-elevated)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {item.product.image ? (
                  <img src={item.product.image} alt={item.product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <ShoppingCart size={24} opacity={0.3} color="var(--text-secondary)" />
                )}
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 4px 0' }}>{item.product.name}</h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: '"IBM Plex Mono", monospace' }}>SKU: {item.product.SKU}</p>
                  </div>
                  <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontWeight: '600', color: 'var(--accent-lime)' }}>
                    ${(item.product.sellingPrice * item.quantity).toFixed(2)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '4px' }}>
                    <button 
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', borderRadius: '4px' }}
                    >-</button>
                    <span style={{ fontFamily: '"IBM Plex Mono", monospace', width: '24px', textAlign: 'center', fontSize: '14px' }}>{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', borderRadius: '4px' }}
                    >+</button>
                  </div>
                  <button 
                    onClick={() => removeFromCart(item.product.id)}
                    style={{ backgroundColor: 'transparent', border: 'none', color: 'var(--error-color)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '500' }}
                  >
                    <Trash2 size={14} /> Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)', position: 'sticky', top: '100px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Order Summary</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>Subtotal</span>
              <span style={{ fontFamily: '"IBM Plex Mono", monospace' }}>${getCartTotal().toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>Shipping</span>
              <span>Calculated at checkout</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '16px', borderTop: '1px solid var(--border-color)', fontWeight: '700', fontSize: '18px' }}>
              <span>Total</span>
              <span style={{ fontFamily: '"IBM Plex Mono", monospace', color: 'var(--accent-lime)' }}>${getCartTotal().toFixed(2)}</span>
            </div>
          </div>
          <button 
            onClick={handleCheckout}
            style={{ width: '100%', padding: '14px', backgroundColor: 'var(--accent-lime)', color: 'var(--bg-primary)', borderRadius: '8px', fontWeight: '600', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '16px' }}
          >
            Proceed to Checkout <ArrowRight size={18} />
          </button>
        </div>

      </div>
    </div>
  );
}
