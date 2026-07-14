import { useState, useEffect } from 'react'
import { apiCall } from '../api/api' // using raw api logic since we don't have wrappers for everything

export default function TeamManager({ user }) {
  const [team, setTeam] = useState([])
  const [loading, setLoading] = useState(false)
  const [linkCode, setLinkCode] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchTeam()
  }, [])

  const fetchTeam = async () => {
    setLoading(true)
    try {
      // Assuming api wrapper exists or just using fetch
      const res = await fetch('http://localhost:5000/api/auth/team', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
      if (!res.ok) throw new Error('Error fetching team')
      const data = await res.json()
      setTeam(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleLink = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      const res = await fetch('http://localhost:5000/api/auth/team/link', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ linkCode })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al vincular')
      setSuccess('Almacenador vinculado correctamente.')
      setLinkCode('')
      fetchTeam()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUnlink = async (id) => {
    if (!window.confirm('¿Seguro que deseas desvincular a este almacenador? Perderá acceso a tu inventario.')) return
    
    setLoading(true)
    try {
      const res = await fetch(`http://localhost:5000/api/auth/team/unlink/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
      if (!res.ok) throw new Error('Error al desvincular')
      fetchTeam()
    } catch (err) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">👥 Equipo de Almacén</h1>
        <p className="page-subtitle">Vincula a tus almacenadores para que puedan gestionar tu inventario.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        
        <div className="card">
          <h2 className="card-title">Vincular Nuevo Almacenador</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            El almacenador debe crear su cuenta y dictarte su <strong>Código de Vinculación</strong>. Ingrésalo aquí para darle acceso a tu catálogo.
          </p>
          
          <form onSubmit={handleLink} style={{ display: 'flex', gap: '10px' }}>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Ej: ALM-A7X2P" 
              value={linkCode} 
              onChange={e => setLinkCode(e.target.value.toUpperCase())}
              required
            />
            <button type="submit" className="btn btn-primary" disabled={loading || !linkCode}>
              Vincular
            </button>
          </form>

          {error && <div className="alert alert-error" style={{ marginTop: '1rem' }}>{error}</div>}
          {success && <div className="alert alert-success" style={{ marginTop: '1rem' }}>{success}</div>}
        </div>

        <div className="card">
          <h2 className="card-title">Tus Almacenadores ({team.length})</h2>
          
          {loading && <p style={{color:'var(--text-muted)'}}>Cargando...</p>}
          {!loading && team.length === 0 && (
            <div className="empty-state">
              <p>No tienes ningún almacenador vinculado.</p>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {team.map(member => (
              <div key={member._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <div>
                  <strong style={{ display: 'block' }}>{member.name}</strong>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>@{member.username}</span>
                </div>
                <button onClick={() => handleUnlink(member._id)} className="btn-remove" title="Desvincular">
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
