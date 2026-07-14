import { useState, useEffect } from 'react'
import { getCatalogProducts, searchCatalog, createCatalogProduct, updateCatalogProduct, deleteCatalogProduct } from '../api/api'

export default function PriceCalculator({ user }) {
  // Access control
  if (user?.role !== 'admin') {
    return (
      <div className="page-container">
        <div className="empty-state" style={{ marginTop: '4rem' }}>
          <div className="empty-icon">🚧</div>
          <h3>Creación de funcionalidad en proceso</h3>
          <p>Esta herramienta estará disponible próximamente para todos los facturadores.</p>
        </div>
      </div>
    )
  }

  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  // Form state
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({
    category: '',
    variants: [],
    calcMode: 'unit',
    basePrice: 0
  })

  // Calculator inputs state
  const [calcInputs, setCalcInputs] = useState({
    length: 1,
    width: 1,
    quantity: 1
  })

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const { data } = await getCatalogProducts()
      setProducts(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (val) => {
    setSearch(val)
    if (val.length > 1) {
      try {
        const { data } = await searchCatalog(val)
        setProducts(data)
      } catch (err) {
        console.error(err)
      }
    } else {
      fetchProducts()
    }
  }

  const selectProduct = (prod) => {
    setEditingId(prod._id)
    setForm({
      category: prod.category,
      variants: prod.variants || [],
      calcMode: prod.calcMode,
      basePrice: prod.basePrice
    })
    setCalcInputs({ length: 1, width: 1, quantity: 1 })
  }

  const handleNew = () => {
    setEditingId(null)
    setForm({
      category: '',
      variants: [],
      calcMode: 'unit',
      basePrice: 0
    })
    setCalcInputs({ length: 1, width: 1, quantity: 1 })
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (editingId) {
        await updateCatalogProduct(editingId, form)
        alert('Producto actualizado correctamente')
      } else {
        const { data } = await createCatalogProduct(form)
        setEditingId(data._id)
        alert('Producto creado y guardado en el catálogo')
      }
      fetchProducts()
    } catch (err) {
      alert(err.response?.data?.error || 'Error al guardar el producto')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveAsNew = async () => {
    if (!form.category || form.basePrice < 0) {
      alert('Por favor completa todos los campos requeridos (*)');
      return;
    }
    setLoading(true)
    try {
      // Intentar crear un nuevo producto con los mismos datos
      const { data } = await createCatalogProduct(form)
      setEditingId(data._id)
      alert('Producto guardado como copia nueva')
      fetchProducts()
    } catch (err) {
      alert(err.response?.data?.error || 'Error al guardar el nuevo producto (¿Tal vez el nombre ya existe?)')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar este producto del catálogo?')) return;
    try {
      await deleteCatalogProduct(id)
      if (editingId === id) handleNew()
      fetchProducts()
    } catch(err) {
      alert('Error eliminando producto')
    }
  }

  // Final calculation logic
  let finalCost = 0
  let area = 0
  if (form.calcMode === 'area') {
    area = calcInputs.length * calcInputs.width
    finalCost = area * form.basePrice
  } else {
    finalCost = calcInputs.quantity * form.basePrice
  }

  return (
    <div className="page-container" style={{ paddingBottom: '5rem' }}>
      <div className="page-header">
        <h1 className="page-title">🧮 Calculadora de Precios (Admin)</h1>
        <p className="page-subtitle">Crea productos base y automatiza su cotización por área o unidad.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        
        {/* Left Column: Product Search & List */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 className="card-title" style={{ margin: 0 }}>📚 Catálogo</h2>
            <button onClick={handleNew} className="btn btn-secondary btn-sm">+ Nuevo</button>
          </div>
          
          <input 
            type="text" 
            className="form-input" 
            placeholder="Buscar producto o categoría..." 
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            style={{ marginBottom: '1rem' }}
          />

          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {loading && <p style={{color:'var(--text-muted)'}}>Cargando...</p>}
            {!loading && products.length === 0 && <p style={{color:'var(--text-muted)'}}>No hay productos registrados.</p>}
            
            {products.map(p => (
              <div 
                key={p._id} 
                onClick={() => selectProduct(p)}
                style={{ 
                  padding: '1rem', 
                  background: editingId === p._id ? 'var(--bg-input)' : 'transparent',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  marginBottom: '0.5rem',
                  cursor: 'pointer',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}
              >
                <div>
                  <strong>{p.name}</strong>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {p.category} {p.variants && p.variants.length > 0 && `(${p.variants.length} variantes)`}
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.9rem' }}>
                  <div style={{ color: 'var(--accent)', fontWeight: 'bold' }}>S/ {p.basePrice.toFixed(2)}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {p.calcMode === 'area' ? 'por m²' : 'por unidad'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Editor & Calculator */}
        <div className="card">
          <div style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
            <h2 className="card-title" style={{ marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              {editingId ? '✏️ EDITAR PRODUCTO' : '✨ NUEVO PRODUCTO'}
            </h2>
            <h3 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--accent)', minHeight: '35px' }}>
              {[form.category, ...form.variants].filter(Boolean).join(' ') || 'Escribe una categoría...'}
            </h3>
          </div>
          
          <form onSubmit={handleSave} className="form-group" style={{ marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
            
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Categoría *</label>
              <input type="text" className="form-input" value={form.category} onChange={e => setForm({...form, category: e.target.value})} required placeholder="Ej: Malla" />
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label className="form-label" style={{ margin: 0 }}>Variantes</label>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setForm({...form, variants: [...form.variants, '']})}>
                  + Añadir Variante
                </button>
              </div>
              
              {form.variants.length === 0 && <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Sin variantes. (Ej: color, tamaño, espesor)</p>}
              
              {form.variants.map((variant, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={variant} 
                    onChange={e => {
                      const newVars = [...form.variants];
                      newVars[idx] = e.target.value;
                      setForm({...form, variants: newVars});
                    }} 
                    placeholder={`Variante ${idx + 1} (Ej: negra)`}
                    required
                  />
                  <button type="button" className="btn-remove" onClick={() => {
                    const newVars = form.variants.filter((_, i) => i !== idx);
                    setForm({...form, variants: newVars});
                  }}>✕</button>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label">Modo de Cálculo *</label>
                <select className="form-input" value={form.calcMode} onChange={e => setForm({...form, calcMode: e.target.value})}>
                  <option value="unit">Por Unidad / Servicio</option>
                  <option value="area">Por Área (m²)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Precio Base (S/) *</label>
                <input type="number" step="0.01" min="0" className="form-input" value={form.basePrice} onChange={e => setForm({...form, basePrice: parseFloat(e.target.value) || 0})} required />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1, minWidth: '150px' }} disabled={loading}>
                {loading ? 'Guardando...' : '💾 Guardar'}
              </button>
              {editingId && (
                <>
                  <button type="button" onClick={handleSaveAsNew} className="btn btn-secondary" style={{ flex: 1, minWidth: '150px' }} disabled={loading}>
                    📝 Guardar como Copia
                  </button>
                  <button type="button" onClick={() => handleDelete(editingId)} className="btn btn-secondary" style={{ color: '#ef4444', borderColor: '#ef4444', flexShrink: 0 }}>
                    🗑️
                  </button>
                </>
              )}
            </div>
          </form>

          {/* Test Calculator Section */}
          <div style={{ background: 'rgba(15,23,42,0.4)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--accent)' }}>🧪 Prueba de Cotización</h3>
            
            {form.calcMode === 'area' ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label className="form-label">Largo (m)</label>
                  <input type="number" step="0.01" min="0" className="form-input" value={calcInputs.length} onChange={e => setCalcInputs({...calcInputs, length: parseFloat(e.target.value) || 0})} />
                </div>
                <div>
                  <label className="form-label">Ancho (m)</label>
                  <input type="number" step="0.01" min="0" className="form-input" value={calcInputs.width} onChange={e => setCalcInputs({...calcInputs, width: parseFloat(e.target.value) || 0})} />
                </div>
              </div>
            ) : (
              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label">Cantidad (Unidades)</label>
                <input type="number" step="0.01" min="0" className="form-input" value={calcInputs.quantity} onChange={e => setCalcInputs({...calcInputs, quantity: parseFloat(e.target.value) || 0})} />
              </div>
            )}

            <div style={{ background: '#000', padding: '1rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                  {form.calcMode === 'area' ? `Área Total: ${area.toFixed(2)} m²` : 'Total Unidades'}
                </span>
                <div style={{ fontSize: '0.9rem' }}>Precio Base: S/ {form.basePrice.toFixed(2)}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Costo Final</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent)' }}>
                  S/ {finalCost.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}
