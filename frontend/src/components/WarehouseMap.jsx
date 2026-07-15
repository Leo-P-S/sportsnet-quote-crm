import { useState, useEffect } from 'react'
import { getShelves, updateShelf, getCatalogProducts, getInventory, updateInventory } from '../api/api'

export default function WarehouseMap({ user }) {
  const [shelves, setShelves] = useState([])
  const [activeShelf, setActiveShelf] = useState(null)
  const [loading, setLoading] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState(null) // para asignar inventario
  const [catalog, setCatalog] = useState([])
  const [inventory, setInventory] = useState([]) // all inventory items

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
    fetchData() // refresh to show newly assigned stuff
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
      <div className="page-header" style={{ marginBottom: '1rem' }}>
        <h1 className="page-title">🗺️ Mapa 2D del Almacén</h1>
        <p className="page-subtitle">Visualiza y asigna productos en las estanterías.</p>
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
          <h2 className="card-title" style={{ color: activeShelf.color, textAlign: 'center', marginBottom: '2rem' }}>
            {activeShelf.name} (Vista Frontal)
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateRows: `repeat(${activeShelf.gridRows}, 60px)`,
            gridTemplateColumns: `repeat(${activeShelf.gridCols}, minmax(40px, 1fr))`,
            gap: '4px',
            backgroundColor: '#1e293b',
            padding: '10px',
            borderRadius: '8px',
            minWidth: `${activeShelf.gridCols * 40}px` // Ensure it doesn't crush on small screens
          }}>
            {activeShelf.slots.map((slot, idx) => {
              const hasProducts = slot.inventoryIds && slot.inventoryIds.length > 0;
              return (
                <div 
                  key={idx}
                  onClick={() => handleSlotClick(slot)}
                  style={{
                    gridRow: `${slot.rowId + 1} / span ${slot.rowSpan}`,
                    gridColumn: `${slot.colId + 1} / span ${slot.colSpan}`,
                    backgroundColor: activeShelf.color,
                    border: '2px solid rgba(0,0,0,0.5)',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                    position: 'relative'
                  }}
                  title={`Fila ${slot.rowId + 1}, Col ${slot.colId + 1}`}
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
              Fila {selectedSlot.rowId + 1}, Columna {selectedSlot.colId + 1}
            </p>

            <div style={{ marginBottom: '1.5rem' }}>
              <h4>Productos Asignados ({selectedSlot.inventoryIds?.length || 0}/3)</h4>
              {selectedSlot.inventoryIds?.length > 0 ? (
                <ul style={{ listStyle: 'none', padding: 0, margin: '1rem 0' }}>
                  {selectedSlot.inventoryIds.map(invItem => (
                    <li key={invItem._id || invItem} style={{ 
                      background: 'rgba(255,255,255,0.05)', padding: '0.8rem', borderRadius: '8px', marginBottom: '0.5rem',
                      border: '1px solid var(--border)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <strong>{invItem.product?.name || 'Producto Desconocido'}</strong>
                        <span style={{ color: 'var(--accent)' }}>{invItem.currentQuantity || 0} {invItem.unitMeasure || 'Cocos'}</span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Cód: {invItem.codigo}</div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ color: 'var(--text-muted)' }}>No hay productos en este recuadro.</p>
              )}
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              Nota: En futuras actualizaciones podrás buscar productos del catálogo e insertarlos directamente aquí, restando cantidades al vender.
            </p>
          </div>
        </div>
      )}

    </div>
  )
}
