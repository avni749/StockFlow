import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiFetch } from '../../api/apiClient';
import { ArrowLeft, Plus, Trash2, AlertTriangle, Truck, Package, Info } from 'lucide-react';
import ProductThumbnail from '../../components/ui/ProductThumbnail';

export default function PurchaseCreate() {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  
  const [supplierId, setSupplierId] = useState('');
  const [items, setItems] = useState([{ productId: '', quantity: 1, purchasePrice: 0 }]);
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingData(true);
        const [supRes, prodRes] = await Promise.all([
          apiFetch('/business/suppliers'),
          apiFetch('/business/products')
        ]);
        
        if (!supRes.ok || !prodRes.ok) throw new Error('Failed to load active catalog data');
        
        const supData = await supRes.json();
        const prodData = await prodRes.json();
        
        setSuppliers((supData.suppliers || []).filter(s => s.status === 'ACTIVE'));
        setProducts((prodData.products || []).filter(p => p.status === 'ACTIVE'));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, []);

  const addItem = () => {
    setItems([...items, { productId: '', quantity: 1, purchasePrice: 0 }]);
  };

  const removeItem = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  // Compute live order total from existing calculation logic
  const orderTotal = items.reduce((acc, curr) => {
    const q = Number(curr.quantity) || 0;
    const p = Number(curr.purchasePrice) || 0;
    return acc + (q * p);
  }, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!supplierId) {
      setError('Please select an active supplier for this purchase.');
      return;
    }
    
    // Clean up items (ensure types)
    const cleanItems = items.map(item => ({
      productId: item.productId,
      quantity: parseInt(item.quantity, 10),
      purchasePrice: parseFloat(item.purchasePrice)
    }));
    
    // Validation
    if (cleanItems.some(i => !i.productId || i.quantity <= 0 || isNaN(i.purchasePrice) || i.purchasePrice < 0)) {
      setError('Please ensure every line item has a selected product, quantity >= 1, and valid unit cost.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await apiFetch('/business/purchases', {
        method: 'POST',
        body: JSON.stringify({ supplierId, items: cleanItems })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create purchase order.');
      
      navigate(`/purchases/${data.purchase.id || data.purchase._id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingData) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '920px' }}>
        <div style={{ width: '120px', height: '24px' }} className="skeleton" />
        <div style={{ width: '280px', height: '36px' }} className="skeleton" />
        <div style={{ height: '320px' }} className="card skeleton" />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '940px' }}>
      <div>
        <Link
          to="/purchases"
          className="text-sm"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--text-secondary)',
            fontWeight: '500'
          }}
        >
          <ArrowLeft size={14} /> Back to Purchase Orders
        </Link>
      </div>

      <div>
        <h1 className="page-title">Create Purchase Order</h1>
        <p className="body-text" style={{ marginTop: '2px' }}>
          Issue an inventory replenishment order to an authorized supplier.
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
        {/* SECTION 1: SUPPLIER */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
            <div>
              <h2 style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--text-primary)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Supplier
              </h2>
              <p className="text-xs" style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>
                Select the procurement vendor fulfilling this replenishment batch.
              </p>
            </div>
            <Truck size={16} style={{ color: 'var(--text-secondary)' }} />
          </div>

          <div className="form-group" style={{ maxWidth: '480px' }}>
            <label className="form-label">Procurement Supplier / Vendor *</label>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              required
              className="form-control"
            >
              <option value="">-- Choose an active vendor --</option>
              {suppliers.map(s => (
                <option key={s.id || s._id} value={s.id || s._id}>
                  {s.name} {s.contactName ? `(${s.contactName})` : ''}
                </option>
              ))}
            </select>
            {suppliers.length === 0 && (
              <span className="text-xs" style={{ color: 'var(--warning)', marginTop: '4px', display: 'block' }}>
                No active suppliers found. Please <Link to="/suppliers/new" style={{ color: 'var(--copper)', textDecoration: 'underline' }}>Add Supplier</Link> first.
              </span>
            )}
          </div>
        </div>

        {/* SECTION 2: ORDER ITEMS */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
            <div>
              <h2 style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--text-primary)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Order Items
              </h2>
              <p className="text-xs" style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>
                Specify catalog products, order quantities, and agreed unit purchase costs.
              </p>
            </div>
            <button
              type="button"
              onClick={addItem}
              className="btn btn-secondary btn-sm"
            >
              <Plus size={13} /> Add Line Item
            </button>
          </div>

          {/* Line Items Table */}
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th style={{ width: '45%' }}>Product</th>
                  <th style={{ width: '15%', textAlign: 'right' }}>Qty</th>
                  <th style={{ width: '20%', textAlign: 'right' }}>Unit Cost</th>
                  <th style={{ width: '15%', textAlign: 'right' }}>Total</th>
                  <th style={{ width: '5%', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => {
                  const lineTotal = (Number(item.quantity) || 0) * (Number(item.purchasePrice) || 0);
                  const selectedProd = products.find(p => (p.id || p._id) === item.productId);

                  return (
                    <tr key={index}>
                      {/* PRODUCT */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <ProductThumbnail
                            src={selectedProd?.image}
                            alt={selectedProd?.name || 'Item'}
                            size="sm"
                          />
                          <div style={{ flex: 1, minWidth: '180px' }}>
                            <select
                              value={item.productId}
                              onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                              required
                              className="form-control"
                              style={{ height: '34px', fontSize: '12.5px' }}
                            >
                              <option value="">Select product...</option>
                              {products.map(p => (
                                <option key={p.id || p._id} value={p.id || p._id}>
                                  {p.name} ({p.SKU})
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </td>

                      {/* QTY */}
                      <td style={{ textAlign: 'right' }}>
                        <input
                          type="number"
                          min="1"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          required
                          className="form-control mono"
                          style={{ height: '34px', fontSize: '12.5px', textAlign: 'right' }}
                        />
                      </td>

                      {/* UNIT COST */}
                      <td style={{ textAlign: 'right' }}>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={item.purchasePrice}
                          onChange={(e) => handleItemChange(index, 'purchasePrice', e.target.value)}
                          required
                          className="form-control mono"
                          style={{ height: '34px', fontSize: '12.5px', textAlign: 'right' }}
                        />
                      </td>

                      {/* TOTAL */}
                      <td style={{ textAlign: 'right' }} className="td-mono">
                        <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                          ${lineTotal.toFixed(2)}
                        </span>
                      </td>

                      {/* ACTION */}
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          disabled={items.length === 1}
                          title="Remove Line"
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: items.length === 1 ? 'not-allowed' : 'pointer',
                            color: items.length === 1 ? 'var(--text-muted)' : 'var(--danger)',
                            padding: '4px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            borderRadius: '4px'
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Order Total Summary Banner */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'baseline',
            gap: '14px',
            marginTop: '16px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-color)'
          }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Order Total:
            </span>
            <span style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
              ${orderTotal.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Form Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '4px' }}>
          <Link to="/purchases" className="btn btn-secondary btn-sm">
            Cancel
          </Link>
          <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
            {submitting ? 'Generating Purchase Order...' : 'Submit Purchase Order'}
          </button>
        </div>
      </form>
    </div>
  );
}
