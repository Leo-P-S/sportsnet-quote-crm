import { useState, useEffect } from 'react'
import { getCustomers, createCustomer, updateCustomer, getQuotes, deleteQuote } from '../api/api'
import InvoiceView from './InvoiceView'

export default function CustomerList({ user }) {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  
  const [formData, setFormData] = useState({
    name: '', ruc: '', address: '', contactInfo: '', aliases: ''
  })

  // History Modal State
  const [historyModalOpen, setHistoryModalOpen] = useState(false)
  const [historyCustomer, setHistoryCustomer] = useState(null)
  const [customerQuotes, setCustomerQuotes] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  
  // Viewer State (from history)
  const [selectedQuote, setSelectedQuote] = useState(null)

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      const { data } = await getCustomers()
      setCustomers(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const openNewCustomerModal = () => {
    setEditingCustomer(null)
    setFormData({ name: '', ruc: '', address: '', contactInfo: '', aliases: '' })
    setIsModalOpen(true)
  }

  const openEditCustomerModal = (c) => {
    setEditingCustomer(c)
    setFormData({
      name: c.name || '',
      ruc: c.ruc || '',
      address: c.address || '',
      contactInfo: c.contactInfo || '',
      aliases: c.aliases ? c.aliases.join(', ') : ''
    })
    setIsModalOpen(true)
  }

  const openHistoryModal = async (c) => {
    setHistoryCustomer(c)
    setHistoryModalOpen(true)
    setLoadingHistory(true)
    try {
      // Optimizacion rápida: traemos todos y filtramos en el frontend,
      // o el endpoint de /quote podría aceptar query params. Aquí filtramos
      const { data } = await getQuotes()
      const filtered = data.filter(q => q.customer?._id === c._id)
      setCustomerQuotes(filtered)
    } catch (err) {
      alert('Error cargando historial de proformas.')
    } finally {
      setLoadingHistory(false)
    }
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingCustomer(null)
  }

  const closeHistoryModal = () => {
    setHistoryModalOpen(false)
    setHistoryCustomer(null)
    setCustomerQuotes([])
  }

  const handleSave = async (e) => {
    e.preventDefault()
    
    const payload = {
      ...formData,
      aliases: formData.aliases ? formData.aliases.split(',').map(a => a.trim()) : []
    }

    try {
      if (editingCustomer) {
        await updateCustomer(editingCustomer._id, payload)
      } else {
        await createCustomer(payload)
      }
      closeModal()
      fetchCustomers() // Refresh
    } catch (err) {
      alert('Error al guardar el cliente')
    }
  }

  const handleDeleteQuote = async (id) => {
    const confirm = window.confirm("¿Estás seguro de que quieres eliminar permanentemente esta proforma? Esta acción no se puede deshacer.")
    if (!confirm) return;

    try {
      await deleteQuote(id)
      setCustomerQuotes(customerQuotes.filter(q => q._id !== id))
    } catch (err) {
      alert('Error al eliminar proforma')
    }
  }

  if (selectedQuote) {
    return (
      <div className="page-container">
        <InvoiceView data={selectedQuote} user={user} onNew={() => setSelectedQuote(null)} />
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Directorio de Clientes</h1>
          <p className="page-subtitle">Gestiona tu base de datos de clientes y contactos</p>
        </div>
        <button className="btn btn-primary" onClick={openNewCustomerModal}>+ Registrar Cliente</button>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading-state">
            <div className="spinner spinner-lg"></div>
            <p>Cargando clientes...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <h3>Aún no tienes clientes registrados</h3>
            <p>Registra un cliente manualmente o al generar una proforma.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="responsive-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.95rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  <th style={{ padding: '1rem' }}>Cliente</th>
                  <th style={{ padding: '1rem' }}>RUC / DNI</th>
                  <th style={{ padding: '1rem' }}>Contacto</th>
                  <th style={{ padding: '1rem' }}>Dirección</th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {customers.map(c => (
                  <tr key={c._id} style={{ borderBottom: '1px solid rgba(148,163,184,0.1)' }}>
                    <td data-label="Cliente" style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="customer-avatar" style={{width: '32px', height: '32px', fontSize: '0.8rem'}}>
                          {c.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <strong>{c.name}</strong>
                          {c.aliases && c.aliases.length > 0 && (
                            <div style={{fontSize: '0.75rem', color: 'var(--accent)'}}>🏷️ {c.aliases.join(', ')}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td data-label="RUC / DNI" style={{ padding: '1rem' }}>{c.ruc || '-'}</td>
                    <td data-label="Contacto" style={{ padding: '1rem' }}>{c.contactInfo || '-'}</td>
                    <td data-label="Dirección" style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{c.address || '-'}</td>
                    <td data-label="Acciones" style={{ padding: '1rem', textAlign: 'right', minWidth: '220px' }}>
                      <button className="btn btn-secondary btn-sm" style={{marginRight: '8px', marginBottom: '8px'}} onClick={() => openHistoryModal(c)}>
                        📚 Historial
                      </button>
                      <button className="btn btn-secondary btn-sm" style={{marginBottom: '8px'}} onClick={() => openEditCustomerModal(c)}>
                        ✏️ Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit/Create Customer Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px', margin: '15px', maxHeight: '95vh', overflowY: 'auto' }}>
            <h2 className="card-title" style={{ marginBottom: '1.5rem' }}>
              {editingCustomer ? '✏️ Editar Cliente' : '👤 Registrar Cliente'}
            </h2>
            
            <form onSubmit={handleSave} className="form-group">
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Nombre / Razón Social <span style={{color:'red'}}>*</span></label>
                <input type="text" className="form-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
              </div>
              
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">RUC / DNI <span style={{color:'red'}}>*</span></label>
                <input type="text" className="form-input" value={formData.ruc} onChange={e => setFormData({...formData, ruc: e.target.value})} required />
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Dirección Fiscal</label>
                <input type="text" className="form-input" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Celular / Teléfono</label>
                <input type="text" className="form-input" value={formData.contactInfo} onChange={e => setFormData({...formData, contactInfo: e.target.value})} />
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Alias (Separados por comas)</label>
                <input type="text" className="form-input" placeholder="Ej: Don Pepe, Ferreteria" value={formData.aliases} onChange={e => setFormData({...formData, aliases: e.target.value})} />
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: '1 1 auto', minWidth: '120px' }} onClick={closeModal}>Cancelar</button>
                <button type="submit" className="btn btn-primary" style={{ flex: '1 1 auto', minWidth: '150px' }}>{editingCustomer ? 'Guardar Cambios' : 'Crear Cliente'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {historyModalOpen && historyCustomer && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '10px'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '800px', margin: '0', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '10px' }}>
              <h2 className="card-title" style={{ margin: 0, fontSize: '1.2rem' }}>📚 Historial de {historyCustomer.name}</h2>
              <button className="btn btn-secondary btn-sm" onClick={closeHistoryModal}>✕ Cerrar</button>
            </div>

            <div style={{ overflowY: 'auto', flex: 1 }}>
              {loadingHistory ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                </div>
              ) : customerQuotes.length === 0 ? (
                <div className="empty-state">
                  <p>Este cliente aún no tiene proformas registradas.</p>
                </div>
              ) : (
                <table className="responsive-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border)' }}>
                      <th style={{ padding: '0.8rem' }}>Fecha</th>
                      <th style={{ padding: '0.8rem' }}>Código</th>
                      <th style={{ padding: '0.8rem' }}>Total</th>
                      <th style={{ padding: '0.8rem', textAlign: 'right' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerQuotes.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).map(q => (
                      <tr key={q._id} style={{ borderBottom: '1px solid rgba(148,163,184,0.1)' }}>
                        <td data-label="Fecha" style={{ padding: '0.8rem' }}>{new Date(q.createdAt).toLocaleDateString('es-PE')}</td>
                        <td data-label="Código" style={{ padding: '0.8rem', fontWeight: 'bold' }}>{q.code || '-'}</td>
                        <td data-label="Total" style={{ padding: '0.8rem', color: 'var(--accent)', fontWeight: 'bold' }}>S/ {q.total.toFixed(2)}</td>
                        <td data-label="Acciones" style={{ padding: '0.8rem', textAlign: 'right', minWidth: '180px' }}>
                          <button className="btn btn-secondary btn-sm" style={{marginRight: '8px', marginBottom: '8px'}} onClick={() => {
                            setSelectedQuote(q)
                            closeHistoryModal()
                          }}>
                            📄 Ver PDF
                          </button>
                          <button className="btn btn-sm" style={{ background: 'var(--bg-card)', color: '#ef4444', border: '1px solid #ef4444', marginBottom: '8px' }} onClick={() => handleDeleteQuote(q._id)}>
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
