import { useState, useEffect } from 'react'
import { getTeam, linkAlmacenador, unlinkAlmacenador } from '../api/api'

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
      const { data } = await getTeam()
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
      await linkAlmacenador(linkCode)
      setSuccess('Almacenador vinculado correctamente.')
      setLinkCode('')
      fetchTeam()
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Error al vincular')
    } finally {
      setLoading(false)
    }
  }

  const handleUnlink = async (id) => {
    if (!window.confirm('¿Seguro que deseas desvincular a este almacenador? Perderá acceso a tu inventario.')) return
    
    setLoading(true)
    try {
      await unlinkAlmacenador(id)
      fetchTeam()
    } catch (err) {
      alert(err.response?.data?.error || err.message || 'Error al desvincular')
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
