import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiFetch } from '../../api/apiClient';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Truck,
  Mail,
  Phone,
  MapPin,
  Clock,
  ShieldAlert,
  AlertTriangle,
  User
} from 'lucide-react';
import Badge from '../../components/ui/Badge';

export default function SupplierDetails() {
  const { supplierId } = useParams();

  const [supplier, setSupplier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showConfirm, setShowConfirm] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  const fetchSupplier = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiFetch(`/business/suppliers/${supplierId}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error('Supplier not found in your directory.');
        throw new Error('Failed to fetch supplier details.');
      }
      const data = await res.json();
      setSupplier(data.supplier);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSupplier();
  }, [supplierId]);

  const handleDeactivate = async () => {
    try {
      setDeactivating(true);
      const res = await apiFetch(`/business/suppliers/${supplierId}/deactivate`, {
        method: 'PATCH'
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to deactivate supplier.');
      }
      
      setSupplier(data.supplier);
      setShowConfirm(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setDeactivating(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '840px' }}>
        <div style={{ width: '120px', height: '24px' }} className="skeleton" />
        <div style={{ width: '280px', height: '36px' }} className="skeleton" />
        <div style={{ height: '300px' }} className="card skeleton" />
      </div>
    );
  }

  if (error || !supplier) {
    return (
      <div className="card state-container" style={{ margin: '40px auto', maxWidth: '500px' }}>
        <div className="state-icon" style={{ color: 'var(--danger)', backgroundColor: 'var(--danger-bg)' }}>
          <AlertTriangle size={24} />
        </div>
        <div className="state-title">Supplier Error</div>
        <div className="state-description">{error || 'Supplier details could not be loaded.'}</div>
        <Link to="/suppliers" className="btn btn-secondary btn-sm" style={{ marginTop: '8px' }}>
          <ArrowLeft size={14} /> Back to Suppliers
        </Link>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '880px' }}>
      <div>
        <Link to="/suppliers" className="text-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
          <ArrowLeft size={14} /> Back to Supplier Directory
        </Link>
      </div>

      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 className="page-title">{supplier.name}</h1>
            <Badge status={supplier.status} />
          </div>
          {supplier.contactName && (
            <p className="body-text" style={{ marginTop: '4px' }}>
              Primary Contact: <strong style={{ color: 'var(--text-primary)' }}>{supplier.contactName}</strong>
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {supplier.status === 'ACTIVE' && (
            <Link to={`/suppliers/${supplier.id || supplier._id}/edit`} className="btn btn-secondary btn-sm">
              <Edit size={14} /> Edit Supplier
            </Link>
          )}

          {supplier.status === 'ACTIVE' && (
            <button onClick={() => setShowConfirm(true)} className="btn btn-danger btn-sm">
              <Trash2 size={14} /> Deactivate
            </button>
          )}
        </div>
      </div>

      {/* Confirmation Banner */}
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
            <ShieldAlert size={22} color="var(--danger)" />
            <div>
              <div style={{ fontWeight: '600', color: 'var(--danger)' }}>Confirm Supplier Deactivation</div>
              <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Deactivated suppliers cannot be assigned to new purchase orders.
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setShowConfirm(false)} className="btn btn-secondary btn-sm" disabled={deactivating}>
              Cancel
            </button>
            <button onClick={handleDeactivate} className="btn btn-danger btn-sm" disabled={deactivating}>
              {deactivating ? 'Deactivating...' : 'Confirm Deactivation'}
            </button>
          </div>
        </div>
      )}

      {/* Details Grid */}
      <div className="grid-2col">
        {/* Contact Info Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card-header" style={{ marginBottom: 0, paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
            <h3 className="card-title">Contact & Communication</h3>
            <User size={16} color="var(--text-secondary)" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="flex-between">
              <span className="text-sm">Contact Name</span>
              <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                {supplier.contactName || '—'}
              </span>
            </div>

            <div className="flex-between">
              <span className="text-sm">Email Address</span>
              <span className="mono text-sm" style={{ color: supplier.email ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                {supplier.email || '—'}
              </span>
            </div>

            <div className="flex-between">
              <span className="text-sm">Phone Number</span>
              <span className="mono text-sm" style={{ color: supplier.phone ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                {supplier.phone || '—'}
              </span>
            </div>

            <div className="flex-between">
              <span className="text-sm">Physical Address</span>
              <span style={{ color: supplier.address ? 'var(--text-primary)' : 'var(--text-secondary)', textAlign: 'right', maxWidth: '240px' }}>
                {supplier.address || '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Audit Metadata */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card-header" style={{ marginBottom: 0, paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
            <h3 className="card-title">Procurement Context</h3>
            <Clock size={16} color="var(--text-secondary)" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="flex-between">
              <span className="text-sm">Partner Status</span>
              <Badge status={supplier.status} />
            </div>

            <div className="flex-between">
              <span className="text-sm">Registration Date</span>
              <span className="mono text-sm">
                {supplier.createdAt ? new Date(supplier.createdAt).toLocaleDateString() : '—'}
              </span>
            </div>

            <div className="flex-between">
              <span className="text-sm">Last Profile Update</span>
              <span className="mono text-sm">
                {supplier.updatedAt ? new Date(supplier.updatedAt).toLocaleDateString() : '—'}
              </span>
            </div>

            <div className="flex-between">
              <span className="text-sm">Supplier ID</span>
              <span className="mono text-xs" style={{ color: 'var(--text-secondary)' }}>
                {supplier.id || supplier._id}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
