import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Link, useSearchParams } from 'react-router-dom';
import { apiFetch } from '../../api/apiClient';
import {
  Package,
  Plus,
  Search,
  Edit,
  Eye,
  RefreshCw,
  AlertTriangle,
  MoreHorizontal,
  Trash2
} from 'lucide-react';
import ProductThumbnail from '../../components/ui/ProductThumbnail';
import Badge from '../../components/ui/Badge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const searchParam = searchParams.get('search') || '';

  const [searchTerm, setSearchTerm] = useState(searchParam);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [activeMenu, setActiveMenu] = useState(null);

  useEffect(() => {
    const handleClose = () => setActiveMenu(null);
    window.addEventListener('click', handleClose);
    window.addEventListener('resize', handleClose);
    window.addEventListener('scroll', handleClose, true);
    return () => {
      window.removeEventListener('click', handleClose);
      window.removeEventListener('resize', handleClose);
      window.removeEventListener('scroll', handleClose, true);
    };
  }, []);

  const toggleMenu = (e, p) => {
    e.stopPropagation();
    const pId = p.id || p._id;
    if (activeMenu?.id === pId) {
      setActiveMenu(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const showAbove = spaceBelow < 110;
    setActiveMenu({
      id: pId,
      product: p,
      top: showAbove ? rect.top - 84 : rect.bottom + 4,
      right: window.innerWidth - rect.right
    });
  };

  useEffect(() => {
    if (searchParam) {
      setSearchTerm(searchParam);
    }
  }, [searchParam]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiFetch('/business/products');
      if (!res.ok) throw new Error('Failed to retrieve product catalog');
      const data = await res.json();
      setProducts(data.products || []);
    } catch (err) {
      setError(err.message || 'Could not load products. Please check connection.');
    } finally {
      setLoading(false);
    }
  };

  const [confirmProduct, setConfirmProduct] = useState(null);
  const [deactivating, setDeactivating] = useState(false);

  const handleConfirmDeactivate = async () => {
    if (!confirmProduct) return;
    try {
      setDeactivating(true);
      const res = await apiFetch(`/business/products/${confirmProduct.id}/deactivate`, {
        method: 'PATCH'
      });
      if (!res.ok) throw new Error('Failed to deactivate product.');
      setProducts(prev => prev.map(prod => (prod.id === confirmProduct.id || prod._id === confirmProduct.id) ? { ...prod, status: 'INACTIVE' } : prod));
      setConfirmProduct(null);
    } catch (err) {
      alert(err.message || 'Deactivation failed');
    } finally {
      setDeactivating(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const categories = useMemo(() => {
    const set = new Set();
    products.forEach(p => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = !searchTerm ||
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.SKU?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
      const matchesCategory = categoryFilter === 'ALL' || p.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [products, searchTerm, statusFilter, categoryFilter]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ width: '220px', height: '32px' }} className="skeleton" />
          <div style={{ width: '130px', height: '32px' }} className="skeleton" />
        </div>
        <div style={{ height: '48px' }} className="card skeleton" />
        <div style={{ height: '400px' }} className="card skeleton" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="card state-container" style={{ margin: '32px auto', maxWidth: '460px' }}>
        <div className="state-icon" style={{ color: 'var(--danger)', backgroundColor: 'var(--danger-bg)' }}>
          <AlertTriangle size={20} />
        </div>
        <div className="state-title">Catalog Error</div>
        <div className="state-description">{error}</div>
        <button onClick={fetchProducts} className="btn btn-primary btn-sm" style={{ marginTop: '8px' }}>
          <RefreshCw size={13} /> Try again
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <h1 className="page-title">Product Catalog</h1>
          <p className="body-text" style={{ marginTop: '2px' }}>
            Active SKU definitions, categories, and unit pricing.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={fetchProducts} className="btn btn-secondary btn-sm" title="Refresh catalog">
            <RefreshCw size={13} />
          </button>
          <Link to="/products/new" className="btn btn-primary btn-sm">
            <Plus size={13} /> Add Product
          </Link>
        </div>
      </div>

      {/* Filter & Search Bar - Single Clean Row */}
      <div className="card" style={{ padding: '12px 16px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', flex: 1 }}>
          <div className="search-box" style={{ minWidth: '240px', flex: 1, maxWidth: '380px' }}>
            <Search size={14} />
            <input
              type="text"
              placeholder="Filter by product name, SKU, or category..."
              className="form-control"
              style={{ height: '34px', fontSize: '12px' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ width: '140px' }}>
            <select
              className="form-control"
              style={{ height: '34px', fontSize: '12px' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          {categories.length > 0 && (
            <div style={{ width: '160px' }}>
              <select
                className="form-control"
                style={{ height: '34px', fontSize: '12px' }}
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="ALL">All Categories</option>
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="text-xs" style={{ whiteSpace: 'nowrap' }}>
          Showing <strong style={{ color: 'var(--text-primary)' }}>{filteredProducts.length}</strong> of {products.length} items
        </div>
      </div>

      {/* Product Table Container */}
      <div className="table-container">
        {filteredProducts.length === 0 ? (
          <div className="state-container" style={{ padding: '40px 20px' }}>
            <div className="state-icon" style={{ width: '40px', height: '40px' }}>
              <Package size={20} />
            </div>
            <div className="state-title" style={{ fontSize: '13.5px' }}>
              {products.length === 0 ? 'No Products in Catalog' : 'No Matching Products'}
            </div>
            <div className="state-description" style={{ fontSize: '12px' }}>
              {products.length === 0
                ? 'Create your first product to start tracking stock and processing purchases.'
                : 'Try adjusting your search query or status filter to locate existing items.'}
            </div>
            {products.length === 0 ? (
              <Link to="/products/new" className="btn btn-primary btn-sm" style={{ marginTop: '8px' }}>
                <Plus size={13} /> Add Product
              </Link>
            ) : (
              <button
                onClick={() => { setSearchTerm(''); setStatusFilter('ALL'); setCategoryFilter('ALL'); }}
                className="btn btn-secondary btn-sm"
                style={{ marginTop: '8px' }}
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th style={{ textAlign: 'right' }}>Unit Price</th>
                  <th style={{ textAlign: 'right' }}>Reorder Threshold</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p) => (
                  <tr key={p.id || p._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <ProductThumbnail src={p.image} alt={p.name} size="md" />
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <Link
                            to={`/products/${p.id || p._id}`}
                            style={{ fontWeight: '500', color: 'var(--text-primary)' }}
                          >
                            {p.name}
                          </Link>
                          {p.description && (
                            <div className="text-xs" style={{ color: 'var(--text-muted)', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {p.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="td-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {p.SKU}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs" style={{ color: p.category ? 'var(--text-secondary)' : 'var(--text-muted)' }}>
                        {p.category || '—'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }} className="td-mono">
                      ${Number(p.sellingPrice || 0).toFixed(2)}
                    </td>
                    <td style={{ textAlign: 'right' }} className="td-mono">
                      <span style={{ color: 'var(--text-secondary)' }}>
                        {p.lowStockThreshold !== null && p.lowStockThreshold !== undefined ? p.lowStockThreshold : 5}
                      </span>
                    </td>
                    <td>
                      <Badge status={p.status} />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', justifyContent: 'flex-end', position: 'relative' }}>
                        <Link
                          to={`/products/${p.id || p._id}`}
                          className="row-view-link"
                          title="View Details"
                        >
                          View
                        </Link>

                        <button
                          type="button"
                          onClick={(e) => toggleMenu(e, p)}
                          title="More actions"
                          aria-label="More actions"
                          style={{
                            padding: '4px',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--text-secondary)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            borderRadius: '4px'
                          }}
                        >
                          <MoreHorizontal size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Unclipped Portal Overflow Menu */}
      {activeMenu && createPortal(
        <div
          className="card"
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: `${activeMenu.top}px`,
            right: `${activeMenu.right}px`,
            minWidth: '130px',
            padding: '4px',
            zIndex: 9999,
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            textAlign: 'left'
          }}
        >
          {activeMenu.product.status === 'ACTIVE' && (
            <Link
              to={`/products/${activeMenu.id}/edit`}
              onClick={() => setActiveMenu(null)}
              className="row-action-menu-item"
            >
              <Edit size={12} /> Edit
            </Link>
          )}
          {activeMenu.product.status === 'ACTIVE' && (
            <button
              type="button"
              onClick={() => {
                setConfirmProduct({ id: activeMenu.id, name: activeMenu.product.name });
                setActiveMenu(null);
              }}
              className="row-action-menu-item danger"
            >
              <Trash2 size={12} /> Deactivate
            </button>
          )}
          {activeMenu.product.status !== 'ACTIVE' && (
            <span style={{ padding: '6px 10px', fontSize: '11px', color: 'var(--text-muted)' }}>
              Archived
            </span>
          )}
        </div>,
        document.body
      )}

      {/* Themed Confirm Dialog */}
      <ConfirmDialog
        isOpen={Boolean(confirmProduct)}
        title="Confirm Product Deactivation"
        description={confirmProduct ? `Are you sure you want to deactivate "${confirmProduct.name}"? Deactivated products cannot be modified or purchased.` : ''}
        confirmText="Deactivate Product"
        cancelText="Cancel"
        variant="danger"
        isLoading={deactivating}
        onConfirm={handleConfirmDeactivate}
        onClose={() => setConfirmProduct(null)}
      />

    </div>
  );
}
