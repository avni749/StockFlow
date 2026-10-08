import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { apiFetch } from '../../api/apiClient';
import { ArrowLeft, AlertTriangle, ShieldAlert, Info } from 'lucide-react';
import ProductThumbnail from '../../components/ui/ProductThumbnail';

export default function ProductEdit() {
  const { productId } = useParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    SKU: '',
    sellingPrice: '',
    category: '',
    description: '',
    image: '',
    lowStockThreshold: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const res = await apiFetch(`/business/products/${productId}`);
        if (!res.ok) {
          if (res.status === 404) throw new Error('Product not found in this catalog.');
          throw new Error('Failed to load product specifications.');
        }
        const data = await res.json();
        const p = data.product;
        
        setStatus(p.status);
        
        setFormData({
          name: p.name || '',
          SKU: p.SKU || '',
          sellingPrice: p.sellingPrice !== undefined ? p.sellingPrice : '',
          category: p.category || '',
          description: p.description || '',
          image: p.image || '',
          lowStockThreshold: p.lowStockThreshold !== null && p.lowStockThreshold !== undefined ? p.lowStockThreshold : ''
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [productId]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (status === 'INACTIVE') return;
    
    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        name: formData.name.trim(),
        SKU: formData.SKU.trim(),
        sellingPrice: Number(formData.sellingPrice)
      };
      
      if (formData.category !== undefined) payload.category = formData.category.trim();
      if (formData.description !== undefined) payload.description = formData.description.trim();
      if (formData.image !== undefined) payload.image = formData.image.trim();
      
      // Explicit null handling if cleared
      payload.lowStockThreshold = formData.lowStockThreshold !== '' ? Number(formData.lowStockThreshold) : null;

      const res = await apiFetch(`/business/products/${productId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to update product specifications.');
      }

      navigate(`/products/${productId}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '880px' }}>
        <div style={{ width: '140px', height: '24px' }} className="skeleton" />
        <div style={{ width: '280px', height: '36px' }} className="skeleton" />
        <div style={{ height: '380px' }} className="card skeleton" />
      </div>
    );
  }

  if (status === 'INACTIVE') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '880px' }}>
        <div>
          <Link
            to={`/products/${productId}`}
            className="text-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}
          >
            <ArrowLeft size={14} /> Back to Product Details
          </Link>
        </div>
        <div className="card state-container" style={{ borderColor: 'var(--border-color)', padding: '40px 24px' }}>
          <div className="state-icon" style={{ color: 'var(--danger)', backgroundColor: 'var(--bg-surface-secondary)' }}>
            <ShieldAlert size={22} />
          </div>
          <div className="state-title" style={{ marginTop: '12px' }}>Product is Deactivated</div>
          <div className="state-description" style={{ maxWidth: '420px', margin: '6px auto 16px' }}>
            This SKU is archived in your catalog and marked as INACTIVE. Deactivated records are retained for historical audit compliance and cannot be modified.
          </div>
          <Link to={`/products/${productId}`} className="btn btn-secondary btn-sm">
            View Read-Only Details
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '880px' }}>
      {/* Back Link */}
      <div>
        <Link
          to={`/products/${productId}`}
          className="text-sm"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--text-secondary)',
            fontWeight: '500'
          }}
        >
          <ArrowLeft size={14} /> Back to Product Details
        </Link>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="page-title">Edit Product Specifications</h1>
          <p className="body-text" style={{ marginTop: '2px' }}>
            Update catalog definition, pricing, and notification rules for this SKU.
          </p>
        </div>
        <span className="mono badge badge-neutral" style={{ textTransform: 'none', fontSize: '12px' }}>
          SKU: {formData.SKU || '—'}
        </span>
      </div>

      {error && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 16px',
          backgroundColor: 'var(--danger-bg)',
          border: '1px solid var(--danger-border)',
          color: 'var(--danger)',
          borderRadius: '6px',
          fontSize: '13px'
        }}>
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Section 1: General Product Details */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
            <h2 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
              General Information
            </h2>
            <p className="text-xs" style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>
              Core naming, classification, and unique identification.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="grid-2col">
              <div className="form-group">
                <label className="form-label">Product Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Stock Keeping Unit (SKU) *</label>
                <input
                  type="text"
                  name="SKU"
                  value={formData.SKU}
                  onChange={handleChange}
                  required
                  className="form-control mono"
                />
              </div>
            </div>

            <div className="grid-2col">
              <div className="form-group">
                <label className="form-label">Category</label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Unit Selling Price ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="sellingPrice"
                  value={formData.sellingPrice}
                  onChange={handleChange}
                  required
                  className="form-control mono"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="form-control"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Inventory & Alert Thresholds */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
            <h2 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
              Inventory Control & Alerts
            </h2>
            <p className="text-xs" style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>
              Configure automatic reorder notification thresholds.
            </p>
          </div>

          <div className="grid-2col">
            <div className="form-group">
              <label className="form-label">Low Stock Threshold</label>
              <input
                type="number"
                min="0"
                name="lowStockThreshold"
                placeholder="Leave blank to use organization default (5)"
                value={formData.lowStockThreshold}
                onChange={handleChange}
                className="form-control mono"
              />
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                System triggers warning status when available stock reaches or drops below this count.
              </span>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              padding: '12px',
              backgroundColor: 'var(--bg-surface-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px'
            }}>
              <Info size={16} style={{ color: 'var(--text-secondary)', flexShrink: 0, marginTop: '2px' }} />
              <div className="text-xs" style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Editing thresholds updates real-time stock alert triggers across your dashboard and inventory views.
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Media & Live Image Preview */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
            <h2 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
              Product Media & Live Preview
            </h2>
            <p className="text-xs" style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>
              Update image URL with live preview.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: '20px', alignItems: 'start' }}>
            <div className="form-group">
              <label className="form-label">Image URL</label>
              <input
                type="url"
                name="image"
                value={formData.image}
                onChange={handleChange}
                placeholder="https://images.unsplash.com/photo-..."
                className="form-control"
              />
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Direct image link (JPG, PNG, WebP). Automatic no-referrer bypass and fallback applied.
              </span>
            </div>

            {/* Live Image Preview Container */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <div style={{
                width: '84px',
                height: '84px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-surface-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
              }}>
                <ProductThumbnail
                  src={formData.image}
                  alt={formData.name || 'Preview'}
                  size={82}
                />
              </div>
              <span className="text-xs" style={{ color: 'var(--text-muted)', fontSize: '10.5px' }}>
                Live Preview
              </span>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: '12px',
          paddingTop: '8px'
        }}>
          <Link to={`/products/${productId}`} className="btn btn-secondary btn-sm">
            Cancel
          </Link>
          <button
            type="submit"
            className="btn btn-primary btn-sm"
            disabled={submitting}
          >
            {submitting ? 'Saving Changes...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
