import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiFetch } from '../../api/apiClient';
import { useCart } from '../../context/CartContext';
import { ShoppingBag, Plus } from 'lucide-react';
import ProductThumbnail from '../../components/ui/ProductThumbnail';

export default function StorefrontCatalog() {
  const { slug } = useParams();
  const { addToCart, cart } = useCart();
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const res = await apiFetch(`/storefront/${slug}/products`);
        if (!res.ok) throw new Error('Failed to load products');
        const data = await res.json();
        setProducts(data.products || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [slug]);

  if (loading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{ height: '320px', backgroundColor: 'var(--bg-elevated)', borderRadius: '12px', animation: 'pulse 1.5s infinite opacity' }}></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '24px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--error-color)', borderRadius: '8px', border: '1px solid var(--error-color)' }}>
        {error}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div style={{ padding: '64px 24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <ShoppingBag size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
        <p style={{ fontSize: '18px' }}>No products available yet.</p>
        <p style={{ fontSize: '14px', marginTop: '8px' }}>Check back later!</p>
      </div>
    );
  }

  const getQuantityInCart = (productId) => {
    const item = cart.find(i => i.product.id === productId);
    return item ? item.quantity : 0;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <h1 style={{ fontSize: '32px', fontWeight: '700', letterSpacing: '-1px', marginBottom: '8px' }}>Products</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Browse our catalog and add items to your cart.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
        {products.map((product) => {
          const qtyInCart = getQuantityInCart(product.id);
          
          return (
            <div key={product.id} style={{ backgroundColor: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-color)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ height: '200px', backgroundColor: 'var(--bg-surface-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ProductThumbnail src={product.image} alt={product.name} size="full" style={{ border: 'none', borderRadius: 0 }} />
              </div>
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0, lineHeight: 1.2 }}>{product.name}</h3>
                  <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontWeight: '700', fontSize: '18px', color: 'var(--accent-lime)' }}>
                    ${product.sellingPrice.toFixed(2)}
                  </span>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '12px', fontFamily: '"IBM Plex Mono", monospace', marginBottom: '12px' }}>SKU: {product.SKU}</p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', flex: 1, marginBottom: '24px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {product.description || 'No description provided.'}
                </p>
                
                <button 
                  onClick={() => addToCart(product)}
                  style={{ 
                    width: '100%', padding: '12px', borderRadius: '8px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', border: 'none',
                    backgroundColor: qtyInCart > 0 ? 'var(--bg-elevated)' : 'var(--text-primary)',
                    color: qtyInCart > 0 ? 'var(--accent-lime)' : 'var(--bg-primary)',
                    transition: 'all 0.2s'
                  }}
                >
                  {qtyInCart > 0 ? (
                    `In Cart (${qtyInCart}) - Add More`
                  ) : (
                    <>
                      <Plus size={18} /> Add to Cart
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
