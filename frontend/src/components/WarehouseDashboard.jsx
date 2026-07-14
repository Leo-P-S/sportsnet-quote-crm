import { useState, useEffect } from 'react'

const STOCK_LEVELS = {
  none: { label: '🔴 Sin existencia', color: '#ef4444' },
  low: { label: '🟠 Poco', color: '#f97316' },
  medium: { label: '🟡 Medio', color: '#eab308' },
  high: { label: '🟢 Mucho', color: '#22c55e' },
  full: { label: '🔵 Abastecido al completo', color: '#3b82f6' }
}

export default function WarehouseDashboard({ user }) {
  const [products, setProducts] = useState([])
  const [inventory, setInventory] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  
  const [editingItem, setEditingItem] = useState(null)
  const [form, setForm] = useState({ codigo: '', ubicacion: '', stockLevel: 'none' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [prodRes, invRes] = await Promise.all([
        fetch('http://localhost:5000/api/catalog', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }}),
        fetch('http://localhost:5000/api/inventory', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }})
      ])
      
      if (!prodRes.ok || !invRes.ok) throw new Error('Error fetching data')
      
      const prods = await prodRes.json()
      const inv = await invRes.json()
      
      setProducts(prods)
      setInventory(inv)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const openEditor = (prod) => {
    const invItem = inventory.find(i => i.product?._id === prod._id)
    setEditingItem({ prod, invItem })
    setForm({
      codigo: invItem?.codigo || '',
      ubicacion: invItem?.ubicacion || '',
      stockLevel: invItem?.stockLevel || 'none'
    })
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const url = editingItem.invItem 
        ? `http://localhost:5000/api/inventory/${editingItem.invItem._id}`
        : `http://localhost:5000/api/inventory`
        
      const method = editingItem.invItem ? 'PUT' : 'POST'
      
      const body = {
        productId: editingItem.prod._id,
        ...form
      }

      const res = await fetch(url, {
        method,
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Error al guardar inventario')
      }
      
      setEditingItem(null)
      fetchData()
    } catch (err) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  const filteredProducts = products.filter(p => {
    const fullName = `${p.category} ${p.variants?.join(' ') || ''}`.toLowerCase()
    return fullName.includes(search.toLowerCase())
  })

  if (!user.facturadorId) {
    return (
      <div className="page-container">
        <div className="empty-state" style={{ marginTop: '4rem' }}>
          <div className="empty-icon">⏳</div>
          <h3>Esperando Vinculación</h3>
          <p>Aún no has sido vinculado a un Facturador. Entrégale este código a tu Facturador para que te agregue a su equipo:</p>
          <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: '8px', marginTop: '1rem', display: 'inline-block', fontSize: '1.2rem', fontWeight: 'bold', letterSpacing: '2px', border: '1px dashed var(--accent)' }}>
            {user.linkCode || 'CARGANDO...'}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container" style={{ paddingBottom: '5rem' }}>
      <div className="page-header">
        <h1 className="page-title">📦 Inventario de Almacén</h1>
        <p className="page-subtitle">Actualiza las ubicaciones y el nivel de stock para informar a ventas.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: editingItem ? '1fr 1fr' : '1fr', gap: '1.5rem', transition: 'all 0.3s' }}>
        
        {/* Left: Product List */}
        <div className="card">
          <input 
            type="text" 
            className="form-input" 
            placeholder="Buscar producto por nombre..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ marginBottom: '1rem' }}
          />
          
          <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
            {loading && <p style={{color:'var(--text-muted)'}}>Cargando catálogo...</p>}
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {filteredProducts.map(p => {
                const invItem = inventory.find(i => i.product?._id === p._id)
                const stock = invItem ? STOCK_LEVELS[invItem.stockLevel] : STOCK_LEVELS['none']
                const isEditing = editingItem?.prod._id === p._id

                return (
                  <div 
                    key={p._id} 
                    onClick={() => openEditor(p)}
                    style={{ 
                      padding: '1rem', 
                      background: isEditing ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255,255,255,0.03)', 
                      border: `1px solid ${isEditing ? 'var(--accent)' : 'var(--border)'}`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}
                  >
                    <div>
                      <strong style={{ display: 'block', marginBottom: '4px' }}>
                        {[p.category, ...(p.variants || [])].filter(Boolean).join(' ')}
                      </strong>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {invItem ? `Ubicación: ${invItem.ubicacion || 'N/A'} | Cód: ${invItem.codigo}` : 'No registrado en almacén'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '0.85rem', color: stock.color, fontWeight: 'bold' }}>
                      {stock.label}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right: Editor Modal/Panel */}
        {editingItem && (
          <div className="card" style={{ position: 'sticky', top: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
              <h2 className="card-title" style={{ margin: 0 }}>Actualizar Stock</h2>
              <button onClick={() => setEditingItem(null)} className="btn-remove">✕</button>
            </div>

            <h3 style={{ margin: '0 0 1.5rem 0', color: 'var(--accent)' }}>
              {[editingItem.prod.category, ...(editingItem.prod.variants || [])].filter(Boolean).join(' ')}
            </h3>

            <form onSubmit={handleSave}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Código Interno (SKU/ID) *</label>
                <input type="text" className="form-input" value={form.codigo} onChange={e => setForm({...form, codigo: e.target.value})} required placeholder="Ej: M-NEG-72" />
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Ubicación en Almacén</label>
                <input type="text" className="form-input" value={form.ubicacion} onChange={e => setForm({...form, ubicacion: e.target.value})} placeholder="Ej: Pasillo A, Estante 3" />
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Nivel de Stock *</label>
                <select className="form-input" value={form.stockLevel} onChange={e => setForm({...form, stockLevel: e.target.value})} style={{ color: STOCK_LEVELS[form.stockLevel].color, fontWeight: 'bold' }}>
                  {Object.entries(STOCK_LEVELS).map(([key, data]) => (
                    <option key={key} value={key}>{data.label}</option>
                  ))}
                </select>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={saving}>
                {saving ? 'Guardando...' : '💾 Guardar Cambios'}
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  )
}
