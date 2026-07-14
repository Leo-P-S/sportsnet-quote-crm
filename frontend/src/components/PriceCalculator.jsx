import { useState, useEffect } from 'react'
import { getCatalogProducts, searchCatalog, createCatalogProduct, updateCatalogProduct, deleteCatalogProduct, getInventory } from '../api/api'

const STOCK_LEVELS = {
  none: { emoji: '🔴', label: 'Sin stock' },
  low: { emoji: '🟠', label: 'Poco' },
  medium: { emoji: '🟡', label: 'Medio' },
  high: { emoji: '🟢', label: 'Mucho' },
  full: { emoji: '🔵', label: 'Completo' }
}

// Tree builder helpers
const buildVariantGroups = (products, level) => {
  if (products.length === 0) return []
  
  const hasVariantAtLevel = products.some(p => p.variants && p.variants.length > level)
  if (!hasVariantAtLevel) {
    return products.map(p => ({ type: 'product', data: p }))
  }

  const groups = {}
  const leaves = []

  products.forEach(p => {
    const v = p.variants && p.variants[level] ? p.variants[level] : null
    if (v) {
      if (!groups[v]) groups[v] = []
      groups[v].push(p)
    } else {
      leaves.push({ type: 'product', data: p })
    }
  })

  let result = [...leaves]

  Object.keys(groups).sort().forEach(vLabel => {
    const gProducts = groups[vLabel]
    if (gProducts.length > 3) {
      result.push({
        type: 'group',
        label: vLabel,
        children: buildVariantGroups(gProducts, level + 1)
      })
    } else {
      result = result.concat(gProducts.map(p => ({ type: 'product', data: p })))
    }
  })

  return result
}

const buildProductTree = (products) => {
  const categories = {}
  products.forEach(p => {
    if (!categories[p.category]) categories[p.category] = []
    categories[p.category].push(p)
  })

  const tree = []
  Object.keys(categories).sort().forEach(catName => {
    tree.push({
      type: 'category',
      label: catName,
      children: buildVariantGroups(categories[catName], 0)
    })
  })
  return tree
}

const TreeNode = ({ node, level, selectProduct, editingId, inventory }) => {
  const [expanded, setExpanded] = useState(false)
  const isCategory = node.type === 'category'
  const isGroup = node.type === 'group'
  
  if (node.type === 'product') {
    const p = node.data
    const invItem = inventory.find(i => i.product?._id === p._id || i.product === p._id)
    const stock = invItem ? STOCK_LEVELS[invItem.stockLevel] : STOCK_LEVELS['none']

    return (
      <div 
        onClick={() => selectProduct(p)}
        style={{ 
          padding: '0.75rem 1rem', 
          paddingLeft: `${1 + level * 1.5}rem`,
          background: editingId === p._id ? 'var(--bg-input)' : (level > 0 ? 'rgba(255,255,255,0.03)' : 'transparent'),
          borderBottom: '1px solid var(--border)',
          cursor: 'pointer',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}
      >
        <div>
          <strong style={{ fontSize: '0.9rem' }}>{p.name}</strong>
          <span title={`Stock: ${stock.label}`} style={{ marginLeft: '8px' }}>{stock.emoji}</span>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            {p.variants && p.variants.length > 0 && `(${p.variants.join(', ')})`}
          </div>
        </div>
        <div style={{ textAlign: 'right', fontSize: '0.85rem' }}>
          <div style={{ color: 'var(--accent)', fontWeight: 'bold' }}>S/ {p.basePrice.toFixed(2)}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            {p.calcMode === 'area' ? 'por m²' : 'por unidad'}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div 
        onClick={() => setExpanded(!expanded)}
        style={{
          padding: '0.75rem 1rem',
          paddingLeft: `${1 + (level > 0 ? level - 1 : 0) * 1.5}rem`,
          background: isCategory ? (level % 2 === 0 ? 'rgba(30, 41, 59, 0.8)' : 'rgba(15, 23, 42, 0.8)') : 'rgba(255,255,255,0.05)',
          borderBottom: '1px solid var(--border)',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          fontWeight: 'bold',
          color: isCategory ? 'var(--text)' : 'var(--text-secondary)'
        }}
      >
        <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>{expanded ? '▼' : '▶'}</span>
        {isCategory ? `📁 ${node.label}` : `📂 Variante: ${node.label}`}
        <span style={{ fontSize: '0.75rem', fontWeight: 'normal', color: 'var(--text-muted)', marginLeft: 'auto' }}>
          ({node.children.length} items)
        </span>
      </div>
      {expanded && (
        <div>
          {node.children.map((child, idx) => (
            <TreeNode key={idx} node={child} level={level + 1} selectProduct={selectProduct} editingId={editingId} inventory={inventory} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function PriceCalculator({ user }) {
  // Access control removed: Feature is now available to all users

  const [products, setProducts] = useState([])
  const [inventory, setInventory] = useState([])
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
      const [prodRes, invRes] = await Promise.all([
        getCatalogProducts(),
        getInventory()
      ])
      setProducts(prodRes.data)
      if (invRes.data) setInventory(invRes.data)
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
        <h1 className="page-title">🧮 Calculadora de Precios</h1>
        <p className="page-subtitle">Crea productos base y automatiza su cotización por área o unidad.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        
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
            
            {buildProductTree(products).map((node, idx) => (
              <TreeNode key={idx} node={node} level={0} selectProduct={selectProduct} editingId={editingId} inventory={inventory} />
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

            <div className="btn-stack-mobile" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
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
