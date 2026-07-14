import { useState } from 'react'
import { login as loginApi } from '../api/api'
import axios from 'axios'

export default function Login({ onLogin }) {
  const [isRegistering, setIsRegistering] = useState(false)
  const [form, setForm] = useState({
    username: '', password: '', name: '', companyName: '', ruc: '', address: ''
  })
  const [logoBase64, setLogoBase64] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoBase64(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      if (isRegistering) {
        // Use standard axios to avoid interceptor issues if any, but since it's unauthenticated it's fine
        const { data } = await axios.post('/api/auth/register', { ...form, logoBase64 })
        setSuccess(data.message)
        setIsRegistering(false) // Switch back to login
      } else {
        const { data } = await loginApi({ username: form.username, password: form.password })
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data))
        onLogin(data)
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error al procesar la solicitud')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container" style={{ alignItems: 'flex-start', paddingTop: '4rem' }}>
      <div className="login-card" style={{ maxWidth: isRegistering ? '500px' : '420px' }}>
        <div className="login-header">
          <span className="brand-icon">⚽</span>
          <h1 className="login-title">SportNet CRM</h1>
          <p className="login-subtitle">
            {isRegistering ? 'Regístrate como Facturador' : 'Inicia sesión como facturador'}
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group" style={{marginBottom:'1rem'}}>
            <label className="form-label">Usuario</label>
            <input name="username" type="text" className="form-input" value={form.username} onChange={handleChange} required />
          </div>
          
          <div className="form-group" style={{marginBottom:'1rem'}}>
            <label className="form-label">Contraseña</label>
            <input name="password" type="password" className="form-input" value={form.password} onChange={handleChange} required />
          </div>

          {isRegistering && (
            <>
              <div className="form-group" style={{marginBottom:'1rem'}}>
                <label className="form-label">Tu Nombre Completo</label>
                <input name="name" type="text" className="form-input" value={form.name} onChange={handleChange} required />
              </div>
              <div className="form-group" style={{marginBottom:'1rem'}}>
                <label className="form-label">Nombre de tu Empresa / Razón Social</label>
                <input name="companyName" type="text" className="form-input" value={form.companyName} onChange={handleChange} />
              </div>
              <div className="form-group" style={{marginBottom:'1rem'}}>
                <label className="form-label">RUC</label>
                <input name="ruc" type="text" className="form-input" value={form.ruc} onChange={handleChange} />
              </div>
              <div className="form-group" style={{marginBottom:'1rem'}}>
                <label className="form-label">Dirección Fiscal</label>
                <input name="address" type="text" className="form-input" value={form.address} onChange={handleChange} />
              </div>
              <div className="form-group" style={{marginBottom:'1rem'}}>
                <label className="form-label">Logo de la Empresa (Opcional)</label>
                <input type="file" accept="image/*" className="form-input" style={{padding:'0.4rem'}} onChange={handleFileChange} />
                {logoBase64 && <img src={logoBase64} alt="Preview" style={{marginTop:'0.5rem', maxHeight:'60px', objectFit:'contain', background:'#fff', padding:'5px', borderRadius:'4px'}} />}
              </div>
            </>
          )}

          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <button type="submit" className={`btn btn-primary ${loading ? 'loading' : ''}`} disabled={loading} style={{width:'100%', marginBottom:'1rem'}}>
            {loading ? <span className="spinner"></span> : (isRegistering ? 'Registrarse' : 'Ingresar')}
          </button>

          <div style={{textAlign:'center', fontSize:'0.9rem', color:'var(--text-secondary)'}}>
            {isRegistering ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}
            <button type="button" onClick={() => setIsRegistering(!isRegistering)} style={{background:'none', border:'none', color:'var(--accent)', marginLeft:'5px', cursor:'pointer', fontWeight:'600'}}>
              {isRegistering ? 'Inicia Sesión' : 'Crea una cuenta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
