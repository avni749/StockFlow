import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiFetch } from '../../api/apiClient';
import { ArrowLeft, AlertTriangle, Package, ImageIcon, Info } from 'lucide-react';
import ProductThumbnail from '../../components/ui/ProductThumbnail';

export default function ProductCreate() {
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
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        name: formData.name.trim(),
        SKU: formData.SKU.trim(),
        sellingPrice: Number(formData.sellingPrice)
      };
      
      if (formData.category?.trim()) payload.category = formData.category.trim();
      if (formData.description?.trim()) payload.description = formData.description.trim();
      if (formData.image?.trim()) payload.image = formData.image.trim();
      if (formData.lowStockThreshold !== '') payload.lowStockThreshold = Number(formData.lowStockThreshold);

      const res = await apiFetch('/business/products', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to create product definition.');
      }

      navigate(`/products/${data.product.id || data.product._id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '880px' }}>
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
      <div>
        <h1 className="page-title">Create New Product</h1>
        <p className="body-text" style={{ marginTop: '2px' }}>
          Define a new catalog SKU, pricing rules, and stock threshold specifications.
        </p>
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
                  placeholder="e.g. Wireless Barcode Scanner"
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
                  placeholder="e.g. WBS-GEN2-001"
                  value={formData.SKU}
                  onChange={handleChange}
                  required
                  className="form-control mono"
                />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Must be unique across your organization.
                </span>
              </div>
            </div>

            <div className="grid-2col">
              <div className="form-group">
                <label className="form-label">Category</label>
                <input
                  type="text"
                  name="category"
                  placeholder="e.g. Hardware, Electronics, Apparel"
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
                  placeholder="e.g. 149.99"
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
                placeholder="Detailed specifications, storage notes, or vendor details..."
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
                Stock levels are managed via Purchases and Inventory adjustments. Creating a product defines the catalog SKU specification.
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
              Provide a direct image URL. Supports Unsplash, CDN, or cloud storage links.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: '20px', alignItems: 'start' }}>
            <div className="form-group">
              <label className="form-label">Image URL</label>
              <input
                type="url"
                name="image"
                placeholder="https://images.unsplash.com/photo-..."
                value={formData.image}
                onChange={handleChange}
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
          <Link to="/products" className="btn btn-secondary btn-sm">
            Cancel
          </Link>
          <button
            type="submit"
            className="btn btn-primary btn-sm"
            disabled={submitting}
          >
            {submitting ? 'Creating Product...' : 'Save Product Definition'}
          </button>
        </div>
      </form>
    </div>
  );
}
