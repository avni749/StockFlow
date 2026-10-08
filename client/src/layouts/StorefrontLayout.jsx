import { useState, useEffect } from 'react';
import { Outlet, useParams, Link } from 'react-router-dom';
import { CartProvider, useCart } from '../context/CartContext';
import { ShoppingCart } from 'lucide-react';
import { apiFetch } from '../api/apiClient';
import ThemeToggle from '../components/ui/ThemeToggle';

function StorefrontHeader({ storefront }) {
  const { slug } = useParams();
  const { cart } = useCart();
  
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      padding: '16px 32px', 
      backgroundColor: 'var(--bg-elevated)', 
      borderBottom: '1px solid var(--border-color)',
      position: 'sticky',
      top: 0,
      zIndex: 50
    }}>
      <Link to={`/${slug}`} style={{ textDecoration: 'none', color: 'var(--text-primary)', fontSize: '20px', fontWeight: '700', letterSpacing: '-0.5px' }}>
        {storefront ? storefront.name : 'Storefront'}
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <ThemeToggle />
        <Link to={`/${slug}/cart`} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: 'var(--bg-surface-secondary)', borderRadius: '24px', textDecoration: 'none', color: 'var(--text-primary)', border: '1px solid var(--border-color)', position: 'relative' }}>
          <ShoppingCart size={18} />
          <span style={{ fontWeight: '600', fontFamily: '"IBM Plex Mono", monospace' }}>Cart</span>
          {itemCount > 0 && (
            <span style={{ 
              position: 'absolute', top: '-8px', right: '-8px', 
              backgroundColor: 'var(--copper-primary)', color: 'var(--on-copper)', 
              fontSize: '12px', fontWeight: '700', width: '20px', height: '20px', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' 
            }}>
              {itemCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}

export default function StorefrontLayout() {
  const { slug } = useParams();
  const [storefront, setStorefront] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStorefront = async () => {
      try {
        setLoading(true);
        const res = await apiFetch(`/storefront/${slug}`);
        if (!res.ok) {
          if (res.status === 404) throw new Error('Storefront not found');
          throw new Error('Failed to load storefront');
        }
        const data = await res.json();
        setStorefront(data.storefront);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStorefront();
  }, [slug]);

  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: '16px', backgroundColor: 'var(--bg-primary)' }}>
        <div style={{ fontSize: '48px' }}>🛍️</div>
        <h1 style={{ fontSize: '24px', color: 'var(--error-color)' }}>{error}</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Please check the URL and try again.</p>
      </div>
    );
  }

  return (
    <CartProvider>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
        <StorefrontHeader storefront={storefront} />
        <main style={{ flex: 1, padding: '32px', maxWidth: '1200px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid var(--border-color)', borderTopColor: 'var(--accent-lime)', animation: 'spin 1s linear infinite' }}></div>
            </div>
          ) : (
            <Outlet context={{ storefront }} />
          )}
        </main>
        <footer style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-color)', fontSize: '14px' }}>
          &copy; {new Date().getFullYear()} {storefront?.name || 'Storefront'}. Powered by StockFlow.
        </footer>
      </div>
    </CartProvider>
  );
}
