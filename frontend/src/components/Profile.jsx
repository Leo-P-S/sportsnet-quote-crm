import { useState, useRef } from 'react'
import { updateProfile } from '../api/api'

export default function Profile({ user, setUser }) {
  const [formData, setFormData] = useState({
    name: user.name || '',
    companyName: user.companyName || '',
    ruc: user.ruc || '',
    address: user.address || '',
  })
  const [logoBase64, setLogoBase64] = useState(user.logoBase64 || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const fileInputRef = useRef(null)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleLogoUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('El logo debe pesar menos de 2MB')
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => setLogoBase64(reader.result)
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const payload = { ...formData, logoBase64 }
      const { data } = await updateProfile(payload)
      localStorage.setItem('user', JSON.stringify(data))
      setUser(data)
      setSuccess('Perfil actualizado correctamente')
    } catch (err) {
      setError(err.response?.data?.error || 'Error al actualizar el perfil')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-container" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div className="page-header">
        <h1 className="page-title">Mi Perfil</h1>
        <p className="page-subtitle">Actualiza tus datos y el logo que aparecerá en tus facturas</p>
      </div>

      <div className="card">
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit} className="form-group">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div 
              style={{
                width: '120px', height: '120px', borderRadius: '50%', background: 'var(--bg-input)',
                border: '2px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden', cursor: 'pointer', marginBottom: '1rem', position: 'relative'
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              {logoBase64 ? (
                <img src={logoBase64} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', background: 'white' }} />
              ) : (
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Subir Logo</span>
              )}
            </div>
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={handleLogoUpload} 
            />
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => fileInputRef.current?.click()}>
              Cambiar Logo
            </button>
          </div>

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">Nombre del Facturador</label>
            <input type="text" className="form-input" name="name" value={formData.name} onChange={handleChange} required />
          </div>

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">Nombre de la Empresa</label>
            <input type="text" className="form-input" name="companyName" value={formData.companyName} onChange={handleChange} required />
          </div>

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">RUC / DNI</label>
            <input type="text" className="form-input" name="ruc" value={formData.ruc} onChange={handleChange} required />
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Dirección Fiscal</label>
            <input type="text" className="form-input" name="address" value={formData.address} onChange={handleChange} required />
          </div>

          <button type="submit" className={`btn btn-primary btn-block ${loading ? 'loading' : ''}`} disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </form>
      </div>
    </div>
  )
}
