import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiFetch } from '../../api/apiClient';
import { ArrowLeft, Save, AlertTriangle, ShieldAlert } from 'lucide-react';

export default function SupplierEdit() {
  const { supplierId } = useParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    contactName: '',
    email: '',
    phone: '',
    address: ''
  });
  
  const [initialStatus, setInitialStatus] = useState('ACTIVE');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSupplier = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await apiFetch(`/business/suppliers/${supplierId}`);
        if (!res.ok) {
          if (res.status === 404) throw new Error('Supplier not found.');
          throw new Error('Failed to load supplier details.');
        }
        const data = await res.json();
        const s = data.supplier;
        setInitialStatus(s.status);
        setFormData({
          name: s.name || '',
          contactName: s.contactName || '',
          email: s.email || '',
          phone: s.phone || '',
          address: s.address || ''
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSupplier();
  }, [supplierId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (initialStatus === 'INACTIVE') return;

    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        name: formData.name.trim(),
        contactName: formData.contactName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim()
      };

      const res = await apiFetch(`/business/suppliers/${supplierId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to update supplier.');
      }

      navigate(`/suppliers/${supplierId}`);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '840px' }}>
        <div style={{ width: '120px', height: '24px' }} className="skeleton" />
        <div style={{ width: '280px', height: '36px' }} className="skeleton" />
        <div style={{ height: '340px' }} className="card skeleton" />
      </div>
    );
  }

  if (initialStatus === 'INACTIVE') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '840px' }}>
        <Link to={`/suppliers/${supplierId}`} className="text-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
          <ArrowLeft size={14} /> Back to Supplier
        </Link>
        <div className="card state-container" style={{ borderColor: 'var(--danger-border)' }}>
          <div className="state-icon" style={{ color: 'var(--danger)', backgroundColor: 'var(--danger-bg)' }}>
            <ShieldAlert size={24} />
          </div>
          <div className="state-title">Supplier is Deactivated</div>
          <div className="state-description">
            This vendor profile has been deactivated and locked for historical purchase record integrity. It cannot be updated.
          </div>
          <Link to={`/suppliers/${supplierId}`} className="btn btn-secondary btn-sm" style={{ marginTop: '8px' }}>
            View Read-Only Details
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '840px' }}>
      <div>
        <Link to={`/suppliers/${supplierId}`} className="text-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
          <ArrowLeft size={14} /> Back to Supplier Details
        </Link>
      </div>

      <div>
        <h1 className="page-title">Edit Supplier Profile</h1>
        <p className="body-text" style={{ marginTop: '4px' }}>
          Update contact person, communication channels, or facility billing details.
        </p>
      </div>

      <div className="card">
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
            marginBottom: '20px',
            fontSize: '13px'
          }}>
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="grid-2col">
            <div className="form-group">
              <label className="form-label">Supplier / Company Name *</label>
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
              <label className="form-label">Primary Contact Person</label>
              <input
                type="text"
                name="contactName"
                value={formData.contactName}
                onChange={handleChange}
                className="form-control"
              />
            </div>
          </div>

          <div className="grid-2col">
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="form-control"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Facility / Billing Address</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows={3}
              className="form-control"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
            <Link to={`/suppliers/${supplierId}`} className="btn btn-secondary">
              Cancel
            </Link>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving Changes...' : 'Save Supplier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
