import { useState } from 'react'
import { createCustomer } from '../api/api'

export default function CRMForm({ lastQuote }) {
  const [form, setForm] = useState({
    name: '',
    contactInfo: '',
    installationDetails: '',
    installationDate: '',
    quoteId: lastQuote?._id || '',
  })
  const [success, setSuccess] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(null)
    try {
      const { data } = await createCustomer({
        ...form,
        quoteId: form.quoteId || undefined,
      })
      setSuccess(data)
      setForm({ name: '', contactInfo: '', installationDetails: '', installationDate: '', quoteId: '' })
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrar el cliente')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Registrar Cliente</h1>
        <p className="page-subtitle">Vincula los datos del cliente con su instalación y cotización</p>
      </div>

      {lastQuote && (
        <div className="alert alert-info">
          💡 Cotización activa: <strong>S/ {Number(lastQuote.price).toLocaleString('es-PE', { minimumFractionDigits: 2 })}</strong> — Área: <strong>{lastQuote.area} m²</strong>
          <br /><small>ID: {lastQuote._id}</small>
        </div>
      )}

      <div className="card">
        <h2 className="card-title">👤 Datos del Cliente</h2>
        <form onSubmit={handleSubmit} id="crm-form">
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="name" className="form-label">👤 Nombre completo</label>
              <input
                id="name"
                name="name"
                type="text"
                className="form-input"
                placeholder="ej. Juan Pérez"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="contactInfo" className="form-label">📞 Contacto (teléfono / email)</label>
              <input
                id="contactInfo"
                name="contactInfo"
                type="text"
                className="form-input"
                placeholder="ej. 999-888-777"
                value={form.contactInfo}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="installationDate" className="form-label">📅 Fecha de instalación</label>
              <input
                id="installationDate"
                name="installationDate"
                type="date"
                className="form-input"
                value={form.installationDate}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="quoteId" className="form-label">🔗 ID de cotización (opcional)</label>
              <input
                id="quoteId"
                name="quoteId"
                type="text"
                className="form-input"
                placeholder="Pega el ID de la cotización"
                value={form.quoteId}
                onChange={handleChange}
              />
            </div>

            <div className="form-group form-group-full">
              <label htmlFor="installationDetails" className="form-label">📝 Detalles de la instalación</label>
              <textarea
                id="installationDetails"
                name="installationDetails"
                className="form-input form-textarea"
                placeholder="Descripción del lugar, requerimientos especiales, etc."
                value={form.installationDetails}
                onChange={handleChange}
                rows={4}
              />
            </div>
          </div>

          {error && <div className="alert alert-error">{error}</div>}
          {success && (
            <div className="alert alert-success">
              ✅ Cliente <strong>{success.name}</strong> registrado exitosamente.
            </div>
          )}

          <button
            id="btn-registrar"
            type="submit"
            className={`btn btn-primary ${loading ? 'loading' : ''}`}
            disabled={loading}
          >
            {loading ? <><span className="spinner"></span> Guardando...</> : '💾 Registrar Cliente'}
          </button>
        </form>
      </div>
    </div>
  )
}
