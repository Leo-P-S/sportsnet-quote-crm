import { useState, useEffect } from 'react'
import { getShelves, createShelf, updateShelf, deleteShelf, getCatalogProducts, getInventory, updateInventory } from '../api/api'

export default function WarehouseMap({ user }) {
  const [shelves, setShelves] = useState([])
  const [activeShelf, setActiveShelf] = useState(null)
  const [loading, setLoading] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState(null) // para asignar inventario
  const [catalog, setCatalog] = useState([])
  const [inventory, setInventory] = useState([]) // all inventory items

  // Builder State
  const [showBuilder, setShowBuilder] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [shelfForm, setShelfForm] = useState({ name: '', color: '#ef4444', gridRows: 3, gridCols: 5 })
  const [assigningInv, setAssigningInv] = useState('')
  const [quantities, setQuantities] = useState({}) // { invId: currentQuantity }

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [shelvesRes, catalogRes, inventoryRes] = await Promise.all([
        getShelves(),
        getCatalogProducts(),
        getInventory()
      ])
      setShelves(shelvesRes.data)
      setCatalog(catalogRes.data)
      setInventory(inventoryRes.data)
      if (shelvesRes.data.length > 0 && !activeShelf) {
        setActiveShelf(shelvesRes.data[0])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSlotClick = (slot) => {
    setSelectedSlot(slot)
  }

  const handleCloseModal = () => {
    setSelectedSlot(null)
    setAssigningInv('')
    fetchData() // refresh to show newly assigned stuff
  }

  const handleCreateShelf = async (e) => {
    e.preventDefault()
    try {
      const { name, color, gridRows, gridCols } = shelfForm
      
      if (isEditing) {
        // En modo Canvas, la edición del "tamaño" global (filas/columnas) no es tan relevante porque el usuario es dueño del lienzo.
        // Pero si cambian el tamaño, lo permitimos y no borramos slots.
        await updateShelf(activeShelf._id, { name, color, gridRows, gridCols })
      } else {
        const slots = []
        // Generar malla inicial en porcentajes
        const wPct = 100 / gridCols
        const hPct = 100 / gridRows
        for(let r=0; r<gridRows; r++) {
          for(let c=0; c<gridCols; c++) {
            slots.push({ rowId: (r * hPct), colId: (c * wPct), colSpan: wPct, rowSpan: hPct })
          }
        }
        await createShelf({ name, color, gridRows, gridCols, slots })
      }
      
      setShowBuilder(false)
      setIsEditing(false)
      fetchData()
    } catch (err) {
      alert(isEditing ? 'Error editando estante' : 'Error creando estante')
    }
  }

  const openEditShelf = () => {
    if (!activeShelf) return
    setIsEditing(true)
    setShelfForm({
      name: activeShelf.name,
      color: activeShelf.color,
      gridRows: activeShelf.gridRows,
      gridCols: activeShelf.gridCols
    })
    setShowBuilder(true)
  }

  const handleDeleteShelf = async () => {
    if (!activeShelf) return
    const confirmed = window.confirm(`¿Estás seguro de que deseas eliminar el estante "${activeShelf.name}"? Esta acción no se puede deshacer. Los productos asignados a este estante quedarán sin ubicación en el inventario.`)
    if (!confirmed) return
    
    try {
      await deleteShelf(activeShelf._id)
      setActiveShelf(null)
      setShowBuilder(false)
      setIsEditing(false)
      fetchData()
    } catch (err) {
      alert('Error eliminando estante')
    }
  }

  const handleUpdateSlotCoord = (field, value) => {
    const updatedSlots = [...activeShelf.slots]
    const index = updatedSlots.findIndex(s => s._id === selectedSlot._id)
    if (index === -1) return
    updatedSlots[index] = { ...updatedSlots[index], [field]: Number(value) }
    
    setActiveShelf({ ...activeShelf, slots: updatedSlots })
    setSelectedSlot(updatedSlots[index])
  }

  const handleSaveSlotSize = async () => {
    try {
       await updateShelf(activeShelf._id, { slots: activeShelf.slots })
       fetchData()
       alert('Dimensiones guardadas')
    } catch (err) {
       alert('Error guardando dimensiones')
    }
  }

  const handleCloneSlot = async () => {
    try {
      const updatedSlots = [...activeShelf.slots]
      updatedSlots.push({
         rowId: (selectedSlot.rowId + 5) % 100,
         colId: (selectedSlot.colId + 5) % 100,
         colSpan: selectedSlot.colSpan,
         rowSpan: selectedSlot.rowSpan,
         inventoryIds: []
      })
      const res = await updateShelf(activeShelf._id, { slots: updatedSlots })
      setActiveShelf(res.data)
      setSelectedSlot(res.data.slots[res.data.slots.length - 1])
    } catch (err) {
      alert('Error clonando recuadro')
    }
  }

  const handleDeleteSlot = async () => {
    if (!window.confirm("¿Seguro que quieres eliminar esta caja? (Sus productos quedarán sin asignar)")) return
    try {
      const updatedSlots = activeShelf.slots.filter(s => s._id !== selectedSlot._id)
      const res = await updateShelf(activeShelf._id, { slots: updatedSlots })
      setActiveShelf(res.data)
      setSelectedSlot(null)
    } catch (err) {
      alert('Error eliminando recuadro')
    }
  }

  const handleAssignToSlot = async () => {
    if (!assigningInv) return
    try {
      const updatedSlots = [...activeShelf.slots]
      const slotIndex = updatedSlots.findIndex(s => s._id === selectedSlot._id)
      
      if (!updatedSlots[slotIndex].inventoryIds) updatedSlots[slotIndex].inventoryIds = []
      if (updatedSlots[slotIndex].inventoryIds.length >= 3) {
        return alert('Máximo 3 productos por recuadro')
      }
      updatedSlots[slotIndex].inventoryIds.push(assigningInv)
      
      await updateShelf(activeShelf._id, { slots: updatedSlots })
      setAssigningInv('')
      
      // Update local state temporarily to avoid re-fetching whole map instantly if not needed
      // But fetching is safer
      fetchData()
      setSelectedSlot(updatedSlots[slotIndex]) // keep open but might need to refind it after fetch
    } catch (err) {
      alert('Error asignando producto')
    }
  }

  const handleRemoveFromSlot = async (invId) => {
    try {
      const updatedSlots = [...activeShelf.slots]
      const slotIndex = updatedSlots.findIndex(s => s._id === selectedSlot._id)
      updatedSlots[slotIndex].inventoryIds = updatedSlots[slotIndex].inventoryIds.filter(i => {
        const idStr = typeof i === 'object' ? i._id : i;
        return idStr !== invId;
      })
      
      await updateShelf(activeShelf._id, { slots: updatedSlots })
      fetchData()
      setSelectedSlot(updatedSlots[slotIndex])
    } catch (err) {
      alert('Error quitando producto')
    }
  }

  const handleUpdateQuantity = async (invId) => {
    try {
      await updateInventory(invId, { currentQuantity: quantities[invId] || 0 })
      alert('Cantidad actualizada')
      fetchData()
    } catch (err) {
      alert('Error actualizando cantidad')
    }
  }

  if (loading && shelves.length === 0) return <div className="page-container"><p>Cargando mapa...</p></div>

  if (shelves.length === 0) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">🗺️ Mapa del Almacén</h1>
          <p className="page-subtitle">Aún no hay estantes creados.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="page-header" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">🗺️ Mapa 2D del Almacén</h1>
          <p className="page-subtitle">Visualiza y asigna productos en las estanterías.</p>
        </div>
        <button className="btn btn-primary" onClick={() => {
          setIsEditing(false)
          setShelfForm({ name: '', color: '#ef4444', gridRows: 3, gridCols: 5 })
          setShowBuilder(true)
        }}>+ Nuevo Estante</button>
      </div>

      {/* Selector de Estante */}
      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '1rem', marginBottom: '1rem' }}>
        {shelves.map(shelf => (
          <button 
            key={shelf._id}
            onClick={() => setActiveShelf(shelf)}
            className={`btn ${activeShelf?._id === shelf._id ? 'btn-primary' : 'btn-secondary'}`}
            style={{ 
              backgroundColor: activeShelf?._id === shelf._id ? shelf.color : 'transparent',
              borderColor: shelf.color,
              color: activeShelf?._id === shelf._id ? '#fff' : shelf.color,
              whiteSpace: 'nowrap'
            }}
          >
            {shelf.name}
          </button>
        ))}
      </div>

      {/* Renderizado del Estante Activo */}
      {activeShelf && (
        <div className="card" style={{ overflowX: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '2rem', gap: '1rem' }}>
            <h2 className="card-title" style={{ color: activeShelf.color, margin: 0 }}>
              {activeShelf.name} (Vista Frontal)
            </h2>
            <button onClick={openEditShelf} className="btn btn-secondary btn-sm" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}>✏️ Editar</button>
          </div>
          
          <div style={{
            position: 'relative',
            width: '100%',
            height: `${Math.max(300, activeShelf.gridRows * 80)}px`,
            backgroundColor: '#000',
            border: '4px solid #000',
            boxSizing: 'border-box'
          }}>
            {activeShelf.slots.map((slot, idx) => {
              const hasProducts = slot.inventoryIds && slot.inventoryIds.length > 0;
              return (
                <div 
                  key={idx}
                  onClick={() => handleSlotClick(slot)}
                  style={{
                    position: 'absolute',
                    left: `${slot.colId}%`,
                    top: `${slot.rowId}%`,
                    width: `${slot.colSpan}%`,
                    height: `${slot.rowSpan}%`,
                    backgroundColor: activeShelf.color,
                    border: '2px solid #000',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                    boxSizing: 'border-box'
                  }}
                  title={`Caja X: ${Number(slot.colId).toFixed(1)}%, Y: ${Number(slot.rowId).toFixed(1)}%`}
                  onMouseOver={(e) => e.currentTarget.style.filter = 'brightness(1.2)'}
                  onMouseOut={(e) => e.currentTarget.style.filter = 'brightness(1)'}
                >
                  {hasProducts && (
                    <span style={{ 
                      background: 'white', color: 'black', borderRadius: '50%', 
                      width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.8rem', fontWeight: 'bold'
                    }}>
                      {slot.inventoryIds.length}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Modal para asignar productos */}
      {selectedSlot && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0 }}>Gestión de Recuadro</h3>
              <button onClick={handleCloseModal} className="btn-remove">✕</button>
            </div>
            
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
              ID: {selectedSlot._id?.substring(0, 8) || 'Nueva caja'}
            </p>

            <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                <h4 style={{ margin: 0 }}>Modo Canvas Absoluto</h4>
                <div>
                  <button onClick={handleCloneSlot} className="btn btn-secondary btn-sm" style={{ marginRight: '5px' }}>📄 Clonar</button>
                  <button onClick={handleDeleteSlot} className="btn-remove btn-sm">🗑️ Borrar</button>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label style={{ fontSize: '0.8rem' }}>Eje X (%)</label>
                  <input type="number" step="any" className="form-input" value={selectedSlot.colId} onChange={(e) => handleUpdateSlotCoord('colId', e.target.value)} />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '0.8rem' }}>Eje Y (%)</label>
                  <input type="number" step="any" className="form-input" value={selectedSlot.rowId} onChange={(e) => handleUpdateSlotCoord('rowId', e.target.value)} />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '0.8rem' }}>Ancho (%)</label>
                  <input type="number" step="any" className="form-input" value={selectedSlot.colSpan} onChange={(e) => handleUpdateSlotCoord('colSpan', e.target.value)} />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '0.8rem' }}>Alto (%)</label>
                  <input type="number" step="any" className="form-input" value={selectedSlot.rowSpan} onChange={(e) => handleUpdateSlotCoord('rowSpan', e.target.value)} />
                </div>
              </div>
              <button onClick={handleSaveSlotSize} className="btn btn-primary btn-sm" style={{ width: '100%', marginTop: '10px' }}>Guardar Posición y Tamaño</button>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <h4>Productos Asignados ({selectedSlot.inventoryIds?.length || 0}/3)</h4>
              {selectedSlot.inventoryIds?.length > 0 ? (
                <ul style={{ listStyle: 'none', padding: 0, margin: '1rem 0' }}>
                  {selectedSlot.inventoryIds.map(invItem => (
                    <li key={invItem._id || invItem} style={{ 
                      background: 'rgba(255,255,255,0.05)', padding: '0.8rem', borderRadius: '8px', marginBottom: '0.5rem',
                      border: '1px solid var(--border)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <strong>{invItem.product?.name || 'Producto Desconocido'}</strong>
                        <button onClick={() => handleRemoveFromSlot(invItem._id)} style={{background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer'}}>Quitar</button>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <input 
                          type="number" 
                          className="form-input" 
                          style={{ width: '100px', padding: '0.4rem' }}
                          placeholder="Cantidad"
                          value={quantities[invItem._id] !== undefined ? quantities[invItem._id] : (invItem.currentQuantity || 0)}
                          onChange={(e) => setQuantities({...quantities, [invItem._id]: Number(e.target.value)})}
                        />
                        <span style={{ color: 'var(--text-secondary)' }}>{invItem.unitMeasure || 'Cocos'}</span>
                        <button onClick={() => handleUpdateQuantity(invItem._id)} className="btn btn-secondary btn-sm">Guardar</button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ color: 'var(--text-muted)' }}>No hay productos en este recuadro.</p>
              )}
            </div>

            {(!selectedSlot.inventoryIds || selectedSlot.inventoryIds.length < 3) && (
              <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                <h4>Añadir Producto al Recuadro</h4>
                <div style={{ display: 'flex', gap: '10px', marginTop: '0.5rem' }}>
                  <select 
                    className="form-input" 
                    value={assigningInv} 
                    onChange={e => setAssigningInv(e.target.value)}
                  >
                    <option value="">Selecciona del inventario...</option>
                    {inventory.map(inv => (
                      <option key={inv._id} value={inv._id}>
                        {inv.product?.name} (Cód: {inv.codigo})
                      </option>
                    ))}
                  </select>
                  <button onClick={handleAssignToSlot} className="btn btn-primary" disabled={!assigningInv}>Agregar</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Creador de Estantes */}
      {showBuilder && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0 }}>{isEditing ? 'Editar Estante' : 'Construir Nuevo Estante'}</h3>
              {isEditing && (
                <button type="button" onClick={handleDeleteShelf} className="btn-remove" style={{ width: 'auto', padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem' }}>🗑️ Eliminar</button>
              )}
            </div>
            <form onSubmit={handleCreateShelf}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Nombre del Estante</label>
                <input type="text" className="form-input" required value={shelfForm.name} onChange={e => setShelfForm({...shelfForm, name: e.target.value})} placeholder="Ej. Estante F (Amarillo)" />
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Color (Hexadecimal o Nombre)</label>
                <input type="text" className="form-input" required value={shelfForm.color} onChange={e => setShelfForm({...shelfForm, color: e.target.value})} placeholder="#eab308" />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Filas</label>
                  <input type="number" min="1" max="20" className="form-input" required value={shelfForm.gridRows} onChange={e => setShelfForm({...shelfForm, gridRows: Number(e.target.value)})} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Columnas</label>
                  <input type="number" min="1" max="20" className="form-input" required value={shelfForm.gridCols} onChange={e => setShelfForm({...shelfForm, gridCols: Number(e.target.value)})} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowBuilder(false)} style={{ flex: 1 }}>Cancelar</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{isEditing ? 'Guardar Cambios' : 'Construir'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
