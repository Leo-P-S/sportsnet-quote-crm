import { useState, useEffect } from 'react'
import { createQuote, searchCustomers, createCustomer, getCatalogProducts } from '../api/api'
import InvoiceView from './InvoiceView'

const STOCK_LEVELS = {
  none: { emoji: '🔴', label: 'Sin stock' },
  low: { emoji: '🟠', label: 'Poco' },
  medium: { emoji: '🟡', label: 'Medio' },
  high: { emoji: '🟢', label: 'Mucho' },
  full: { emoji: '🔵', label: 'Completo' }
}

export default function QuoteForm({ onQuoteCreated, user }) {
  const [customerSearch, setCustomerSearch] = useState('')
  const [customer, setCustomer] = useState(null)
  const [customerSuggestions, setCustomerSuggestions] = useState([])
  
  const [customerMode, setCustomerMode] = useState('existing') // 'existing' | 'new'
  
  // Para cliente nuevo
  const [newCustomer, setNewCustomer] = useState({ name: '', ruc: '', address: '', contactInfo: '', aliases: '' })

  const [items, setItems] = useState([
    { quantity: 1, unit: 'UNIDAD', description: '', unitPrice: 0 }
  ])
  const [services, setServices] = useState([])

  const [igvMode, setIgvMode] = useState('add') // 'add', 'reverse', 'none'
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Catalog logic
  const [catalog, setCatalog] = useState([])
  const [inventory, setInventory] = useState([])
  const [focusedItemIndex, setFocusedItemIndex] = useState(null) // For autocomplete dropdown

  useEffect(() => {
    fetchCatalog()
  }, [])

  const fetchCatalog = async () => {
    try {
      const { data } = await getCatalogProducts()
      setCatalog(data)
      
      const invRes = await fetch('http://localhost:5000/api/inventory', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
      if (invRes.ok) {
        const invData = await invRes.json()
        setInventory(invData)
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Autocomplete logic
  const handleSearch = async (val) => {
    setCustomerSearch(val)

    if (val.length > 2) {
      try {
        const { data } = await searchCustomers(val)
        setCustomerSuggestions(data)
      } catch (err) {
        console.error(err)
      }
    } else {
      setCustomerSuggestions([])
    }
  }

  const selectCustomer = (c) => {
    setCustomer(c)
    setCustomerSearch(c.name)
    setCustomerSuggestions([])
  }

  // Items logic
  const addItem = () => setItems([...items, { quantity: 1, unit: 'UNIDAD', description: '', unitPrice: 0 }])
  
  const updateItem = (index, field, value) => {
    const newItems = [...items]
    newItems[index][field] = value
    setItems(newItems)
  }

  const selectUniversalProduct = (index, productId) => {
    const newItems = [...items]
    const prod = catalog.find(p => p._id === productId)
    if (prod) {
      newItems[index].description = prod.name
      newItems[index].unitPrice = prod.basePrice
      newItems[index].unit = prod.calcMode === 'area' ? 'M2' : 'UNIDAD'
    }
    setItems(newItems)
    setFocusedItemIndex(null)
  }

  const removeItem = (index) => setItems(items.filter((_, i) => i !== index))

  // Services logic
  const addService = () => setServices([...services, { quantity: 1, unit: 'SERVICIO', description: '', unitPrice: 0 }])
  const updateService = (index, field, value) => {
    const newServices = [...services]
    newServices[index][field] = value
    setServices(newServices)
  }
  const removeService = (index) => setServices(services.filter((_, i) => i !== index))

  // Calculate totals
  const allEntries = [...items, ...services]
  const rawSubtotal = allEntries.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
  
  let finalSubtotal = rawSubtotal
  let igv = 0
  let total = rawSubtotal

  if (igvMode === 'add') {
    igv = rawSubtotal * 0.18
    total = rawSubtotal + igv
  } else if (igvMode === 'reverse') {
    total = rawSubtotal
    finalSubtotal = total / 1.18
    igv = total - finalSubtotal
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (allEntries.length === 0 || rawSubtotal === 0) {
      setError('Añade al menos un producto o servicio con precio')
      return
    }

    if (customerMode === 'new' && (!newCustomer.name || !newCustomer.ruc)) {
      setError('Para un cliente nuevo debes llenar Nombre y RUC/DNI.')
      return
    }
    
    if (customerMode === 'existing' && !customer) {
      setError('Debes seleccionar un cliente existente de la lista.')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      let activeCustomerId = customer?._id;

      // Crear cliente si es nuevo
      if (customerMode === 'new') {
        const payloadCustomer = {
          name: newCustomer.name,
          ruc: newCustomer.ruc,
          address: newCustomer.address,
          contactInfo: newCustomer.contactInfo,
          aliases: newCustomer.aliases ? newCustomer.aliases.split(',').map(a => a.trim()) : []
        }
        const { data: createdCust } = await createCustomer(payloadCustomer)
        activeCustomerId = createdCust._id
        // Para que se pase a InvoiceView:
        setCustomer(createdCust)
      }

      const processedItems = allEntries.map(i => {
        return {
          quantity: i.quantity,
          unit: i.unit,
          description: i.description,
          unitPrice: i.unitPrice,
          totalPrice: i.quantity * i.unitPrice
        }
      })

      const payload = {
        customer: activeCustomerId,
        items: processedItems,
        subtotal: finalSubtotal,
        igv: igv,
        total: total,
      }

      const { data } = await createQuote(payload)
      
      // Asignar el objeto de cliente populado al resultado para la vista PDF
      const fullQuote = { ...data, customer: customerMode === 'new' ? await searchCustomers(newCustomer.name).then(res => res.data[0]) : customer }
      
      setResult(fullQuote)
      onQuoteCreated(fullQuote)
    } catch (err) {
      setError(err.response?.data?.error || 'Error al generar la proforma')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setResult(null); 
    setItems([{ quantity: 1, unit: 'UNIDAD', description: '', unitPrice: 0 }]); 
    setServices([]); 
    setCustomer(null); 
    setNewCustomer({ name: '', ruc: '', address: '', contactInfo: '', aliases: '' }); 
    setCustomerSearch('');
  }

  return (
    <div className="page-container">
      {result ? (
        <InvoiceView data={result} user={user} onNew={resetForm} />
      ) : (
        <>
          <div className="page-header">
            <h1 className="page-title">Nueva Proforma</h1>
            <p className="page-subtitle">Genera proformas y facturas en PDF</p>
          </div>

          <form onSubmit={handleSubmit} className="invoice-form">
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 className="card-title" style={{ margin: 0 }}>👤 Datos del Cliente</h2>
                
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    type="button" 
                    className={`btn btn-sm ${customerMode === 'existing' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setCustomerMode('existing')}
                  >
                    Cliente Existente
                  </button>
                  <button 
                    type="button" 
                    className={`btn btn-sm ${customerMode === 'new' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setCustomerMode('new')}
                  >
                    + Nuevo Cliente
                  </button>
                </div>
              </div>

              {customerMode === 'existing' ? (
                <div className="form-grid">
                  <div className="form-group form-group-full autocomplete-wrapper">
                    <label className="form-label">Buscar cliente</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Escribe el Nombre o RUC del cliente registrado"
                      value={customerSearch}
                      onChange={(e) => {
                        setCustomer(null)
                        handleSearch(e.target.value)
                      }}
                    />
                    {customerSuggestions.length > 0 && (
                      <div className="autocomplete-dropdown">
                        {customerSuggestions.map(c => (
                          <div key={c._id} className="autocomplete-item" onClick={() => selectCustomer(c)}>
                            <strong>{c.name}</strong> {c.ruc && `(RUC: ${c.ruc})`}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {customer && (
                    <>
                      <div className="form-group">
                        <label className="form-label">RUC / DNI</label>
                        <input type="text" className="form-input" value={customer.ruc || '-'} readOnly />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Dirección</label>
                        <input type="text" className="form-input" value={customer.address || '-'} readOnly />
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="form-grid">
                  <div className="form-group form-group-full">
                    <label className="form-label">Nombre / Razón Social <span style={{color:'red'}}>*</span></label>
                    <input type="text" className="form-input" value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">RUC / DNI <span style={{color:'red'}}>*</span></label>
                    <input type="text" className="form-input" value={newCustomer.ruc} onChange={e => setNewCustomer({...newCustomer, ruc: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Celular / Teléfono</label>
                    <input type="text" className="form-input" value={newCustomer.contactInfo} onChange={e => setNewCustomer({...newCustomer, contactInfo: e.target.value})} />
                  </div>
                  <div className="form-group form-group-full">
                    <label className="form-label">Dirección Fiscal</label>
                    <input type="text" className="form-input" value={newCustomer.address} onChange={e => setNewCustomer({...newCustomer, address: e.target.value})} />
                  </div>
                  <div className="form-group form-group-full">
                    <label className="form-label">Alias (Separados por comas, para búsquedas futuras)</label>
                    <input type="text" className="form-input" placeholder="Ej: Don Pepe, Ferreteria Centro" value={newCustomer.aliases} onChange={e => setNewCustomer({...newCustomer, aliases: e.target.value})} />
                  </div>
                </div>
              )}
            </div>

            <div className="card" style={{ marginTop: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 className="card-title" style={{ margin: 0 }}>📦 Productos</h2>
                <button type="button" onClick={addItem} className="btn btn-secondary btn-sm">+ Agregar Producto</button>
              </div>

              <div className="items-list">
                {items.length === 0 && <p style={{color:'var(--text-muted)', fontSize:'0.9rem'}}>No hay productos.</p>}
                {items.map((item, index) => {
                  let suggestions = []
                  if (focusedItemIndex === index && item.description.length > 1) {
                    const searchTerms = item.description.toLowerCase().split(' ').filter(Boolean)
                    suggestions = catalog.filter(p => {
                      const pName = p.name.toLowerCase()
                      return searchTerms.every(term => pName.includes(term))
                    }).slice(0, 8)
                  }

                  return (
                    <div key={index} className="item-row" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                      <input type="number" step="0.01" className="form-input" placeholder="Cant." style={{ width: '80px', flexShrink: 0 }} value={item.quantity} onChange={e => updateItem(index, 'quantity', parseFloat(e.target.value))} required />
                      <select className="form-input" style={{ width: '130px', flexShrink: 0 }} value={item.unit} onChange={e => updateItem(index, 'unit', e.target.value)}>
                        <option>UNIDAD</option>
                        <option>METROS</option>
                        <option>ROLLO</option>
                        <option>M2</option>
                      </select>
                      
                      <div className="autocomplete-wrapper" style={{ flex: 1, minWidth: '150px' }}>
                        <input 
                          type="text" 
                          className="form-input" 
                          placeholder="Descripción del producto o categoría" 
                          value={item.description} 
                          onChange={e => updateItem(index, 'description', e.target.value)} 
                          onFocus={() => setFocusedItemIndex(index)}
                          onBlur={() => setTimeout(() => setFocusedItemIndex(null), 200)}
                          required 
                        />
                        {suggestions.length > 0 && (
                          <div className="autocomplete-dropdown" style={{ zIndex: 100 }}>
                            {suggestions.map(prod => {
                              const invItem = inventory.find(i => i.product?._id === prod._id || i.product === prod._id)
                              const stock = invItem ? STOCK_LEVELS[invItem.stockLevel] : STOCK_LEVELS['none']
                              return (
                                <div key={prod._id} className="autocomplete-item" onClick={() => selectUniversalProduct(index, prod._id)} style={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <strong>{prod.name}</strong>
                                  <span title={`Stock: ${stock.label}`}>{stock.emoji}</span>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>

                      <input type="number" step="0.01" className="form-input" placeholder="Precio Unit." style={{ width: '110px', flexShrink: 0 }} value={item.unitPrice} onChange={e => updateItem(index, 'unitPrice', parseFloat(e.target.value))} required />
                      <div className="item-total" style={{ width: '90px', flexShrink: 0, marginTop: '10px' }}>S/ {(item.quantity * item.unitPrice).toFixed(2)}</div>
                      <button type="button" className="btn-remove" style={{ flexShrink: 0, marginTop: '5px' }} onClick={() => removeItem(index)}>✕</button>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="card" style={{ marginTop: '1.5rem', borderLeft: '4px solid #8b5cf6' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 className="card-title" style={{ margin: 0 }}>🛠️ Servicios</h2>
                <button type="button" onClick={addService} className="btn btn-secondary btn-sm" style={{borderColor: '#8b5cf6', color: '#8b5cf6'}}>+ Agregar Servicio</button>
              </div>

              <div className="items-list">
                {services.length === 0 && <p style={{color:'var(--text-muted)', fontSize:'0.9rem'}}>No hay servicios añadidos.</p>}
                {services.map((svc, index) => (
                  <div key={index} className="item-row">
                    <input type="number" step="0.01" className="form-input" placeholder="Cant." style={{ width: '80px', flexShrink: 0 }} value={svc.quantity} onChange={e => updateService(index, 'quantity', parseFloat(e.target.value))} required />
                    <select className="form-input" style={{ width: '130px', flexShrink: 0 }} value={svc.unit} onChange={e => updateService(index, 'unit', e.target.value)}>
                      <option>SERVICIO</option>
                      <option>GLOBAL</option>
                      <option>DIA</option>
                    </select>
                    <input type="text" className="form-input" placeholder="Descripción del servicio" style={{ flex: 1, minWidth: '150px' }} value={svc.description} onChange={e => updateService(index, 'description', e.target.value)} required />
                    <input type="number" step="0.01" className="form-input" placeholder="Costo Unit." style={{ width: '110px', flexShrink: 0 }} value={svc.unitPrice} onChange={e => updateService(index, 'unitPrice', parseFloat(e.target.value))} required />
                    <div className="item-total" style={{ width: '90px', flexShrink: 0 }}>S/ {(svc.quantity * svc.unitPrice).toFixed(2)}</div>
                    <button type="button" className="btn-remove" style={{ flexShrink: 0 }} onClick={() => removeService(index)}>✕</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="card" style={{ marginTop: '1.5rem' }}>
              <div className="totals-section" style={{marginTop: 0, paddingTop: 0, borderTop: 'none'}}>
                <div className="igv-options">
                  <label className="form-label">Modo de cálculo IGV (18%)</label>
                  <select className="form-input" value={igvMode} onChange={e => setIgvMode(e.target.value)}>
                    <option value="add">Sumar IGV al precio (Subtotal + IGV)</option>
                    <option value="reverse">Precio ya incluye IGV (Extraer IGV)</option>
                    <option value="none">Sin IGV (0%)</option>
                  </select>
                  {igvMode === 'reverse' && <small style={{color:'var(--text-muted)'}}>Los precios unitarios ingresados arriba se tratarán como el precio FINAL.</small>}
                </div>

                <div className="totals-box">
                  <div className="total-row"><span>Subtotal:</span> <span>S/ {finalSubtotal.toFixed(2)}</span></div>
                  <div className="total-row"><span>IGV:</span> <span>S/ {igv.toFixed(2)}</span></div>
                  <div className="total-row grand-total"><span>Total:</span> <span>S/ {total.toFixed(2)}</span></div>
                </div>
              </div>

              {error && <div className="alert alert-error" style={{marginTop:'1rem'}}>{error}</div>}

              <button type="submit" className={`btn btn-primary btn-block ${loading ? 'loading' : ''}`} disabled={loading} style={{marginTop:'1.5rem'}}>
                {loading ? 'Procesando...' : '📄 Generar Proforma'}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  )
}
