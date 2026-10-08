import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { apiFetch } from '../../api/apiClient';
import {
  Truck,
  Plus,
  Search,
  RefreshCw,
  AlertTriangle,
  Mail,
  Phone,
  MoreHorizontal,
  Edit,
  Trash2
} from 'lucide-react';
import Badge from '../../components/ui/Badge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

export default function SupplierList() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [activeMenu, setActiveMenu] = useState(null);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiFetch('/business/suppliers');
      if (!res.ok) throw new Error('Failed to retrieve supplier directory');
      const data = await res.json();
      setSuppliers(data.suppliers || []);
    } catch (err) {
      setError(err.message || 'Could not load suppliers. Please check connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

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

  const toggleMenu = (e, s) => {
    e.stopPropagation();
    const sId = s.id || s._id;
    if (activeMenu?.id === sId) {
      setActiveMenu(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const showAbove = spaceBelow < 110;
    setActiveMenu({
      id: sId,
      name: s.name,
      status: s.status,
      top: showAbove ? rect.top - 84 : rect.bottom + 4,
      right: window.innerWidth - rect.right
    });
  };

  const [confirmSupplier, setConfirmSupplier] = useState(null);
  const [deactivating, setDeactivating] = useState(false);

  const handleConfirmDeactivate = async () => {
    if (!confirmSupplier) return;
    try {
      setDeactivating(true);
      const res = await apiFetch(`/business/suppliers/${confirmSupplier.id}/deactivate`, {
        method: 'PATCH'
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to deactivate supplier.');
      }
      setSuppliers(prev => prev.map(s => (s.id || s._id) === confirmSupplier.id ? { ...s, status: 'INACTIVE' } : s));
      setConfirmSupplier(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setDeactivating(false);
    }
  };

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(s => {
      const matchesSearch = !searchTerm ||
        s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.contactName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.phone?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [suppliers, searchTerm, statusFilter]);

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
        <div className="state-title">Directory Error</div>
        <div className="state-description">{error}</div>
        <button onClick={fetchSuppliers} className="btn btn-primary btn-sm" style={{ marginTop: '8px' }}>
          <RefreshCw size={13} /> Try again
        </button>
      </div>
    );
  }

  const activeCount = suppliers.filter(s => s.status === 'ACTIVE').length;
  const inactiveCount = suppliers.filter(s => s.status === 'INACTIVE').length;

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
          <h1 className="page-title">Supplier Directory</h1>
          <p className="body-text" style={{ marginTop: '2px' }}>
            Registered procurement vendors and contact credentials.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={fetchSuppliers} className="btn btn-secondary btn-sm" title="Refresh suppliers">
            <RefreshCw size={13} />
          </button>
          <Link to="/suppliers/new" className="btn btn-primary btn-sm">
            <Plus size={13} /> Add Supplier
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar - Clean Toolbar */}
      <div className="card" style={{ padding: '12px 16px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', flex: 1 }}>
          <div className="search-box" style={{ minWidth: '240px', flex: 1, maxWidth: '380px' }}>
            <Search size={14} />
            <input
              type="text"
              placeholder="Search by vendor name, contact person, or email..."
              className="form-control"
              style={{ height: '34px', fontSize: '12px' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ width: '150px' }}>
            <select
              className="form-control"
              style={{ height: '34px', fontSize: '12px' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses ({suppliers.length})</option>
              <option value="ACTIVE">Active ({activeCount})</option>
              <option value="INACTIVE">Inactive ({inactiveCount})</option>
            </select>
          </div>
        </div>

        <div className="text-xs" style={{ whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>
          Showing <strong style={{ color: 'var(--text-primary)' }}>{filteredSuppliers.length}</strong> of {suppliers.length} vendors
        </div>
      </div>

      {/* Supplier Table Container */}
      <div className="table-container">
        {filteredSuppliers.length === 0 ? (
          <div className="state-container" style={{ padding: '40px 20px' }}>
            <div className="state-icon" style={{ width: '40px', height: '40px' }}>
              <Truck size={20} />
            </div>
            <div className="state-title" style={{ fontSize: '13.5px' }}>
              {suppliers.length === 0 ? 'No Suppliers in Directory' : 'No Matching Suppliers'}
            </div>
            <div className="state-description" style={{ fontSize: '12px' }}>
              {suppliers.length === 0
                ? 'Add your primary procurement partners to start issuing purchase orders.'
                : 'No supplier records match your active search and filter conditions.'}
            </div>
            {suppliers.length === 0 ? (
              <Link to="/suppliers/new" className="btn btn-primary btn-sm" style={{ marginTop: '8px' }}>
                <Plus size={13} /> Add Supplier
              </Link>
            ) : (
              <button
                onClick={() => { setSearchTerm(''); setStatusFilter('ALL'); }}
                className="btn btn-secondary btn-sm"
                style={{ marginTop: '8px' }}
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Vendor / Company</th>
                  <th>Primary Contact</th>
                  <th>Contact Details</th>
                  <th>Address</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSuppliers.map((s) => {
                  const sId = s.id || s._id;
                  return (
                    <tr key={sId}>
                      <td>
                        <Link
                          to={`/suppliers/${sId}`}
                          style={{ fontWeight: '500', color: 'var(--text-primary)' }}
                        >
                          {s.name}
                        </Link>
                      </td>
                      <td>
                        <span className="text-sm" style={{ color: s.contactName ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                          {s.contactName || '—'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          {s.email && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                              <Mail size={12} color="var(--text-secondary)" />
                              <span className="td-mono text-xs">{s.email}</span>
                            </div>
                          )}
                          {s.phone && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                              <Phone size={12} color="var(--text-secondary)" />
                              <span className="td-mono text-xs">{s.phone}</span>
                            </div>
                          )}
                          {!s.email && !s.phone && <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>—</span>}
                        </div>
                      </td>
                      <td>
                        <span className="text-xs" style={{ color: s.address ? 'var(--text-secondary)' : 'var(--text-secondary)', maxWidth: '200px', display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {s.address || '—'}
                        </span>
                      </td>
                      <td>
                        <Badge status={s.status} />
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', justifyContent: 'flex-end', position: 'relative' }}>
                          <Link
                            to={`/suppliers/${sId}`}
                            className="row-view-link"
                            title="View Profile"
                          >
                            View
                          </Link>

                          <button
                            type="button"
                            onClick={(e) => toggleMenu(e, s)}
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
                  );
                })}
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
          {activeMenu.status === 'ACTIVE' && (
            <Link
              to={`/suppliers/${activeMenu.id}/edit`}
              onClick={() => setActiveMenu(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 10px',
                fontSize: '12px',
                color: 'var(--text-primary)',
                borderRadius: '4px',
                textDecoration: 'none'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-elevated)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <Edit size={12} /> Edit
            </Link>
          )}
          {activeMenu.status === 'ACTIVE' && (
            <button
              type="button"
              onClick={() => {
                setConfirmSupplier({ id: activeMenu.id, name: activeMenu.name });
                setActiveMenu(null);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 10px',
                fontSize: '12px',
                color: 'var(--danger)',
                background: 'none',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                width: '100%',
                textAlign: 'left'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--danger-bg)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <Trash2 size={12} /> Deactivate
            </button>
          )}
        </div>,
        document.body
      )}

      {/* Themed Confirm Dialog */}
      <ConfirmDialog
        isOpen={Boolean(confirmSupplier)}
        title="Confirm Supplier Deactivation"
        description={confirmSupplier ? `Are you sure you want to deactivate "${confirmSupplier.name}"? Deactivated suppliers cannot be assigned to new purchase orders.` : ''}
        confirmText="Deactivate Supplier"
        cancelText="Cancel"
        variant="danger"
        isLoading={deactivating}
        onConfirm={handleConfirmDeactivate}
        onClose={() => setConfirmSupplier(null)}
      />

    </div>
  );
}
