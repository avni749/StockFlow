import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiFetch } from '../../api/apiClient';
import { useAuth } from '../../context/AuthContext';
import {
  ArrowLeft,
  Edit,
  Trash2,
  DollarSign,
  AlertTriangle,
  Clock,
  ShieldAlert,
  Layers,
  Info
} from 'lucide-react';
import ProductThumbnail from '../../components/ui/ProductThumbnail';
import Badge from '../../components/ui/Badge';

export default function ProductDetails() {
  const { productId } = useParams();
  const { user } = useAuth();
  const isAdmin = user?.role === 'BUSINESS_ADMIN';

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showConfirm, setShowConfirm] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiFetch(`/business/products/${productId}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error('Product not found in this organization');
        throw new Error('Failed to fetch product details');
      }
      const data = await res.json();
      setProduct(data.product);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const handleDeactivate = async () => {
    try {
      setDeactivating(true);
      const res = await apiFetch(`/business/products/${productId}/deactivate`, {
        method: 'PATCH'
      });
      if (!res.ok) throw new Error('Failed to deactivate product.');
      const data = await res.json();
      setProduct(data.product);
      setShowConfirm(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setDeactivating(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '960px' }}>
        <div style={{ width: '140px', height: '24px' }} className="skeleton" />
        <div style={{ width: '320px', height: '40px' }} className="skeleton" />
        <div style={{ height: '320px' }} className="card skeleton" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="card state-container" style={{ margin: '40px auto', maxWidth: '480px', padding: '36px 24px' }}>
        <div className="state-icon" style={{ color: 'var(--danger)', backgroundColor: 'var(--danger-bg)' }}>
          <AlertTriangle size={22} />
        </div>
        <div className="state-title" style={{ marginTop: '12px' }}>Product Not Found</div>
        <div className="state-description" style={{ margin: '6px 0 16px' }}>
          {error || 'The requested product could not be located in your organization.'}
        </div>
        <Link to="/products" className="btn btn-secondary btn-sm">
          <ArrowLeft size={14} /> Back to Catalog
        </Link>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '960px' }}>
      {/* Back Link */}
      <div>
        <Link
          to="/products"
          className="text-sm"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--text-secondary)',
            fontWeight: '500'
          }}
        >
          <ArrowLeft size={14} /> Back to Product Catalog
        </Link>
      </div>

      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '16px',
        paddingBottom: '4px'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h1 className="page-title">{product.name}</h1>
            <Badge status={product.status} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span className="td-mono text-xs" style={{ color: 'var(--text-secondary)', backgroundColor: 'var(--bg-surface-secondary)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
              SKU: {product.SKU}
            </span>
            {product.category && (
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Category: <strong style={{ color: 'var(--text-primary)' }}>{product.category}</strong>
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {product.status === 'ACTIVE' && (
            <Link to={`/products/${product.id || product._id}/edit`} className="btn btn-secondary btn-sm">
              <Edit size={13} /> Edit Product
            </Link>
          )}

          {isAdmin && product.status === 'ACTIVE' && (
            <button onClick={() => setShowConfirm(true)} className="btn btn-danger btn-sm">
              <Trash2 size={13} /> Deactivate
            </button>
          )}
        </div>
      </div>

      {/* Deactivation Confirmation Warning Box */}
      {showConfirm && (
        <div className="card" style={{
          borderColor: 'var(--danger-border)',
          backgroundColor: 'var(--danger-bg)',
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ShieldAlert size={20} color="var(--danger)" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: '600', color: 'var(--danger)', fontSize: '13px' }}>
                Confirm Product Deactivation
              </div>
              <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Deactivated SKUs are archived for audit compliance and cannot be updated, purchased, or sold.
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setShowConfirm(false)} className="btn btn-secondary btn-sm" disabled={deactivating}>
              Cancel
            </button>
            <button onClick={handleDeactivate} className="btn btn-danger btn-sm" disabled={deactivating}>
              {deactivating ? 'Deactivating...' : 'Confirm Deactivation'}
            </button>
          </div>
        </div>
      )}

      {/* Main Details Grid */}
      <div className="grid-2col">
        {/* Left Column: Product Media & Description */}
        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
            <h2 style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
              Visual Asset & Overview
            </h2>
            <Layers size={15} style={{ color: 'var(--text-secondary)' }} />
          </div>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <ProductThumbnail
              src={product.image}
              alt={product.name}
              size="xl"
              style={{ borderRadius: '8px' }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
              <div className="text-xs" style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>
                Description
              </div>
              <p className="body-text" style={{
                fontSize: '12.5px',
                lineHeight: '1.6',
                color: product.description ? 'var(--text-primary)' : 'var(--text-muted)',
                margin: 0,
                whiteSpace: 'pre-wrap'
              }}>
                {product.description || 'No description recorded for this product.'}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Pricing & Alert Specs */}
        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
            <h2 style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
              Pricing & Alert Thresholds
            </h2>
            <DollarSign size={15} style={{ color: 'var(--text-secondary)' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="flex-between">
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Unit Selling Price</span>
              <span className="td-mono" style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>
                ${Number(product.sellingPrice || 0).toFixed(2)}
              </span>
            </div>

            <div className="flex-between">
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Low Stock Threshold</span>
              <span className="td-mono text-xs">
                {product.lowStockThreshold !== null && product.lowStockThreshold !== undefined ? (
                  <span style={{ color: 'var(--warning)', fontWeight: '600' }}>
                    &le; {product.lowStockThreshold} units
                  </span>
                ) : (
                  <span style={{ color: 'var(--text-muted)' }}>Default (5 units)</span>
                )}
              </span>
            </div>

            <div className="flex-between">
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Status</span>
              <Badge status={product.status} />
            </div>
          </div>
        </div>
      </div>

      {/* Metadata & Audit Information */}
      <div className="card" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <Clock size={14} style={{ color: 'var(--text-secondary)' }} />
          <h2 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
            Audit & System Metadata
          </h2>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          fontSize: '12px'
        }}>
          <div>
            <div style={{ color: 'var(--text-secondary)', marginBottom: '3px' }}>Created Date</div>
            <div className="td-mono" style={{ color: 'var(--text-primary)' }}>
              {product.createdAt ? new Date(product.createdAt).toLocaleString() : '—'}
            </div>
          </div>

          <div>
            <div style={{ color: 'var(--text-secondary)', marginBottom: '3px' }}>Last Updated</div>
            <div className="td-mono" style={{ color: 'var(--text-primary)' }}>
              {product.updatedAt ? new Date(product.updatedAt).toLocaleString() : '—'}
            </div>
          </div>

          <div>
            <div style={{ color: 'var(--text-secondary)', marginBottom: '3px' }}>System Identifier</div>
            <div className="td-mono text-xs" style={{ color: 'var(--text-muted)' }}>
              {product.id || product._id}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
