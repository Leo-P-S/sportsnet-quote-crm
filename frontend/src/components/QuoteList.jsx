import { useState, useEffect } from 'react'
import { getQuotes, deleteQuote } from '../api/api'
import InvoiceView from './InvoiceView'

export default function QuoteList({ user }) {
  const [quotes, setQuotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedQuote, setSelectedQuote] = useState(null)
  
  // Sort states
  const [sortBy, setSortBy] = useState('date') // 'date' or 'price'
  const [sortOrder, setSortOrder] = useState('desc') // 'desc' or 'asc'

  useEffect(() => {
    fetchQuotes()
  }, [])

  const fetchQuotes = async () => {
    try {
      const { data } = await getQuotes()
      setQuotes(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    const confirm = window.confirm("¿Estás seguro de que quieres eliminar esta proforma? Se borrará de la base de datos.");
    if (!confirm) return;

    try {
      await deleteQuote(id)
      setQuotes(quotes.filter(q => q._id !== id))
    } catch (err) {
      alert("Error al eliminar la proforma")
    }
  }

  const handleSort = (type) => {
    if (sortBy === type) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')
    } else {
      setSortBy(type)
      setSortOrder('desc')
    }
  }

  const sortedQuotes = [...quotes].sort((a, b) => {
    if (sortBy === 'date') {
      const dateA = new Date(a.createdAt).getTime()
      const dateB = new Date(b.createdAt).getTime()
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB
    } else {
      return sortOrder === 'desc' ? b.total - a.total : a.total - b.total
    }
  })

  if (selectedQuote) {
    return (
      <div className="page-container">
        <InvoiceView data={selectedQuote} user={user} onNew={() => setSelectedQuote(null)} />
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Historial de Proformas</h1>
        <p className="page-subtitle">Revisa y ordena todas las proformas que has generado</p>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading-state">
            <div className="spinner spinner-lg"></div>
            <p>Cargando historial...</p>
          </div>
        ) : quotes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📄</div>
            <h3>No hay proformas generadas</h3>
            <p>Crea tu primera proforma desde la pestaña principal.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="responsive-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.95rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  <th style={{ padding: '1rem', cursor: 'pointer' }} onClick={() => handleSort('date')}>
                    Fecha Emisión {sortBy === 'date' ? (sortOrder === 'desc' ? '↓' : '↑') : ''}
                  </th>
                  <th style={{ padding: '1rem' }}>Código</th>
                  <th style={{ padding: '1rem' }}>Cliente</th>
                  <th style={{ padding: '1rem', cursor: 'pointer' }} onClick={() => handleSort('price')}>
                    Importe Total {sortBy === 'price' ? (sortOrder === 'desc' ? '↓' : '↑') : ''}
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {sortedQuotes.map(q => {
                  const custName = q.customer?.name || q.customerNameTemp || 'Desconocido';
                  return (
                    <tr key={q._id} style={{ borderBottom: '1px solid rgba(148,163,184,0.1)' }}>
                      <td data-label="Fecha" style={{ padding: '1rem' }}>{new Date(q.createdAt).toLocaleDateString('es-PE')}</td>
                      <td data-label="Código" style={{ padding: '1rem', fontWeight: 'bold' }}>{q.code || 'DOC'}</td>
                      <td data-label="Cliente" style={{ padding: '1rem' }}>{custName}</td>
                      <td data-label="Importe Total" style={{ padding: '1rem', color: 'var(--accent)', fontWeight: 'bold' }}>S/ {q.total.toFixed(2)}</td>
                      <td data-label="Acciones" style={{ padding: '1rem', textAlign: 'right', minWidth: '150px' }}>
                        <button className="btn btn-secondary btn-sm" style={{marginRight: '8px', marginBottom: '8px'}} onClick={() => setSelectedQuote(q)}>
                          Ver / Descargar
                        </button>
                        <button className="btn btn-sm" style={{ background: 'var(--bg-card)', color: '#ef4444', border: '1px solid #ef4444', marginBottom: '8px' }} onClick={() => handleDelete(q._id)}>
                          🗑️
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
