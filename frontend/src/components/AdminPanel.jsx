import { useState, useEffect } from 'react'
import { getUsers, updateUserStatus, updateUserByAdmin, getUserCustomers, getUserQuotes } from '../api/api'

export default function AdminPanel() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  // Modals state
  const [editingUser, setEditingUser] = useState(null)
  const [viewingUser, setViewingUser] = useState(null)
  
  // Data for viewing modal
  const [userCustomers, setUserCustomers] = useState([])
  const [userQuotes, setUserQuotes] = useState([])
  const [loadingViewData, setLoadingViewData] = useState(false)

  // Data for editing modal
  const [editForm, setEditForm] = useState({ name: '', companyName: '', ruc: '', address: '', role: '' })

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const { data } = await getUsers()
      setUsers(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (id, status) => {
    try {
      await updateUserStatus(id, status)
      setUsers(users.map(u => u._id === id ? { ...u, status } : u))
    } catch (err) {
      alert('Error al actualizar estado')
    }
  }

  // Edit logic
  const openEditModal = (user) => {
    setEditingUser(user)
    setEditForm({
      name: user.name || '',
      companyName: user.companyName || '',
      ruc: user.ruc || '',
      address: user.address || '',
      role: user.role || 'user'
    })
  }

  const handleEditSave = async (e) => {
    e.preventDefault()
    try {
      const { data } = await updateUserByAdmin(editingUser._id, editForm)
      setUsers(users.map(u => u._id === data._id ? data : u))
      setEditingUser(null)
    } catch(err) {
      alert('Error al guardar datos')
    }
  }

  // View data logic
  const openViewModal = async (user) => {
    setViewingUser(user)
    setLoadingViewData(true)
    setUserCustomers([])
    setUserQuotes([])
    try {
      const custRes = await getUserCustomers(user._id)
      const quoteRes = await getUserQuotes(user._id)
      setUserCustomers(custRes.data)
      setUserQuotes(quoteRes.data)
    } catch(err) {
      alert('Error obteniendo datos del usuario')
    } finally {
      setLoadingViewData(false)
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Panel de Administración</h1>
        <p className="page-subtitle">Gestiona a los facturadores registrados en el sistema y revisa sus datos.</p>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 className="card-title" style={{ margin: 0 }}>Usuarios Registrados</h2>
          <button className="btn btn-secondary btn-sm" onClick={fetchUsers}>🔄 Actualizar</button>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner spinner-lg"></div>
            <p>Cargando usuarios...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🛡️</div>
            <h3>No hay usuarios registrados</h3>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{borderBottom: '2px solid var(--border)'}}>
                  <th style={{padding: '1rem'}}>Usuario</th>
                  <th>Empresa</th>
                  <th>RUC</th>
                  <th>Dirección</th>
                  <th>Logo</th>
                  <th>Estado</th>
                  <th style={{textAlign: 'right'}}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id} style={{borderBottom: '1px solid var(--border)'}}>
                    <td style={{padding: '1rem'}}>
                      <strong>{u.name}</strong><br/>
                      <small style={{color:'var(--text-secondary)'}}>@{u.username}</small>
                    </td>
                    <td>{u.companyName || '-'}</td>
                    <td>{u.ruc || '-'}</td>
                    <td>{u.address || '-'}</td>
                    <td>
                      {u.logoBase64 ? (
                        <img src={u.logoBase64} alt="Logo" style={{maxHeight:'40px', background:'#fff', padding:'2px', borderRadius:'4px'}} />
                      ) : '-'}
                    </td>
                    <td>
                      <select 
                        value={u.status} 
                        onChange={(e) => handleStatusChange(u._id, e.target.value)}
                        style={{
                          padding: '4px 8px', borderRadius: '4px',
                          background: u.status === 'active' ? 'rgba(16,185,129,0.2)' : u.status === 'rejected' ? 'rgba(244,63,94,0.2)' : 'rgba(245,158,11,0.2)',
                          color: u.status === 'active' ? '#34d399' : u.status === 'rejected' ? '#fb7185' : '#fbbf24',
                          border: 'none', fontWeight: 'bold'
                        }}
                      >
                        <option value="pending" style={{color:'#000'}}>Pendiente</option>
                        <option value="active" style={{color:'#000'}}>Activo</option>
                        <option value="rejected" style={{color:'#000'}}>Rechazado</option>
                      </select>
                    </td>
                    <td style={{padding: '1rem', textAlign: 'right', minWidth: '200px'}}>
                      <button className="btn btn-secondary btn-sm" style={{marginRight: '5px'}} onClick={() => openViewModal(u)}>👁️ Ver</button>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEditModal(u)}>✏️ Editar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px', margin: '20px' }}>
            <h2 className="card-title" style={{ marginBottom: '1.5rem' }}>✏️ Editar Usuario: @{editingUser.username}</h2>
            <form onSubmit={handleEditSave} className="form-group">
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Nombre del Facturador</label>
                <input type="text" className="form-input" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} required />
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Nombre de la Empresa</label>
                <input type="text" className="form-input" value={editForm.companyName} onChange={e => setEditForm({...editForm, companyName: e.target.value})} />
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">RUC</label>
                <input type="text" className="form-input" value={editForm.ruc} onChange={e => setEditForm({...editForm, ruc: e.target.value})} />
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Dirección Fiscal</label>
                <input type="text" className="form-input" value={editForm.address} onChange={e => setEditForm({...editForm, address: e.target.value})} />
              </div>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Rol del Sistema</label>
                <select className="form-input" value={editForm.role} onChange={e => setEditForm({...editForm, role: e.target.value})}>
                  <option value="user">Usuario normal (Facturador)</option>
                  <option value="admin">Administrador (Control total)</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setEditingUser(null)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Data Modal */}
      {viewingUser && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '800px', margin: '20px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 className="card-title" style={{ margin: 0 }}>👁️ Datos de {viewingUser.name}</h2>
              <button className="btn btn-secondary btn-sm" onClick={() => setViewingUser(null)}>✕ Cerrar</button>
            </div>

            {loadingViewData ? (
              <div className="loading-state">
                <div className="spinner"></div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '2rem', flexDirection: 'column' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '0.8rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                    👥 Clientes Registrados ({userCustomers.length})
                  </h3>
                  {userCustomers.length === 0 ? <p style={{color:'var(--text-muted)'}}>No hay clientes.</p> : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                      {userCustomers.map(c => (
                        <div key={c._id} style={{ background: 'var(--bg-input)', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                          <strong>{c.name}</strong><br/>
                          <small style={{color:'var(--text-secondary)'}}>RUC: {c.ruc || '-'}</small>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '0.8rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                    📄 Proformas Generadas ({userQuotes.length})
                  </h3>
                  {userQuotes.length === 0 ? <p style={{color:'var(--text-muted)'}}>No hay proformas.</p> : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{borderBottom: '1px solid var(--border)'}}>
                          <th style={{padding: '0.5rem'}}>Fecha</th>
                          <th>Código</th>
                          <th>Cliente</th>
                          <th style={{textAlign: 'right'}}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userQuotes.map(q => (
                          <tr key={q._id} style={{borderBottom: '1px solid rgba(148,163,184,0.05)'}}>
                            <td style={{padding: '0.5rem'}}>{new Date(q.createdAt).toLocaleDateString('es-PE')}</td>
                            <td>{q.code || '-'}</td>
                            <td>{q.customer?.name || q.customerNameTemp || 'Desconocido'}</td>
                            <td style={{textAlign: 'right', fontWeight: 'bold', color: 'var(--accent)'}}>S/ {q.total.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
