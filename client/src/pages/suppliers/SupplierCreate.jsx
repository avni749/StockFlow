import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiFetch } from '../../api/apiClient';
import { ArrowLeft, Plus, AlertTriangle, Truck } from 'lucide-react';

export default function SupplierCreate() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    contactName: '',
    email: '',
    phone: '',
    address: ''
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        name: formData.name.trim(),
        contactName: formData.contactName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim()
      };
      
      const res = await apiFetch('/business/suppliers', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to register supplier.');
      }
      
      navigate(`/suppliers/${data.supplier.id || data.supplier._id}`);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '840px' }}>
      <div>
        <Link to="/suppliers" className="text-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
          <ArrowLeft size={14} /> Back to Supplier Directory
        </Link>
      </div>

      <div>
        <h1 className="page-title">Add Supplier</h1>
        <p className="body-text" style={{ marginTop: '4px' }}>
          Add a vendor or distribution partner to your supply chain database.
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
                placeholder="e.g. Apex Logistics & Distribution"
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
                placeholder="e.g. Eleanor Vance"
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
                placeholder="orders@apexlogistics.com"
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
                placeholder="+1 (555) 349-2041"
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
              placeholder="Full business address, warehouse suite, city, state, zip..."
              value={formData.address}
              onChange={handleChange}
              rows={3}
              className="form-control"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
            <Link to="/suppliers" className="btn btn-secondary">
              Cancel
            </Link>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Adding Supplier...' : 'Add Supplier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
