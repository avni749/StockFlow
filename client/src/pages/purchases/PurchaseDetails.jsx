import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiFetch } from '../../api/apiClient';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Calendar,
  Truck,
  PackageCheck,
  AlertTriangle,
  Layers,
  DollarSign
} from 'lucide-react';
import ProductThumbnail from '../../components/ui/ProductThumbnail';
import Badge from '../../components/ui/Badge';

export default function PurchaseDetails() {
  const { purchaseId } = useParams();
  const [purchase, setPurchase] = useState(null);
  const [supplier, setSupplier] = useState(null);
  const [products, setProducts] = useState({});
  const [loading, setLoading] = useState(true);
  const [receiving, setReceiving] = useState(false);
  const [error, setError] = useState(null);

  const fetchPurchase = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await apiFetch(`/business/purchases/${purchaseId}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error('Purchase order not found.');
        throw new Error('Failed to load purchase record.');
      }
      const data = await res.json();
      const p = data.purchase;
      setPurchase(p);

      // Fetch Supplier details
      if (p.supplierId) {
        try {
          const supRes = await apiFetch(`/business/suppliers/${p.supplierId}`);
          if (supRes.ok) {
            const supData = await supRes.json();
            setSupplier(supData.supplier);
          }
        } catch (e) {
          console.warn('Failed to fetch supplier details');
        }
      }

      // Fetch Product details for items mapping
      if (p.items && p.items.length > 0) {
        try {
          const prodRes = await apiFetch('/business/products');
          if (prodRes.ok) {
            const prodData = await prodRes.json();
            const prodMap = {};
            (prodData.products || []).forEach(prod => {
              prodMap[prod.id || prod._id] = prod;
            });
            setProducts(prodMap);
          }
        } catch (e) {
          console.warn('Failed to fetch products for mapping');
        }
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchase();
  }, [purchaseId]);

  const handleReceive = async () => {
    if (!window.confirm("Confirm receiving this purchase? This will permanently add the items to available warehouse inventory and generate inventory movements.")) {
      return;
    }
    
    setReceiving(true);
    setError(null);
    try {
      const res = await apiFetch(`/business/purchases/${purchaseId}/receive`, {
        method: 'POST'
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to receive purchase');
      }
      
      await fetchPurchase();
    } catch (err) {
      setError(err.message);
    } finally {
      setReceiving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '920px' }}>
        <div style={{ width: '120px', height: '24px' }} className="skeleton" />
        <div style={{ width: '300px', height: '40px' }} className="skeleton" />
        <div style={{ height: '360px' }} className="card skeleton" />
      </div>
    );
  }

  if (error || !purchase) {
    return (
      <div className="card state-container" style={{ margin: '40px auto', maxWidth: '500px' }}>
        <div className="state-icon" style={{ color: 'var(--danger)', backgroundColor: 'var(--danger-bg)' }}>
          <AlertTriangle size={24} />
        </div>
        <div className="state-title">Purchase Record Error</div>
        <div className="state-description">{error || 'Purchase order could not be located.'}</div>
        <Link to="/purchases" className="btn btn-secondary btn-sm" style={{ marginTop: '8px' }}>
          <ArrowLeft size={14} /> Back to Purchases
        </Link>
      </div>
    );
  }

  const isReceived = purchase.status === 'RECEIVED';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '960px' }}>
      <div>
        <Link to="/purchases" className="text-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
          <ArrowLeft size={14} /> Back to Purchase Orders
        </Link>
      </div>

      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 className="page-title">PO-{String(purchase.id || purchase._id).slice(-6).toUpperCase()}</h1>
            <Badge status={purchase.status} />
          </div>
          <div className="text-xs" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', color: 'var(--text-secondary)' }}>
            <Calendar size={13} color="var(--text-secondary)" />
            <span>Ordered on {new Date(purchase.createdAt).toLocaleString()}</span>
          </div>
        </div>

        {/* Action Button: Receive stock */}
        {!isReceived && (
          <button
            onClick={handleReceive}
            disabled={receiving}
            className="btn btn-primary"
          >
            <PackageCheck size={16} />
            {receiving ? 'Processing Stock In...' : 'Receive Stock into Warehouse'}
          </button>
        )}
      </div>

      {/* Overview Cards Grid */}
      <div className="grid-2col">
        {/* Supplier Info */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="card-header" style={{ marginBottom: 0, paddingBottom: '10px', borderBottom: '1px solid var(--border-color)' }}>
            <h3 className="card-title">Supplier Information</h3>
            <Truck size={16} color="var(--text-secondary)" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="flex-between">
              <span className="text-sm">Vendor Name</span>
              {supplier ? (
                <Link to={`/suppliers/${supplier.id || supplier._id}`} style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                  {supplier.name}
                </Link>
              ) : (
                <span className="mono text-xs" style={{ color: 'var(--text-secondary)' }}>{purchase.supplierId}</span>
              )}
            </div>

            {supplier?.contactName && (
              <div className="flex-between">
                <span className="text-sm">Contact Person</span>
                <span style={{ color: 'var(--text-primary)' }}>{supplier.contactName}</span>
              </div>
            )}

            {supplier?.email && (
              <div className="flex-between">
                <span className="text-sm">Contact Email</span>
                <span className="mono text-xs" style={{ color: 'var(--text-secondary)' }}>{supplier.email}</span>
              </div>
            )}
          </div>
        </div>

        {/* PO Financial & Status Summary */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="card-header" style={{ marginBottom: 0, paddingBottom: '10px', borderBottom: '1px solid var(--border-color)' }}>
            <h3 className="card-title">Order Financials</h3>
            <DollarSign size={16} color="var(--text-secondary)" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="flex-between">
              <span className="text-sm">Total Purchase Cost</span>
              <span style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                ${Number(purchase.totalCost || 0).toFixed(2)}
              </span>
            </div>

            <div className="flex-between">
              <span className="text-sm">Total Line Items</span>
              <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                {purchase.items?.length || 0} items
              </span>
            </div>

            <div className="flex-between">
              <span className="text-sm">Stock In Status</span>
              <Badge status={purchase.status} />
            </div>
          </div>
        </div>
      </div>

      {/* Itemized Line Items Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
          <h2 className="section-heading" style={{ fontSize: '15px' }}>Procurement Line Items</h2>
          <p className="text-xs" style={{ marginTop: '2px', color: 'var(--text-secondary)' }}>Products and units ordered in this replenishment batch</p>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '48px' }}></th>
                <th>Product Description</th>
                <th>SKU</th>
                <th style={{ textAlign: 'right' }}>Quantity</th>
                <th style={{ textAlign: 'right' }}>Unit Cost</th>
                <th style={{ textAlign: 'right' }}>Line Total</th>
              </tr>
            </thead>
            <tbody>
              {(purchase.items || []).map((item, index) => {
                const prod = products[item.productId];
                const lineTotal = (item.quantity || 0) * (item.purchasePrice || 0);

                return (
                  <tr key={item._id || index}>
                    <td style={{ width: '48px', paddingRight: '0' }}>
                      <ProductThumbnail src={prod?.image} alt={prod?.name || 'Product'} size="md" />
                    </td>
                    <td>
                      {prod ? (
                        <Link to={`/products/${prod.id || prod._id}`} style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                          {prod.name}
                        </Link>
                      ) : (
                        <span className="mono text-xs" style={{ color: 'var(--text-secondary)' }}>{item.productId}</span>
                      )}
                    </td>
                    <td>
                      <span className="mono text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {prod ? prod.SKU : '—'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }} className="td-mono">
                      {item.quantity}
                    </td>
                    <td style={{ textAlign: 'right' }} className="td-mono">
                      ${Number(item.purchasePrice || 0).toFixed(2)}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: '600' }} className="td-mono">
                      ${lineTotal.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
